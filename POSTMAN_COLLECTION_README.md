# TrackSnap API Postman Collection

This Postman collection provides comprehensive testing for the TrackSnap parcel tracking backend API, including the new address-based parcel creation functionality.

## 🆕 What's New in This Version

### Address-Based Parcel Creation
- **Primary Method**: Use `recipient.address` (string) - automatically geocoded to coordinates
- **Legacy Support**: Use `recipient.coordinates` (lat/lng object) - still supported for backward compatibility
- **Automatic Geocoding**: Powered by OpenStreetMap Nominatim API (no API key required)

## 📁 Collection Structure

### Core Functionality
1. **Health Check** - Verify API is running
2. **Create Parcel (Address-based)** - NEW: Create parcel using recipient address
3. **Create Parcel (Legacy Coordinates)** - Original coordinate-based creation
4. **Create Parcel (International Address)** - Test with international addresses
5. **Get Parcel by ID** - Retrieve parcel details
6. **Verify Scan (Log Handoff)** - Log parcel delivery
7. **Submit Feedback** - Record recipient feedback
8. **Track Parcel (Location Update)** - Real-time location tracking
9. **Update Hubs** - Modify sortation center and delivery hub
10. **Get Tracking History** - Retrieve complete tracking log

### Error Handling Tests
11. **Create Parcel (Error: No Address or Coordinates)** - Test validation
12. **Create Parcel (Error: Invalid Address)** - Test geocoding error handling

## 🚀 Quick Start

### 1. Import Collection and Environment
- Import `TrackSnap.postman_collection.json`
- Import `TrackSnap.postman_environment.json`
- Select the "TrackSnap Development Environment"

### 2. Start Your Server
```bash
cd tracksnap-backend
npm start
```
The server should be running on `http://localhost:4000`

### 3. Run the Collection
You can run requests individually or execute the entire collection as a test suite.

## 📝 API Usage Examples

### Address-Based Parcel Creation (Recommended)
```json
{
  "recipient": {
    "name": "Jane Doe",
    "phone": "+15550001111",
    "email": "jane@example.com",
    "address": "Times Square, New York, NY, USA"
  },
  "pickupLocation": { "lat": 40.6900, "lng": -74.0200 },
  "sortationCenter": { "lat": 40.7000, "lng": -74.0100 },
  "deliveryHub": { "lat": 40.7100, "lng": -74.0000 },
  "metadata": {
    "orderId": "ORDER123",
    "weight": "2.5kg",
    "dimensions": "30x20x10cm",
    "value": "$150"
  }
}
```

### Legacy Coordinates-Based Creation
```json
{
  "recipient": {
    "name": "John Smith",
    "phone": "+15550002222",
    "email": "john@example.com",
    "coordinates": { "lat": 40.7128, "lng": -74.0060 }
  },
  "metadata": { "orderId": "ORDER456" }
}
```

## 🧪 Test Features

### Automated Tests Include:
- **Address Geocoding**: Verifies addresses are converted to coordinates
- **Coordinate Validation**: Ensures coordinates are within valid ranges
- **QR Code Generation**: Confirms QR codes are generated as data URLs
- **Formatted Address Storage**: Checks that geocoded addresses are stored
- **Error Handling**: Tests invalid addresses and missing data
- **Parcel Tracking**: Validates location updates and distance calculations
- **Hub Management**: Tests sortation center and delivery hub updates

### Pre-request Scripts:
- Automatic timestamp generation for tracking updates
- Dynamic variable setting for chained requests

### Post-request Scripts:
- Automatic parcel ID extraction for subsequent requests
- Comprehensive response validation
- Error message verification

## 🌍 Supported Address Formats

The geocoding service supports various address formats:
- **US Addresses**: "Times Square, New York, NY, USA"
- **International**: "Big Ben, Westminster, London, UK"
- **Landmarks**: "Eiffel Tower, Paris, France"
- **Postal Codes**: "10001, New York, USA"
- **Street Addresses**: "1600 Amphitheatre Parkway, Mountain View, CA"

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | API base URL | `http://localhost:4000` |
| `parcelId` | Auto-set parcel ID | `parcel-abc12345` |
| `testAddressUS` | Sample US address | `Times Square, New York, NY, USA` |
| `testAddressUK` | Sample UK address | `Big Ben, Westminster, London, UK` |

## ⚡ Advanced Features

### WebSocket Testing
The collection includes tests for WebSocket notifications:
- Real-time tracking updates
- Handoff notifications
- Live parcel status changes

### Error Scenarios
- Invalid address handling
- Network failure simulation
- Malformed request testing
- Missing required fields

## 🔍 Debugging Tips

1. **Check Network Tab**: Monitor actual API calls
2. **Console Logs**: Use `console.log()` in test scripts
3. **Environment Variables**: Verify correct values are set
4. **Response Body**: Examine full API responses
5. **Status Codes**: Ensure expected HTTP status codes

## 📊 Collection Runner

For automated testing, use Postman's Collection Runner:
1. Select the entire collection
2. Choose your environment
3. Set iterations (recommended: 1)
4. Click "Run TrackSnap Backend API"

## 🤝 Contributing

When adding new endpoints or modifying existing ones:
1. Update the collection with new requests
2. Add appropriate test cases
3. Update environment variables if needed
4. Document changes in this README

## 📈 Performance Testing

The collection can be used with Newman for CI/CD:
```bash
npm install -g newman
newman run TrackSnap.postman_collection.json -e TrackSnap.postman_environment.json
```

## 🆘 Troubleshooting

### Common Issues:
- **Server not running**: Ensure `npm start` was executed
- **Wrong port**: Check if server is on port 4000
- **Geocoding failures**: Verify internet connection for API calls
- **Invalid coordinates**: Check lat/lng ranges (-90 to 90, -180 to 180)

### Support:
For issues or questions, check the TrackSnap API documentation or create an issue in the project repository.