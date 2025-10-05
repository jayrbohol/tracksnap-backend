-- TrackSnap Database Schema - Basic Version (PostgreSQL/Supabase)
-- Created: October 2025
-- Description: Simplified schema that works without additional extensions
-- Compatible with: Standard PostgreSQL 12+, Supabase

-- Create custom types
CREATE TYPE parcel_status AS ENUM ('pending', 'in_transit', 'delivered', 'flagged', 'cancelled');
CREATE TYPE location_type AS ENUM ('pickup', 'sortation_center', 'delivery_hub', 'destination');

-- =====================================================
-- MAIN TABLES
-- =====================================================

-- Parcels table - Core parcel information
CREATE TABLE parcels (
    id VARCHAR(50) PRIMARY KEY,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_address TEXT NOT NULL,
    recipient_formatted_address TEXT,
    recipient_lat DECIMAL(10,8),
    recipient_lng DECIMAL(11,8),
    
    -- Pickup location
    pickup_address TEXT,
    pickup_formatted_address TEXT,
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    
    -- Sortation center
    sortation_address TEXT,
    sortation_formatted_address TEXT,
    sortation_lat DECIMAL(10,8),
    sortation_lng DECIMAL(11,8),
    
    -- Delivery hub
    delivery_hub_address TEXT,
    delivery_hub_formatted_address TEXT,
    delivery_hub_lat DECIMAL(10,8),
    delivery_hub_lng DECIMAL(11,8),
    
    -- Parcel details
    status parcel_status DEFAULT 'pending',
    qr_code TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Computed distances (in meters)
    pickup_to_sortation_meters INTEGER,
    sortation_to_hub_meters INTEGER,
    hub_to_destination_meters INTEGER,
    sortation_to_destination_meters INTEGER,
    total_route_meters INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_recipient_coords CHECK (
        (recipient_lat IS NULL AND recipient_lng IS NULL) OR 
        (recipient_lat BETWEEN -90 AND 90 AND recipient_lng BETWEEN -180 AND 180)
    ),
    CONSTRAINT valid_pickup_coords CHECK (
        (pickup_lat IS NULL AND pickup_lng IS NULL) OR 
        (pickup_lat BETWEEN -90 AND 90 AND pickup_lng BETWEEN -180 AND 180)
    ),
    CONSTRAINT valid_sortation_coords CHECK (
        (sortation_lat IS NULL AND sortation_lng IS NULL) OR 
        (sortation_lat BETWEEN -90 AND 90 AND sortation_lng BETWEEN -180 AND 180)
    ),
    CONSTRAINT valid_delivery_hub_coords CHECK (
        (delivery_hub_lat IS NULL AND delivery_hub_lng IS NULL) OR 
        (delivery_hub_lat BETWEEN -90 AND 90 AND delivery_hub_lng BETWEEN -180 AND 180)
    )
);

-- Tracking log - GPS tracking events
CREATE TABLE tracking_events (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    altitude DECIMAL(8,2),
    accuracy DECIMAL(8,2),
    speed DECIMAL(8,2),
    heading DECIMAL(5,2),
    
    -- Additional context
    courier_id VARCHAR(50),
    device_id VARCHAR(100),
    battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    network_type VARCHAR(20),
    
    -- Computed fields
    distance_from_destination_meters INTEGER,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_coordinates CHECK (
        lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180
    )
);

-- Handoff log - Parcel handoff events
CREATE TABLE handoff_events (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    courier_id VARCHAR(50),
    
    -- GPS location of handoff
    gps_address TEXT,
    gps_formatted_address TEXT,
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    
    -- Evidence
    photo_url TEXT,
    signature_url TEXT,
    notes TEXT,
    
    -- Verification
    qr_scanned BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_gps_coords CHECK (
        (gps_lat IS NULL AND gps_lng IS NULL) OR 
        (gps_lat BETWEEN -90 AND 90 AND gps_lng BETWEEN -180 AND 180)
    )
);

-- Hub audit log - Changes to hub assignments
CREATE TABLE hub_audit_log (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor VARCHAR(255),
    action VARCHAR(50) NOT NULL, -- 'update_sortation', 'update_delivery_hub'
    
    -- Old values
    old_address TEXT,
    old_formatted_address TEXT,
    old_lat DECIMAL(10,8),
    old_lng DECIMAL(11,8),
    
    -- New values
    new_address TEXT,
    new_formatted_address TEXT,
    new_lat DECIMAL(10,8),
    new_lng DECIMAL(11,8),
    
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback - Customer feedback on deliveries
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR(50) NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    issue TEXT,
    comments TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Customer info (optional)
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Follow-up
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SUPPORTING TABLES
-- =====================================================

-- Couriers - Delivery personnel
CREATE TABLE couriers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    license_number VARCHAR(100),
    vehicle_type VARCHAR(50), -- 'motorcycle', 'van', 'truck', 'bicycle'
    vehicle_plate VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    verified BOOLEAN DEFAULT FALSE,
    
    -- Location tracking
    last_known_lat DECIMAL(10,8),
    last_known_lng DECIMAL(11,8),
    last_location_update TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    hire_date DATE,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_deliveries INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hubs - Physical locations (sortation centers, delivery hubs)
CREATE TABLE hubs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type location_type NOT NULL,
    
    -- Address information
    address TEXT NOT NULL,
    formatted_address TEXT,
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    
    -- Contact info
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    
    -- Operational info
    capacity INTEGER,
    operating_hours JSONB, -- e.g., {"monday": "08:00-18:00", ...}
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_hub_coords CHECK (
        lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180
    )
);

-- Geocoding cache - Cache for address-to-coordinate conversions
CREATE TABLE geocoding_cache (
    id SERIAL PRIMARY KEY,
    address_input TEXT NOT NULL,
    address_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of normalized address
    
    -- Geocoding results
    formatted_address TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    country VARCHAR(100),
    country_code VARCHAR(2),
    admin_area_1 VARCHAR(100), -- State/Province
    admin_area_2 VARCHAR(100), -- City
    postal_code VARCHAR(20),
    
    -- Quality metrics
    accuracy VARCHAR(50), -- 'ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE'
    confidence DECIMAL(3,2), -- 0.00 to 1.00
    geocoding_service VARCHAR(50) DEFAULT 'nominatim', -- 'nominatim', 'google', 'mapbox'
    
    -- Cache management
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    use_count INTEGER DEFAULT 1
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Primary lookup indexes
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_created_at ON parcels(created_at DESC);
CREATE INDEX idx_parcels_recipient_phone ON parcels(recipient_phone);
CREATE INDEX idx_parcels_recipient_email ON parcels(recipient_email);

-- Location-based indexes (using standard btree)
CREATE INDEX idx_parcels_recipient_lat ON parcels(recipient_lat) WHERE recipient_lat IS NOT NULL;
CREATE INDEX idx_parcels_recipient_lng ON parcels(recipient_lng) WHERE recipient_lng IS NOT NULL;
CREATE INDEX idx_parcels_recipient_coords ON parcels(recipient_lat, recipient_lng) WHERE recipient_lat IS NOT NULL AND recipient_lng IS NOT NULL;
CREATE INDEX idx_tracking_events_lat ON tracking_events(lat);
CREATE INDEX idx_tracking_events_lng ON tracking_events(lng);
CREATE INDEX idx_tracking_events_coords ON tracking_events(lat, lng);
CREATE INDEX idx_couriers_location_lat ON couriers(last_known_lat) WHERE last_known_lat IS NOT NULL;
CREATE INDEX idx_couriers_location_lng ON couriers(last_known_lng) WHERE last_known_lng IS NOT NULL;
CREATE INDEX idx_hubs_lat ON hubs(lat);
CREATE INDEX idx_hubs_lng ON hubs(lng);
CREATE INDEX idx_hubs_coords ON hubs(lat, lng);

-- Time-based indexes
CREATE INDEX idx_tracking_events_timestamp ON tracking_events(timestamp DESC);
CREATE INDEX idx_tracking_events_parcel_timestamp ON tracking_events(parcel_id, timestamp DESC);
CREATE INDEX idx_handoff_events_timestamp ON handoff_events(timestamp DESC);
CREATE INDEX idx_feedback_timestamp ON feedback(timestamp DESC);

-- Foreign key indexes
CREATE INDEX idx_tracking_events_parcel_id ON tracking_events(parcel_id);
CREATE INDEX idx_handoff_events_parcel_id ON handoff_events(parcel_id);
CREATE INDEX idx_hub_audit_log_parcel_id ON hub_audit_log(parcel_id);
CREATE INDEX idx_feedback_parcel_id ON feedback(parcel_id);

-- Geocoding cache indexes
CREATE INDEX idx_geocoding_cache_hash ON geocoding_cache(address_hash);
CREATE INDEX idx_geocoding_cache_last_used ON geocoding_cache(last_used DESC);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_parcels_updated_at BEFORE UPDATE ON parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON couriers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hubs_updated_at BEFORE UPDATE ON hubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION haversine_distance(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS INTEGER AS $$
DECLARE
    R INTEGER := 6371000; -- Earth's radius in meters
    lat1_rad DECIMAL := radians(lat1);
    lat2_rad DECIMAL := radians(lat2);
    delta_lat DECIMAL := radians(lat2 - lat1);
    delta_lng DECIMAL := radians(lng2 - lng1);
    a DECIMAL;
    c DECIMAL;
BEGIN
    a := sin(delta_lat/2) * sin(delta_lat/2) + 
         cos(lat1_rad) * cos(lat2_rad) * 
         sin(delta_lng/2) * sin(delta_lng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN (R * c)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update parcel distances when locations change
CREATE OR REPLACE FUNCTION update_parcel_distances()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pickup to sortation distance
    IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL AND 
       NEW.sortation_lat IS NOT NULL AND NEW.sortation_lng IS NOT NULL THEN
        NEW.pickup_to_sortation_meters := haversine_distance(
            NEW.pickup_lat, NEW.pickup_lng, 
            NEW.sortation_lat, NEW.sortation_lng
        );
    END IF;
    
    -- Update sortation to hub distance
    IF NEW.sortation_lat IS NOT NULL AND NEW.sortation_lng IS NOT NULL AND 
       NEW.delivery_hub_lat IS NOT NULL AND NEW.delivery_hub_lng IS NOT NULL THEN
        NEW.sortation_to_hub_meters := haversine_distance(
            NEW.sortation_lat, NEW.sortation_lng, 
            NEW.delivery_hub_lat, NEW.delivery_hub_lng
        );
    END IF;
    
    -- Update hub to destination distance
    IF NEW.delivery_hub_lat IS NOT NULL AND NEW.delivery_hub_lng IS NOT NULL AND 
       NEW.recipient_lat IS NOT NULL AND NEW.recipient_lng IS NOT NULL THEN
        NEW.hub_to_destination_meters := haversine_distance(
            NEW.delivery_hub_lat, NEW.delivery_hub_lng, 
            NEW.recipient_lat, NEW.recipient_lng
        );
    END IF;
    
    -- Update sortation to destination distance (direct route)
    IF NEW.sortation_lat IS NOT NULL AND NEW.sortation_lng IS NOT NULL AND 
       NEW.recipient_lat IS NOT NULL AND NEW.recipient_lng IS NOT NULL THEN
        NEW.sortation_to_destination_meters := haversine_distance(
            NEW.sortation_lat, NEW.sortation_lng, 
            NEW.recipient_lat, NEW.recipient_lng
        );
    END IF;
    
    -- Calculate total route distance
    NEW.total_route_meters := COALESCE(NEW.pickup_to_sortation_meters, 0) + 
                             COALESCE(NEW.sortation_to_hub_meters, 0) + 
                             COALESCE(NEW.hub_to_destination_meters, 0);
    
    -- If no hub, use direct sortation to destination
    IF NEW.total_route_meters = 0 AND NEW.sortation_to_destination_meters IS NOT NULL THEN
        NEW.total_route_meters := COALESCE(NEW.pickup_to_sortation_meters, 0) + 
                                 NEW.sortation_to_destination_meters;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply distance calculation trigger
CREATE TRIGGER calculate_parcel_distances BEFORE INSERT OR UPDATE ON parcels
    FOR EACH ROW EXECUTE FUNCTION update_parcel_distances();

-- =====================================================
-- VIEWS
-- =====================================================

-- View for parcel summary with latest tracking info
CREATE VIEW parcel_summary AS
SELECT 
    p.*,
    te.lat as last_known_lat,
    te.lng as last_known_lng,
    te.timestamp as last_tracking_update,
    f.rating as feedback_rating,
    f.issue as feedback_issue,
    c.name as courier_name,
    c.phone as courier_phone
FROM parcels p
LEFT JOIN LATERAL (
    SELECT lat, lng, timestamp, courier_id
    FROM tracking_events 
    WHERE parcel_id = p.id 
    ORDER BY timestamp DESC 
    LIMIT 1
) te ON true
LEFT JOIN feedback f ON f.parcel_id = p.id
LEFT JOIN couriers c ON c.id = te.courier_id;

-- View for active parcels with delivery metrics
CREATE VIEW active_parcels AS
SELECT 
    p.id,
    p.recipient_name,
    p.recipient_phone,
    p.status,
    p.created_at,
    p.total_route_meters,
    EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 as hours_since_created,
    COUNT(te.id) as tracking_events_count,
    MAX(te.timestamp) as last_tracking_update
FROM parcels p
LEFT JOIN tracking_events te ON te.parcel_id = p.id
WHERE p.status IN ('pending', 'in_transit')
GROUP BY p.id, p.recipient_name, p.recipient_phone, p.status, p.created_at, p.total_route_meters;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample hubs
INSERT INTO hubs (id, name, type, address, lat, lng, phone, capacity) VALUES
('hub-naia', 'NAIA Sortation Center', 'sortation_center', 'NAIA Terminal 3, Pasay, Philippines', 14.5086, 121.0194, '+632-877-1109', 10000),
('hub-makati', 'Makati Delivery Hub', 'delivery_hub', 'Ayala Avenue, Makati, Philippines', 14.5547, 121.0244, '+632-889-1000', 5000),
('hub-bgc', 'BGC Delivery Hub', 'delivery_hub', '5th Avenue, Bonifacio Global City, Taguig, Philippines', 14.5515, 121.0481, '+632-856-2000', 3000);

-- Insert sample couriers
INSERT INTO couriers (id, name, email, phone, vehicle_type, vehicle_plate, verified) VALUES
('courier-001', 'Juan dela Cruz', 'juan@tracksnap.com', '+639171234567', 'motorcycle', 'ABC-1234', true),
('courier-002', 'Maria Santos', 'maria@tracksnap.com', '+639181234567', 'van', 'DEF-5678', true),
('courier-003', 'Pedro Reyes', 'pedro@tracksnap.com', '+639191234567', 'motorcycle', 'GHI-9012', true);

-- =====================================================
-- HELPER FUNCTIONS FOR LOCATION QUERIES
-- =====================================================

-- Function to find parcels within a bounding box (simpler than radius queries)
CREATE OR REPLACE FUNCTION find_parcels_in_area(center_lat DECIMAL, center_lng DECIMAL, radius_km DECIMAL)
RETURNS TABLE(
    parcel_id VARCHAR(50),
    recipient_name VARCHAR(255),
    distance_km DECIMAL
) AS $$
DECLARE
    lat_offset DECIMAL := radius_km / 111.0; -- Approximate km per degree latitude
    lng_offset DECIMAL := radius_km / (111.0 * cos(radians(center_lat))); -- Longitude varies by latitude
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.recipient_name,
        (haversine_distance(center_lat, center_lng, p.recipient_lat, p.recipient_lng) / 1000.0)::DECIMAL as distance_km
    FROM parcels p
    WHERE p.recipient_lat IS NOT NULL 
      AND p.recipient_lng IS NOT NULL
      AND p.recipient_lat BETWEEN (center_lat - lat_offset) AND (center_lat + lat_offset)
      AND p.recipient_lng BETWEEN (center_lng - lng_offset) AND (center_lng + lng_offset)
      AND haversine_distance(center_lat, center_lng, p.recipient_lat, p.recipient_lng) <= (radius_km * 1000)
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM find_parcels_in_area(14.5547, 121.0244, 5.0); -- Find parcels within 5km of Makati

COMMENT ON DATABASE tracksnap IS 'TrackSnap Parcel Tracking System Database - Basic Version';
COMMENT ON TABLE parcels IS 'Core parcel information and delivery details';
COMMENT ON TABLE tracking_events IS 'GPS tracking events for parcel location updates';
COMMENT ON TABLE handoff_events IS 'Parcel handoff and delivery confirmation events';
COMMENT ON TABLE feedback IS 'Customer feedback and ratings for completed deliveries';
COMMENT ON TABLE couriers IS 'Delivery personnel information and status';
COMMENT ON TABLE hubs IS 'Physical locations: sortation centers and delivery hubs';
COMMENT ON TABLE geocoding_cache IS 'Cache for address-to-coordinate conversions to reduce API calls';