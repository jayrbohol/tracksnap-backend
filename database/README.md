# TrackSnap Database Schema

This directory contains the complete database schema design for the TrackSnap parcel tracking system, supporting multiple database technologies and deployment scenarios.

## 📋 Schema Overview

The TrackSnap database is designed to handle:
- **Parcel Management**: Core parcel information with recipient details and delivery status
- **Location Tracking**: Real-time GPS tracking and geospatial queries
- **Delivery Management**: Courier assignments and handoff verification
- **Hub Operations**: Sortation centers and delivery hub management
- **Customer Feedback**: Ratings and issue tracking
- **Address Geocoding**: Cached address-to-coordinate conversions

## 🗄️ Database Options

### 1. PostgreSQL/Supabase (Recommended)
- **File**: `schema.sql`
- **Features**: 
  - Full ACID compliance
  - Advanced geospatial support with PostGIS
  - JSON/JSONB support for flexible metadata
  - Robust indexing and performance optimization
  - Row-level security for multi-tenant scenarios

### 2. MongoDB
- **File**: `mongodb-schema.js`
- **Features**:
  - Flexible document structure
  - Built-in geospatial indexing (2dsphere)
  - Horizontal scaling capabilities
  - Rich aggregation pipeline for analytics

### 3. Migration Scripts
- **File**: `migration.sql`
- **Purpose**: Migrate from current simple structure to full normalized schema
- **Safety**: Includes backup procedures and rollback capabilities

## 📊 Schema Structure

### Core Tables/Collections

#### 1. **Parcels** 
Primary entity storing all parcel information
```sql
- id (Primary Key)
- recipient_name, recipient_phone, recipient_address (Required)
- pickup/sortation/delivery hub locations
- status (pending, in_transit, delivered, flagged, cancelled)
- computed distances and routes
- metadata (flexible JSON storage)
```

#### 2. **Tracking Events**
GPS tracking data with timestamps
```sql
- parcel_id (Foreign Key)
- coordinates (lat/lng with spatial indexing)
- timestamp, courier_id, device_info
- accuracy, speed, heading, altitude
```

#### 3. **Handoff Events**
Delivery confirmations and handoff records
```sql
- parcel_id (Foreign Key)
- courier_id, timestamp
- GPS location, photos, signatures
- QR scan verification
```

#### 4. **Couriers**
Delivery personnel management
```sql
- id, name, contact information
- vehicle details, verification status
- performance metrics (rating, total deliveries)
- last known location
```

#### 5. **Hubs**
Physical locations (sortation centers, delivery hubs)
```sql
- id, name, type, address
- coordinates, operating hours
- capacity and current load
- coverage areas (geofenced polygons)
```

#### 6. **Feedback**
Customer ratings and issue tracking
```sql
- parcel_id (Foreign Key)
- rating (1-5), comments, issues
- resolution tracking
```

#### 7. **Geocoding Cache**
Optimized address-to-coordinate conversions
```sql
- address_hash (unique index)
- coordinates, formatted address
- accuracy metrics, service provider
- usage statistics and TTL
```

## 🚀 Getting Started

### PostgreSQL/Supabase Setup

1. **Create Database**:
   ```sql
   CREATE DATABASE tracksnap;
   ```

2. **Run Schema**:
   ```bash
   psql -d tracksnap -f database/schema.sql
   ```

3. **Enable Extensions** (if using raw PostgreSQL):
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "postgis"; -- for advanced geospatial features
   ```

### MongoDB Setup

1. **Create Database**:
   ```javascript
   use tracksnap
   ```

2. **Run Schema**:
   ```bash
   mongo tracksnap database/mongodb-schema.js
   ```

### Migration from Existing System

1. **Backup Current Data**:
   ```sql
   pg_dump tracksnap > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run Migration**:
   ```bash
   psql -d tracksnap -f database/migration.sql
   ```

3. **Verify Migration**:
   ```sql
   -- Check data integrity
   SELECT table_name, row_count FROM migration_verification_view;
   ```

## 📈 Performance Optimization

### Indexing Strategy

**PostgreSQL:**
```sql
-- Primary lookups
CREATE INDEX idx_parcels_status ON parcels(status);
CREATE INDEX idx_parcels_phone ON parcels(recipient_phone);

-- Geospatial queries
CREATE INDEX idx_parcels_location ON parcels 
USING gist(ll_to_earth(recipient_lat, recipient_lng));

-- Time-series data
CREATE INDEX idx_tracking_events_time ON tracking_events(parcel_id, timestamp DESC);
```

**MongoDB:**
```javascript
// Compound indexes for common queries
db.parcels.createIndex({ "status": 1, "createdAt": -1 })
db.parcels.createIndex({ "recipient.coordinates": "2dsphere" })
db.trackingEvents.createIndex({ "parcelId": 1, "timestamp": -1 })
```

### Query Optimization Tips

1. **Use appropriate data types** (DECIMAL for coordinates, not FLOAT)
2. **Implement spatial indexes** for location-based queries
3. **Partition large tables** by date ranges for time-series data
4. **Use read replicas** for analytics and reporting queries
5. **Cache frequently accessed data** (geocoding results, hub information)

## 🔒 Security Considerations

### Row Level Security (PostgreSQL)
```sql
-- Enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Create policies based on your authentication system
CREATE POLICY parcel_isolation ON parcels
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### MongoDB Security
```javascript
// Role-based access control
db.createRole({
  role: "courierRole",
  privileges: [
    { resource: { db: "tracksnap", collection: "parcels" }, actions: ["find", "update"] },
    { resource: { db: "tracksnap", collection: "trackingEvents" }, actions: ["insert", "find"] }
  ],
  roles: []
});
```

## 📊 Analytics and Reporting

### Common Queries

**Delivery Performance:**
```sql
-- Average delivery time by courier
SELECT 
    c.name,
    AVG(EXTRACT(EPOCH FROM (p.delivered_at - p.created_at))/3600) as avg_hours
FROM parcels p
JOIN couriers c ON c.id = (
    SELECT courier_id FROM tracking_events 
    WHERE parcel_id = p.id 
    ORDER BY timestamp DESC LIMIT 1
)
WHERE p.status = 'delivered'
GROUP BY c.name;
```

**Geographic Analysis:**
```sql
-- Delivery density by area (PostgreSQL with PostGIS)
SELECT 
    ST_AsGeoJSON(ST_SnapToGrid(ST_MakePoint(recipient_lng, recipient_lat), 0.01)) as location,
    COUNT(*) as parcel_count
FROM parcels 
WHERE status = 'delivered'
GROUP BY ST_SnapToGrid(ST_MakePoint(recipient_lng, recipient_lat), 0.01)
HAVING COUNT(*) > 10;
```

### Materialized Views for Performance
```sql
-- Pre-computed delivery metrics
CREATE MATERIALIZED VIEW daily_delivery_stats AS
SELECT 
    DATE(created_at) as delivery_date,
    COUNT(*) as total_parcels,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
    AVG(CASE WHEN feedback IS NOT NULL THEN (feedback->>'rating')::INTEGER END) as avg_rating
FROM parcels
GROUP BY DATE(created_at);

-- Refresh daily
REFRESH MATERIALIZED VIEW daily_delivery_stats;
```

## 🔧 Maintenance

### Regular Tasks

1. **Update Statistics** (PostgreSQL):
   ```sql
   ANALYZE parcels;
   ANALYZE tracking_events;
   ```

2. **Clean Old Data**:
   ```sql
   -- Archive old tracking events (keep last 6 months)
   DELETE FROM tracking_events 
   WHERE created_at < NOW() - INTERVAL '6 months';
   ```

3. **Geocoding Cache Cleanup**:
   ```sql
   -- Remove unused geocoding entries
   DELETE FROM geocoding_cache 
   WHERE last_used < NOW() - INTERVAL '30 days' AND use_count = 1;
   ```

### Monitoring Queries

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

## 🐛 Troubleshooting

### Common Issues

1. **Geocoding API Limits**: Implement exponential backoff and cache aggressively
2. **Large JSON Fields**: Consider normalizing frequently queried JSON attributes
3. **Spatial Index Performance**: Ensure coordinates are properly validated and indexed
4. **Connection Pool Exhaustion**: Monitor and tune connection pool settings

### Debug Queries

```sql
-- Find parcels without proper coordinates
SELECT id, recipient_name FROM parcels 
WHERE recipient_address IS NOT NULL 
AND (recipient_lat IS NULL OR recipient_lng IS NULL);

-- Check for orphaned tracking events
SELECT COUNT(*) FROM tracking_events te
LEFT JOIN parcels p ON p.id = te.parcel_id
WHERE p.id IS NULL;
```

## 📚 Additional Resources

- [PostGIS Documentation](https://postgis.net/docs/) - Advanced geospatial features
- [MongoDB Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/) - Location-based operations
- [Supabase Guides](https://supabase.com/docs) - Cloud PostgreSQL platform
- [Database Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization) - Query optimization

## 🤝 Contributing

When modifying the schema:

1. **Version Control**: Tag schema changes with version numbers
2. **Migration Scripts**: Always provide forward and backward migration paths
3. **Documentation**: Update this README with schema changes
4. **Testing**: Validate on sample data before production deployment

---

**Last Updated**: October 2025  
**Schema Version**: 1.0  
**Compatible with**: PostgreSQL 12+, MongoDB 4.4+, Supabase