# 🚚 TrackSnap Delivery Journey - Automated Test Collection

## Overview

This Postman collection simulates a complete end-to-end parcel delivery journey, automatically testing all TrackSnap API endpoints in a realistic sequence. The collection demonstrates the full lifecycle of a parcel from creation to final delivery with customer feedback.

## 🎯 What This Collection Tests

### Complete Delivery Journey Simulation
1. **Health Check** - Verify API availability
2. **Parcel Creation** - Create parcel with Metro Manila addresses
3. **Parcel Retrieval** - Verify parcel details
4. **Real-time Tracking** - 6 location updates simulating courier movement
5. **Route Updates** - Mid-journey hub changes with audit logging
6. **Final Delivery** - Courier handoff verification with GPS
7. **Customer Feedback** - 5-star rating submission
8. **Tracking History** - Complete journey retrieval
9. **Final Verification** - Status confirmation

### Journey Route 🗺️
```
📍 NAIA Terminal 3, Pasay (Pickup)
    ↓ 📍 En route to Sortation
📍 Ayala Avenue, Makati (Sortation Center)
    ↓ 🔄 Route Change → BGC
📍 5th Avenue, BGC, Taguig (Delivery Hub)
    ↓ 📍 Final delivery approach
📍 SM Mall of Asia, Pasay (Destination)
    ✅ DELIVERED
```

## 🚀 How to Use

### 1. Import Collection
- Import `TrackSnap-Delivery-Journey-Automated.postman_collection.json` into Postman
- The collection includes pre-configured variables and test scripts

### 2. Set Environment
- Base URL is set to `http://localhost:3000` by default
- Update `{{baseUrl}}` variable if your server runs on different port

### 3. Run Collection
**Option A: Run Entire Collection**
```bash
# Using Postman Runner
1. Click "Run Collection" 
2. Select all requests
3. Click "Run TrackSnap Delivery Journey"
```

**Option B: Newman (Command Line)**
```bash
npm install -g newman
newman run TrackSnap-Delivery-Journey-Automated.postman_collection.json
```

## 📊 Test Coverage

### Endpoints Tested
| Method | Endpoint | Purpose | Test Count |
|--------|----------|---------|------------|
| GET | `/health` | API health check | 3 tests |
| POST | `/parcel` | Create parcel with addresses | 6 tests |
| GET | `/parcel/:id` | Retrieve parcel details | 3 tests |
| POST | `/track-parcel` | Real-time location updates | 2 tests × 6 calls |
| PATCH | `/parcel/:id/hubs` | Update delivery hubs | 3 tests |
| POST | `/verify-scan` | Log delivery handoff | 4 tests |
| POST | `/feedback` | Submit customer feedback | 3 tests |
| GET | `/parcel/:id/tracking` | Get tracking history | 4 tests |

**Total: 45+ automated test assertions**

### Features Validated
✅ **Address Geocoding** - All addresses converted to coordinates  
✅ **QR Code Generation** - Base64 QR codes created  
✅ **GPS Tracking** - 6 location updates with distance calculations  
✅ **Route Optimization** - Legs computed automatically  
✅ **Hub Management** - Mid-journey route changes with audit trail  
✅ **Delivery Verification** - Courier handoff with photo URLs  
✅ **Customer Feedback** - Rating and issue reporting  
✅ **Data Persistence** - PostgreSQL database operations  
✅ **Error Handling** - Validation and error responses  

## 🧪 Test Data

### Parcel Details
```json
{
  "recipient": {
    "name": "Maria Santos",
    "phone": "+639171234567", 
    "email": "maria.santos@example.com",
    "address": "SM Mall of Asia, Pasay, Philippines"
  },
  "metadata": {
    "orderId": "TRK-2025-001",
    "weight": "3.2kg",
    "dimensions": "35x25x15cm", 
    "value": "₱12,500",
    "category": "Electronics",
    "priority": "Standard"
  }
}
```

### Tracking Points
| Time | Location | Coordinates | Description |
|------|----------|-------------|-------------|
| 13:00 | NAIA Terminal 3 | 14.5192, 121.0138 | Pickup |
| 13:30 | En route | 14.5400, 121.0000 | Transit |
| 14:00 | Ayala Avenue | 14.5525, 121.0271 | Sortation |
| 15:30 | En route to BGC | 14.5500, 121.0400 | Transit |
| 16:00 | BGC Hub | 14.5464, 121.0454 | Delivery Hub |
| 17:30 | SM Mall of Asia | 14.5350, 120.9816 | Final Delivery |

## 📈 Expected Results

### Successful Collection Run
```
✅ API Health Check: Server is running
✅ Created Parcel: parcel-xxxxxxxx
✅ Parcel Details Retrieved Successfully  
✅ Location 1: At NAIA Terminal 3 (Pickup)
✅ Location 2: En route to Makati Sortation Center
✅ Location 3: At Ayala Avenue Sortation Center
✅ Route Updated: Changed sortation center to BGC
✅ Location 4: En route to BGC Delivery Hub
✅ Location 5: At BGC Delivery Hub
✅ Location 6: Near SM Mall of Asia - 0.8km from destination
✅ DELIVERED: Parcel successfully delivered to recipient!
✅ Customer Feedback: 5-star rating submitted
✅ Journey Complete: Retrieved 6 tracking points
✅ Final Status: All systems verified
🎊 AUTOMATED DELIVERY JOURNEY TEST COMPLETE 🎊
```

### Key Metrics Validated
- **Parcel ID Format**: `parcel-xxxxxxxx` (8 char UUID)
- **Total Distance**: Calculated route legs in meters/km
- **Journey Duration**: ~5 hours (13:00 - 18:00)
- **Tracking Points**: 6 GPS coordinates
- **Final Status**: `delivered` with 5-star rating
- **Audit Trail**: Hub changes logged with timestamps

## 🔧 Customization

### Modify Test Data
Update request bodies in collection to test with:
- Different addresses (international, rural, etc.)
- Various parcel metadata (weight, value, priority)
- Alternative courier IDs
- Different timing intervals

### Add Error Scenarios
Extend collection with negative test cases:
- Invalid addresses
- Missing required fields  
- Non-existent parcel IDs
- Invalid coordinates
- Network timeouts

## 🐛 Troubleshooting

### Common Issues
1. **Server Not Running**: Ensure TrackSnap backend is running on port 3000
2. **Database Not Setup**: Verify PostgreSQL schema is created
3. **Geocoding Fails**: Check internet connection for address resolution
4. **Variables Not Set**: Parcel ID should auto-populate from first request

### Debug Mode
Enable Postman Console to see detailed test outputs:
```
View → Show Postman Console
```

## 📋 Integration

### CI/CD Pipeline
```bash
# Add to GitHub Actions / Jenkins
newman run TrackSnap-Delivery-Journey-Automated.postman_collection.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### Load Testing
```bash
# Run multiple iterations
newman run TrackSnap-Delivery-Journey-Automated.postman_collection.json \
  --iteration-count 10 \
  --delay-request 1000
```

This automated collection provides comprehensive validation of the TrackSnap API's core functionality, ensuring reliable parcel tracking from creation to delivery completion.