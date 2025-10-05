// TrackSnap Database Schema (MongoDB)
// Created: October 2025
// Description: MongoDB collections and schema design for TrackSnap parcel tracking system

// =====================================================
// COLLECTIONS DESIGN
// =====================================================

// 1. PARCELS COLLECTION
// Primary collection storing all parcel information
db.parcels.createIndex({ "id": 1 }, { unique: true })
db.parcels.createIndex({ "status": 1 })
db.parcels.createIndex({ "createdAt": -1 })
db.parcels.createIndex({ "recipient.phone": 1 })
db.parcels.createIndex({ "recipient.email": 1 })
db.parcels.createIndex({ "recipient.coordinates": "2dsphere" })
db.parcels.createIndex({ "pickupLocation.coordinates": "2dsphere" })
db.parcels.createIndex({ "sortationCenter.coordinates": "2dsphere" })
db.parcels.createIndex({ "deliveryHub.coordinates": "2dsphere" })

// Sample parcel document structure
db.parcels.insertOne({
  "_id": ObjectId(),
  "id": "parcel-abc12345",
  "recipient": {
    "name": "Jane Doe",
    "phone": "+639171234567",
    "email": "jane@example.com",
    "address": "SM Mall of Asia, Pasay, Philippines",
    "formattedAddress": "SM Mall of Asia, Seaside Boulevard, Pasay, Metro Manila, Philippines",
    "coordinates": {
      "type": "Point",
      "coordinates": [120.9842, 14.5995] // [longitude, latitude] - GeoJSON format
    }
  },
  "pickupLocation": {
    "address": "NAIA Terminal 3, Pasay, Philippines",
    "formattedAddress": "NAIA Terminal 3, Airport Road, Pasay, Metro Manila, Philippines",
    "coordinates": {
      "type": "Point",
      "coordinates": [121.0194, 14.5086]
    }
  },
  "sortationCenter": {
    "address": "Ayala Avenue, Makati, Philippines",
    "formattedAddress": "Ayala Avenue, Makati, Metro Manila, Philippines",
    "coordinates": {
      "type": "Point",
      "coordinates": [121.0244, 14.5547]
    }
  },
  "deliveryHub": {
    "address": "5th Avenue, Bonifacio Global City, Taguig, Philippines",
    "formattedAddress": "5th Avenue, Bonifacio Global City, Taguig, Metro Manila, Philippines",
    "coordinates": {
      "type": "Point",
      "coordinates": [121.0481, 14.5515]
    }
  },
  "legs": {
    "pickupToSortation": { "meters": 15420, "km": 15.42 },
    "sortationToHub": { "meters": 8750, "km": 8.75 },
    "hubToDestination": { "meters": 12300, "km": 12.3 },
    "totalRoute": { "meters": 36470, "km": 36.47 }
  },
  "hubAuditLog": [
    {
      "timestamp": "2025-10-05T10:30:00.000Z",
      "actor": "admin@tracksnap.com",
      "changes": {
        "sortationCenter": {
          "from": null,
          "to": {
            "address": "Ayala Avenue, Makati, Philippines",
            "coordinates": { "type": "Point", "coordinates": [121.0244, 14.5547] }
          }
        }
      }
    }
  ],
  "status": "pending", // pending, in_transit, delivered, flagged, cancelled
  "qr": "data:image/png;base64,iVBORw0KGgo...",
  "handoffLog": [
    {
      "timestamp": "2025-10-05T14:30:00.000Z",
      "courierId": "courier-001",
      "gps": {
        "address": "recipient address",
        "coordinates": { "type": "Point", "coordinates": [120.9842, 14.5995] }
      },
      "photoURL": "https://storage.example.com/handoff-photos/abc123.jpg",
      "signatureURL": "https://storage.example.com/signatures/abc123.png",
      "qrScanned": true,
      "verificationCode": "DELV123"
    }
  ],
  "trackingLog": [
    {
      "timestamp": "2025-10-05T12:00:00.000Z",
      "coordinates": { "type": "Point", "coordinates": [121.0200, 14.5100] },
      "courierId": "courier-001",
      "accuracy": 5.0,
      "speed": 45.5,
      "heading": 180.0,
      "altitude": 15.2,
      "deviceId": "device-001",
      "batteryLevel": 85
    }
  ],
  "feedback": {
    "rating": 5,
    "issue": null,
    "comments": "Great service!",
    "timestamp": "2025-10-05T15:00:00.000Z",
    "customerEmail": "jane@example.com",
    "resolved": true
  },
  "metadata": {
    "orderId": "ORDER123",
    "weight": "2.5kg",
    "dimensions": "30x20x10cm",
    "value": "₱7500",
    "fragile": true,
    "priority": "standard"
  },
  "createdAt": "2025-10-05T10:00:00.000Z",
  "updatedAt": "2025-10-05T15:00:00.000Z",
  "deliveredAt": "2025-10-05T14:45:00.000Z"
})

// 2. COURIERS COLLECTION
// Information about delivery personnel
db.couriers.createIndex({ "id": 1 }, { unique: true })
db.couriers.createIndex({ "email": 1 }, { unique: true })
db.couriers.createIndex({ "status": 1 })
db.couriers.createIndex({ "lastKnownLocation": "2dsphere" })
db.couriers.createIndex({ "rating": -1 })

// Sample courier document
db.couriers.insertOne({
  "_id": ObjectId(),
  "id": "courier-001",
  "name": "Juan dela Cruz",
  "email": "juan@tracksnap.com",
  "phone": "+639171234567",
  "licenseNumber": "N01-23-456789",
  "vehicle": {
    "type": "motorcycle", // motorcycle, van, truck, bicycle
    "plate": "ABC-1234",
    "model": "Honda Click 150i",
    "color": "Red"
  },
  "status": "active", // active, inactive, suspended
  "verified": true,
  "lastKnownLocation": {
    "type": "Point",
    "coordinates": [121.0244, 14.5547]
  },
  "lastLocationUpdate": "2025-10-05T14:30:00.000Z",
  "rating": 4.8,
  "totalDeliveries": 1250,
  "completionRate": 98.5,
  "averageDeliveryTime": 45, // minutes
  "hireDate": "2023-01-15",
  "emergencyContact": {
    "name": "Maria dela Cruz",
    "phone": "+639171234568",
    "relationship": "spouse"
  },
  "workingHours": {
    "monday": { "start": "08:00", "end": "18:00" },
    "tuesday": { "start": "08:00", "end": "18:00" },
    "wednesday": { "start": "08:00", "end": "18:00" },
    "thursday": { "start": "08:00", "end": "18:00" },
    "friday": { "start": "08:00", "end": "18:00" },
    "saturday": { "start": "08:00", "end": "16:00" },
    "sunday": null
  },
  "createdAt": "2023-01-15T08:00:00.000Z",
  "updatedAt": "2025-10-05T14:30:00.000Z"
})

// 3. HUBS COLLECTION
// Physical locations (sortation centers, delivery hubs)
db.hubs.createIndex({ "id": 1 }, { unique: true })
db.hubs.createIndex({ "type": 1 })
db.hubs.createIndex({ "status": 1 })
db.hubs.createIndex({ "location": "2dsphere" })
db.hubs.createIndex({ "coverage.geometry": "2dsphere" })

// Sample hub document
db.hubs.insertOne({
  "_id": ObjectId(),
  "id": "hub-naia",
  "name": "NAIA Sortation Center",
  "type": "sortation_center", // pickup, sortation_center, delivery_hub, destination
  "address": "NAIA Terminal 3, Pasay, Philippines",
  "formattedAddress": "NAIA Terminal 3, Airport Road, Pasay, Metro Manila, Philippines",
  "location": {
    "type": "Point",
    "coordinates": [121.0194, 14.5086]
  },
  "contact": {
    "phone": "+632-877-1109",
    "email": "naia@tracksnap.com",
    "managerName": "Roberto Santos",
    "managerPhone": "+639171234569"
  },
  "operational": {
    "capacity": 10000, // parcels per day
    "currentLoad": 3500,
    "operatingHours": {
      "monday": "06:00-22:00",
      "tuesday": "06:00-22:00",
      "wednesday": "06:00-22:00",
      "thursday": "06:00-22:00",
      "friday": "06:00-22:00",
      "saturday": "08:00-20:00",
      "sunday": "08:00-18:00"
    },
    "timezone": "Asia/Manila"
  },
  "coverage": {
    "type": "Polygon",
    "coordinates": [[
      [120.9500, 14.4500],
      [121.0500, 14.4500], 
      [121.0500, 14.5500],
      [120.9500, 14.5500],
      [120.9500, 14.4500]
    ]]
  },
  "status": "active", // active, inactive, maintenance
  "facilities": ["loading_dock", "sorting_area", "cold_storage", "security"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2025-10-05T10:00:00.000Z"
})

// 4. GEOCODING_CACHE COLLECTION
// Cache for address-to-coordinate conversions
db.geocoding_cache.createIndex({ "addressHash": 1 }, { unique: true })
db.geocoding_cache.createIndex({ "lastUsed": -1 })
db.geocoding_cache.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 2592000 }) // 30 days TTL

// Sample geocoding cache document
db.geocoding_cache.insertOne({
  "_id": ObjectId(),
  "addressInput": "SM Mall of Asia, Pasay, Philippines",
  "addressHash": "sha256_hash_of_normalized_address",
  "result": {
    "formattedAddress": "SM Mall of Asia, Seaside Boulevard, Pasay, Metro Manila, Philippines",
    "coordinates": {
      "type": "Point",
      "coordinates": [120.9842, 14.5995]
    },
    "components": {
      "country": "Philippines",
      "countryCode": "PH",
      "adminArea1": "Metro Manila",
      "adminArea2": "Pasay",
      "postalCode": "1300"
    },
    "accuracy": "ROOFTOP",
    "confidence": 0.95,
    "service": "nominatim"
  },
  "createdAt": "2025-10-05T10:00:00.000Z",
  "lastUsed": "2025-10-05T10:00:00.000Z",
  "useCount": 1
})

// 5. ANALYTICS COLLECTION (Optional)
// Pre-computed analytics and metrics
db.analytics.createIndex({ "type": 1, "date": -1 })
db.analytics.createIndex({ "type": 1, "period": 1 })

// Sample analytics document
db.analytics.insertOne({
  "_id": ObjectId(),
  "type": "daily_summary",
  "date": "2025-10-05",
  "metrics": {
    "totalParcels": 1250,
    "deliveredParcels": 1100,
    "pendingParcels": 150,
    "averageDeliveryTime": 4.2, // hours
    "customerSatisfaction": 4.7,
    "topCouriers": [
      { "courierId": "courier-001", "deliveries": 45, "rating": 4.9 },
      { "courierId": "courier-002", "deliveries": 42, "rating": 4.8 }
    ],
    "hubUtilization": {
      "hub-naia": { "capacity": 10000, "processed": 8500, "utilization": 85 },
      "hub-makati": { "capacity": 5000, "processed": 3200, "utilization": 64 }
    }
  },
  "createdAt": "2025-10-06T00:00:00.000Z"
})

// =====================================================
// AGGREGATION PIPELINES (Common Queries)
// =====================================================

// 1. Get parcel summary with latest tracking info
db.parcels.aggregate([
  {
    $lookup: {
      from: "couriers",
      let: { 
        latestTracking: { $arrayElemAt: ["$trackingLog", -1] }
      },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$id", "$$latestTracking.courierId"] }
          }
        }
      ],
      as: "courier"
    }
  },
  {
    $addFields: {
      latestTracking: { $arrayElemAt: ["$trackingLog", -1] },
      courierInfo: { $arrayElemAt: ["$courier", 0] }
    }
  },
  {
    $project: {
      id: 1,
      "recipient.name": 1,
      "recipient.phone": 1,
      status: 1,
      createdAt: 1,
      "latestTracking.timestamp": 1,
      "latestTracking.coordinates": 1,
      "courierInfo.name": 1,
      "courierInfo.phone": 1,
      "feedback.rating": 1
    }
  }
])

// 2. Find parcels near a location
db.parcels.find({
  "recipient.coordinates": {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [121.0244, 14.5547] // Makati coordinates
      },
      $maxDistance: 5000 // 5km radius
    }
  }
})

// 3. Courier performance analytics
db.parcels.aggregate([
  {
    $unwind: "$trackingLog"
  },
  {
    $match: {
      "trackingLog.courierId": { $exists: true },
      "trackingLog.timestamp": {
        $gte: new Date("2025-10-01T00:00:00.000Z"),
        $lt: new Date("2025-11-01T00:00:00.000Z")
      }
    }
  },
  {
    $group: {
      _id: "$trackingLog.courierId",
      totalDeliveries: { $sum: 1 },
      avgRating: { $avg: "$feedback.rating" },
      parcels: { $addToSet: "$id" }
    }
  },
  {
    $lookup: {
      from: "couriers",
      localField: "_id",
      foreignField: "id",
      as: "courierInfo"
    }
  }
])

// 4. Hub utilization report
db.parcels.aggregate([
  {
    $match: {
      createdAt: {
        $gte: new Date("2025-10-05T00:00:00.000Z"),
        $lt: new Date("2025-10-06T00:00:00.000Z")
      }
    }
  },
  {
    $group: {
      _id: {
        sortationHub: "$sortationCenter.address",
        deliveryHub: "$deliveryHub.address"
      },
      count: { $sum: 1 },
      statuses: { $push: "$status" }
    }
  }
])

// =====================================================
// VALIDATION RULES (MongoDB 3.6+)
// =====================================================

// Validation schema for parcels collection
db.runCommand({
  collMod: "parcels",
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "recipient", "status", "qr", "createdAt"],
      properties: {
        id: {
          bsonType: "string",
          pattern: "^parcel-[a-zA-Z0-9]{8}$"
        },
        recipient: {
          bsonType: "object",
          required: ["name", "phone", "address"],
          properties: {
            name: { bsonType: "string", minLength: 1 },
            phone: { bsonType: "string", minLength: 10 },
            email: { bsonType: "string" },
            address: { bsonType: "string", minLength: 1 },
            coordinates: {
              bsonType: "object",
              required: ["type", "coordinates"],
              properties: {
                type: { enum: ["Point"] },
                coordinates: {
                  bsonType: "array",
                  minItems: 2,
                  maxItems: 2,
                  items: { bsonType: "double" }
                }
              }
            }
          }
        },
        status: {
          enum: ["pending", "in_transit", "delivered", "flagged", "cancelled"]
        },
        trackingLog: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["timestamp", "coordinates"],
            properties: {
              timestamp: { bsonType: "date" },
              coordinates: {
                bsonType: "object",
                required: ["type", "coordinates"],
                properties: {
                  type: { enum: ["Point"] },
                  coordinates: {
                    bsonType: "array",
                    minItems: 2,
                    maxItems: 2,
                    items: { bsonType: "double" }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
})

// =====================================================
// SAMPLE QUERIES
// =====================================================

// Find all pending parcels
db.parcels.find({ status: "pending" }).sort({ createdAt: -1 })

// Find parcels delivered today
db.parcels.find({
  status: "delivered",
  deliveredAt: {
    $gte: new Date("2025-10-05T00:00:00.000Z"),
    $lt: new Date("2025-10-06T00:00:00.000Z")
  }
})

// Find parcels with poor ratings
db.parcels.find({
  "feedback.rating": { $lte: 2 },
  "feedback.issue": { $exists: true }
})

// Get active couriers with their current location
db.couriers.find({
  status: "active",
  lastKnownLocation: { $exists: true }
}).sort({ lastLocationUpdate: -1 })

// Find hubs near a specific location
db.hubs.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [121.0244, 14.5547]
      },
      $maxDistance: 10000 // 10km
    }
  }
})

// Text search for parcels by recipient name
db.parcels.createIndex({ "recipient.name": "text", "recipient.phone": "text" })
db.parcels.find({ $text: { $search: "Jane Doe" } })

// =====================================================
// PERFORMANCE TIPS
// =====================================================

/*
1. Use compound indexes for frequently queried combinations:
   - { status: 1, createdAt: -1 }
   - { "recipient.phone": 1, status: 1 }
   - { courierId: 1, timestamp: -1 } for tracking events

2. Use 2dsphere indexes for all location-based queries

3. Consider sharding strategy for large datasets:
   - Shard key: recipient.coordinates (for location-based distribution)
   - Or: createdAt (for time-based distribution)

4. Use read preferences for analytics queries:
   - Route complex aggregations to secondary replicas

5. Implement proper TTL indexes for temporary data:
   - Geocoding cache: 30 days
   - Old tracking events: 1 year

6. Use projection to limit returned fields in large collections

7. Consider using MongoDB Atlas Search for full-text search capabilities
*/