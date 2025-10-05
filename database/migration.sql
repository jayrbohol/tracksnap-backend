-- TrackSnap Database Migration Script
-- From: Current simple structure
-- To: Complete normalized schema
-- Created: October 2025

-- This migration script transforms the existing simple parcel structure
-- to a normalized database schema with proper relationships and constraints

BEGIN;

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA
-- =====================================================

-- Create backup of existing parcels table
CREATE TABLE IF NOT EXISTS parcels_backup AS 
SELECT * FROM parcels WHERE 1=1;

-- =====================================================
-- STEP 2: CREATE NEW TABLES (if they don't exist)
-- =====================================================

-- Create new tables with complete schema
-- (Only create if they don't exist to avoid conflicts)

-- Couriers table
CREATE TABLE IF NOT EXISTS couriers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    license_number VARCHAR(100),
    vehicle_type VARCHAR(50),
    vehicle_plate VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    verified BOOLEAN DEFAULT FALSE,
    last_known_lat DECIMAL(10,8),
    last_known_lng DECIMAL(11,8),
    last_location_update TIMESTAMP WITH TIME ZONE,
    hire_date DATE,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_deliveries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hubs table
CREATE TABLE IF NOT EXISTS hubs (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    formatted_address TEXT,
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    capacity INTEGER,
    operating_hours JSONB,
    timezone VARCHAR(50) DEFAULT 'UTC',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracking events table
CREATE TABLE IF NOT EXISTS tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lat DECIMAL(10,8) NOT NULL,
    lng DECIMAL(11,8) NOT NULL,
    altitude DECIMAL(8,2),
    accuracy DECIMAL(8,2),
    speed DECIMAL(8,2),
    heading DECIMAL(5,2),
    courier_id VARCHAR(50),
    device_id VARCHAR(100),
    battery_level INTEGER,
    network_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Handoff events table
CREATE TABLE IF NOT EXISTS handoff_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    courier_id VARCHAR(50),
    gps_address TEXT,
    gps_formatted_address TEXT,
    gps_lat DECIMAL(10,8),
    gps_lng DECIMAL(11,8),
    photo_url TEXT,
    signature_url TEXT,
    notes TEXT,
    qr_scanned BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hub audit log table
CREATE TABLE IF NOT EXISTS hub_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    old_address TEXT,
    old_formatted_address TEXT,
    old_lat DECIMAL(10,8),
    old_lng DECIMAL(11,8),
    new_address TEXT,
    new_formatted_address TEXT,
    new_lat DECIMAL(10,8),
    new_lng DECIMAL(11,8),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parcel_id VARCHAR(50) NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    issue TEXT,
    comments TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Geocoding cache table
CREATE TABLE IF NOT EXISTS geocoding_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address_input TEXT NOT NULL,
    address_hash VARCHAR(64) NOT NULL UNIQUE,
    formatted_address TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    country VARCHAR(100),
    country_code VARCHAR(2),
    admin_area_1 VARCHAR(100),
    admin_area_2 VARCHAR(100),
    postal_code VARCHAR(20),
    accuracy VARCHAR(50),
    confidence DECIMAL(3,2),
    geocoding_service VARCHAR(50) DEFAULT 'nominatim',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    use_count INTEGER DEFAULT 1
);

-- =====================================================
-- STEP 3: MODIFY EXISTING PARCELS TABLE
-- =====================================================

-- Add new columns to existing parcels table (if they don't exist)
DO $$ 
BEGIN
    -- Add recipient fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'recipient_name') THEN
        ALTER TABLE parcels ADD COLUMN recipient_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'recipient_phone') THEN
        ALTER TABLE parcels ADD COLUMN recipient_phone VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'recipient_email') THEN
        ALTER TABLE parcels ADD COLUMN recipient_email VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'recipient_address') THEN
        ALTER TABLE parcels ADD COLUMN recipient_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'recipient_formatted_address') THEN
        ALTER TABLE parcels ADD COLUMN recipient_formatted_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'recipient_lat') THEN
        ALTER TABLE parcels ADD COLUMN recipient_lat DECIMAL(10,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'recipient_lng') THEN
        ALTER TABLE parcels ADD COLUMN recipient_lng DECIMAL(11,8);
    END IF;

    -- Add location fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'pickup_address') THEN
        ALTER TABLE parcels ADD COLUMN pickup_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'pickup_lat') THEN
        ALTER TABLE parcels ADD COLUMN pickup_lat DECIMAL(10,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'pickup_lng') THEN
        ALTER TABLE parcels ADD COLUMN pickup_lng DECIMAL(11,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'sortation_address') THEN
        ALTER TABLE parcels ADD COLUMN sortation_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'sortation_lat') THEN
        ALTER TABLE parcels ADD COLUMN sortation_lat DECIMAL(10,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'sortation_lng') THEN
        ALTER TABLE parcels ADD COLUMN sortation_lng DECIMAL(11,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'delivery_hub_address') THEN
        ALTER TABLE parcels ADD COLUMN delivery_hub_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'delivery_hub_lat') THEN
        ALTER TABLE parcels ADD COLUMN delivery_hub_lat DECIMAL(10,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'delivery_hub_lng') THEN
        ALTER TABLE parcels ADD COLUMN delivery_hub_lng DECIMAL(11,8);
    END IF;

    -- Add computed distance fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'pickup_to_sortation_meters') THEN
        ALTER TABLE parcels ADD COLUMN pickup_to_sortation_meters INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'sortation_to_hub_meters') THEN
        ALTER TABLE parcels ADD COLUMN sortation_to_hub_meters INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'hub_to_destination_meters') THEN
        ALTER TABLE parcels ADD COLUMN hub_to_destination_meters INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'total_route_meters') THEN
        ALTER TABLE parcels ADD COLUMN total_route_meters INTEGER;
    END IF;

    -- Add timestamp fields
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'updated_at') THEN
        ALTER TABLE parcels ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parcels' AND column_name = 'delivered_at') THEN
        ALTER TABLE parcels ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- =====================================================
-- STEP 4: MIGRATE EXISTING DATA
-- =====================================================

-- Function to extract recipient data from JSONB
CREATE OR REPLACE FUNCTION migrate_recipient_data()
RETURNS void AS $$
BEGIN
    -- Update recipient fields from existing JSONB structure
    UPDATE parcels 
    SET 
        recipient_name = COALESCE(recipient->>'name', 'Unknown'),
        recipient_phone = recipient->>'phone',
        recipient_email = recipient->>'email',
        recipient_address = recipient->>'address',
        recipient_formatted_address = recipient->>'formattedAddress',
        recipient_lat = CASE 
            WHEN recipient->'coordinates'->>'lat' IS NOT NULL 
            THEN (recipient->'coordinates'->>'lat')::DECIMAL(10,8)
            ELSE NULL 
        END,
        recipient_lng = CASE 
            WHEN recipient->'coordinates'->>'lng' IS NOT NULL 
            THEN (recipient->'coordinates'->>'lng')::DECIMAL(11,8)
            ELSE NULL 
        END
    WHERE recipient IS NOT NULL;
    
    -- Migrate pickup location data
    UPDATE parcels 
    SET 
        pickup_address = CASE 
            WHEN jsonb_typeof(pickupLocation) = 'string' THEN pickupLocation #>> '{}'
            ELSE pickupLocation->>'address'
        END,
        pickup_lat = CASE 
            WHEN pickupLocation->'coordinates'->>'lat' IS NOT NULL 
            THEN (pickupLocation->'coordinates'->>'lat')::DECIMAL(10,8)
            WHEN pickupLocation->>'lat' IS NOT NULL 
            THEN (pickupLocation->>'lat')::DECIMAL(10,8)
            ELSE NULL 
        END,
        pickup_lng = CASE 
            WHEN pickupLocation->'coordinates'->>'lng' IS NOT NULL 
            THEN (pickupLocation->'coordinates'->>'lng')::DECIMAL(11,8)
            WHEN pickupLocation->>'lng' IS NOT NULL 
            THEN (pickupLocation->>'lng')::DECIMAL(11,8)
            ELSE NULL 
        END
    WHERE pickupLocation IS NOT NULL;
    
    -- Migrate sortation center data
    UPDATE parcels 
    SET 
        sortation_address = CASE 
            WHEN jsonb_typeof(sortationCenter) = 'string' THEN sortationCenter #>> '{}'
            ELSE sortationCenter->>'address'
        END,
        sortation_lat = CASE 
            WHEN sortationCenter->'coordinates'->>'lat' IS NOT NULL 
            THEN (sortationCenter->'coordinates'->>'lat')::DECIMAL(10,8)
            WHEN sortationCenter->>'lat' IS NOT NULL 
            THEN (sortationCenter->>'lat')::DECIMAL(10,8)
            ELSE NULL 
        END,
        sortation_lng = CASE 
            WHEN sortationCenter->'coordinates'->>'lng' IS NOT NULL 
            THEN (sortationCenter->'coordinates'->>'lng')::DECIMAL(11,8)
            WHEN sortationCenter->>'lng' IS NOT NULL 
            THEN (sortationCenter->>'lng')::DECIMAL(11,8)
            ELSE NULL 
        END
    WHERE sortationCenter IS NOT NULL;
    
    -- Migrate delivery hub data
    UPDATE parcels 
    SET 
        delivery_hub_address = CASE 
            WHEN jsonb_typeof(deliveryHub) = 'string' THEN deliveryHub #>> '{}'
            ELSE deliveryHub->>'address'
        END,
        delivery_hub_lat = CASE 
            WHEN deliveryHub->'coordinates'->>'lat' IS NOT NULL 
            THEN (deliveryHub->'coordinates'->>'lat')::DECIMAL(10,8)
            WHEN deliveryHub->>'lat' IS NOT NULL 
            THEN (deliveryHub->>'lat')::DECIMAL(10,8)
            ELSE NULL 
        END,
        delivery_hub_lng = CASE 
            WHEN deliveryHub->'coordinates'->>'lng' IS NOT NULL 
            THEN (deliveryHub->'coordinates'->>'lng')::DECIMAL(11,8)
            WHEN deliveryHub->>'lng' IS NOT NULL 
            THEN (deliveryHub->>'lng')::DECIMAL(11,8)
            ELSE NULL 
        END
    WHERE deliveryHub IS NOT NULL;
    
    RAISE NOTICE 'Recipient data migration completed';
END;
$$ LANGUAGE plpgsql;

-- Function to migrate tracking and handoff data
CREATE OR REPLACE FUNCTION migrate_tracking_data()
RETURNS void AS $$
DECLARE
    parcel_record RECORD;
    tracking_entry JSONB;
    handoff_entry JSONB;
    feedback_entry JSONB;
BEGIN
    -- Migrate tracking log data
    FOR parcel_record IN SELECT id, trackingLog FROM parcels WHERE trackingLog IS NOT NULL LOOP
        FOR tracking_entry IN SELECT * FROM jsonb_array_elements(parcel_record.trackingLog) LOOP
            INSERT INTO tracking_events (
                parcel_id, 
                timestamp, 
                lat, 
                lng,
                courier_id
            ) VALUES (
                parcel_record.id,
                COALESCE((tracking_entry->>'timestamp')::TIMESTAMP WITH TIME ZONE, NOW()),
                (tracking_entry->'coordinates'->>'lat')::DECIMAL(10,8),
                (tracking_entry->'coordinates'->>'lng')::DECIMAL(11,8),
                tracking_entry->>'courierId'
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
    
    -- Migrate handoff log data
    FOR parcel_record IN SELECT id, handoffLog FROM parcels WHERE handoffLog IS NOT NULL LOOP
        FOR handoff_entry IN SELECT * FROM jsonb_array_elements(parcel_record.handoffLog) LOOP
            INSERT INTO handoff_events (
                parcel_id, 
                timestamp, 
                courier_id,
                photo_url,
                gps_lat,
                gps_lng
            ) VALUES (
                parcel_record.id,
                COALESCE((handoff_entry->>'timestamp')::TIMESTAMP WITH TIME ZONE, NOW()),
                handoff_entry->>'courierId',
                handoff_entry->>'photoURL',
                (handoff_entry->'gps'->'coordinates'->>'lat')::DECIMAL(10,8),
                (handoff_entry->'gps'->'coordinates'->>'lng')::DECIMAL(11,8)
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
    
    -- Migrate feedback data
    FOR parcel_record IN SELECT id, feedback FROM parcels WHERE feedback IS NOT NULL LOOP
        feedback_entry := parcel_record.feedback;
        INSERT INTO feedback (
            parcel_id,
            rating,
            issue,
            comments,
            timestamp
        ) VALUES (
            parcel_record.id,
            (feedback_entry->>'rating')::INTEGER,
            feedback_entry->>'issue',
            feedback_entry->>'comments',
            COALESCE((feedback_entry->>'timestamp')::TIMESTAMP WITH TIME ZONE, NOW())
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Tracking and feedback data migration completed';
END;
$$ LANGUAGE plpgsql;

-- Execute migration functions
SELECT migrate_recipient_data();
SELECT migrate_tracking_data();

-- =====================================================
-- STEP 5: ADD CONSTRAINTS AND INDEXES
-- =====================================================

-- Add foreign key constraints
ALTER TABLE tracking_events 
ADD CONSTRAINT fk_tracking_parcel 
FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE;

ALTER TABLE handoff_events 
ADD CONSTRAINT fk_handoff_parcel 
FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE;

ALTER TABLE hub_audit_log 
ADD CONSTRAINT fk_audit_parcel 
FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE;

ALTER TABLE feedback 
ADD CONSTRAINT fk_feedback_parcel 
FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE parcels 
ADD CONSTRAINT valid_recipient_coords CHECK (
    (recipient_lat IS NULL AND recipient_lng IS NULL) OR 
    (recipient_lat BETWEEN -90 AND 90 AND recipient_lng BETWEEN -180 AND 180)
);

-- Set NOT NULL constraints for required fields
-- (Only if data exists)
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM parcels WHERE recipient_name IS NULL) = 0 THEN
        ALTER TABLE parcels ALTER COLUMN recipient_name SET NOT NULL;
    END IF;
    
    IF (SELECT COUNT(*) FROM parcels WHERE recipient_phone IS NULL) = 0 THEN
        ALTER TABLE parcels ALTER COLUMN recipient_phone SET NOT NULL;
    END IF;
    
    IF (SELECT COUNT(*) FROM parcels WHERE recipient_address IS NULL) = 0 THEN
        ALTER TABLE parcels ALTER COLUMN recipient_address SET NOT NULL;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_created_at ON parcels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_parcels_recipient_phone ON parcels(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_tracking_events_parcel_timestamp ON tracking_events(parcel_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_handoff_events_parcel_id ON handoff_events(parcel_id);
CREATE INDEX IF NOT EXISTS idx_feedback_parcel_id ON feedback(parcel_id);

-- =====================================================
-- STEP 6: INSERT SAMPLE DATA
-- =====================================================

-- Insert sample hubs
INSERT INTO hubs (id, name, type, address, lat, lng, phone, capacity) VALUES
('hub-naia', 'NAIA Sortation Center', 'sortation_center', 'NAIA Terminal 3, Pasay, Philippines', 14.5086, 121.0194, '+632-877-1109', 10000),
('hub-makati', 'Makati Delivery Hub', 'delivery_hub', 'Ayala Avenue, Makati, Philippines', 14.5547, 121.0244, '+632-889-1000', 5000),
('hub-bgc', 'BGC Delivery Hub', 'delivery_hub', '5th Avenue, Bonifacio Global City, Taguig, Philippines', 14.5515, 121.0481, '+632-856-2000', 3000)
ON CONFLICT (id) DO NOTHING;

-- Insert sample couriers
INSERT INTO couriers (id, name, email, phone, vehicle_type, vehicle_plate, verified) VALUES
('courier-001', 'Juan dela Cruz', 'juan@tracksnap.com', '+639171234567', 'motorcycle', 'ABC-1234', true),
('courier-002', 'Maria Santos', 'maria@tracksnap.com', '+639181234567', 'van', 'DEF-5678', true),
('courier-003', 'Pedro Reyes', 'pedro@tracksnap.com', '+639191234567', 'motorcycle', 'GHI-9012', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 7: CREATE FUNCTIONS AND TRIGGERS
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
DROP TRIGGER IF EXISTS update_parcels_updated_at ON parcels;
CREATE TRIGGER update_parcels_updated_at BEFORE UPDATE ON parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Haversine distance function
CREATE OR REPLACE FUNCTION haversine_distance(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS INTEGER AS $$
DECLARE
    R INTEGER := 6371000;
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

-- Function to update parcel distances
CREATE OR REPLACE FUNCTION update_parcel_distances()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate distances when coordinates are available
    IF NEW.pickup_lat IS NOT NULL AND NEW.sortation_lat IS NOT NULL THEN
        NEW.pickup_to_sortation_meters := haversine_distance(
            NEW.pickup_lat, NEW.pickup_lng, 
            NEW.sortation_lat, NEW.sortation_lng
        );
    END IF;
    
    IF NEW.sortation_lat IS NOT NULL AND NEW.delivery_hub_lat IS NOT NULL THEN
        NEW.sortation_to_hub_meters := haversine_distance(
            NEW.sortation_lat, NEW.sortation_lng, 
            NEW.delivery_hub_lat, NEW.delivery_hub_lng
        );
    END IF;
    
    IF NEW.delivery_hub_lat IS NOT NULL AND NEW.recipient_lat IS NOT NULL THEN
        NEW.hub_to_destination_meters := haversine_distance(
            NEW.delivery_hub_lat, NEW.delivery_hub_lng, 
            NEW.recipient_lat, NEW.recipient_lng
        );
    END IF;
    
    -- Calculate total route
    NEW.total_route_meters := COALESCE(NEW.pickup_to_sortation_meters, 0) + 
                             COALESCE(NEW.sortation_to_hub_meters, 0) + 
                             COALESCE(NEW.hub_to_destination_meters, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply distance calculation trigger
DROP TRIGGER IF EXISTS calculate_parcel_distances ON parcels;
CREATE TRIGGER calculate_parcel_distances BEFORE INSERT OR UPDATE ON parcels
    FOR EACH ROW EXECUTE FUNCTION update_parcel_distances();

-- Update existing parcels with calculated distances
UPDATE parcels SET updated_at = NOW() WHERE id IN (SELECT id FROM parcels LIMIT 1000);

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check migration results
SELECT 
    'parcels' as table_name,
    COUNT(*) as total_records,
    COUNT(recipient_name) as with_recipient_name,
    COUNT(recipient_phone) as with_recipient_phone,
    COUNT(recipient_address) as with_recipient_address
FROM parcels
UNION ALL
SELECT 
    'tracking_events' as table_name,
    COUNT(*) as total_records,
    COUNT(courier_id) as with_courier_id,
    NULL as with_recipient_phone,
    NULL as with_recipient_address
FROM tracking_events
UNION ALL
SELECT 
    'handoff_events' as table_name,
    COUNT(*) as total_records,
    COUNT(courier_id) as with_courier_id,
    NULL as with_recipient_phone,
    NULL as with_recipient_address
FROM handoff_events
UNION ALL
SELECT 
    'feedback' as table_name,
    COUNT(*) as total_records,
    COUNT(rating) as with_rating,
    NULL as with_recipient_phone,
    NULL as with_recipient_address
FROM feedback;

-- Sample query to verify data integrity
SELECT 
    p.id,
    p.recipient_name,
    p.recipient_phone,
    p.status,
    COUNT(te.id) as tracking_events,
    COUNT(he.id) as handoff_events,
    COUNT(f.id) as feedback_records
FROM parcels p
LEFT JOIN tracking_events te ON te.parcel_id = p.id
LEFT JOIN handoff_events he ON he.parcel_id = p.id
LEFT JOIN feedback f ON f.parcel_id = p.id
GROUP BY p.id, p.recipient_name, p.recipient_phone, p.status
ORDER BY p.created_at DESC
LIMIT 10;