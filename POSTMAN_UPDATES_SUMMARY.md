# TrackSnap API - Postman Collection Updates Summary

## 📅 Updated: October 5, 2025

## 🔄 Major Changes

### 1. Address-Based Parcel Creation
- **NEW**: Primary parcel creation now uses `recipient.address` instead of coordinates
- **Geocoding**: Automatic address-to-coordinate conversion using OpenStreetMap Nominatim API
- **Backward Compatible**: Legacy `recipient.coordinates` still supported

### 2. Enhanced Postman Collection
- **3 New Create Parcel Requests**:
  - `Create Parcel (Address-based)` - Primary method using addresses
  - `Create Parcel (Legacy Coordinates)` - Backward compatibility
  - `Create Parcel (International Address)` - International address testing

- **2 New Error Test Cases**:
  - `Create Parcel (Error: No Address or Coordinates)` - Validation testing
  - `Create Parcel (Error: Invalid Address)` - Geocoding error handling

### 3. Improved Test Coverage
- **Address Geocoding Tests**: Verify coordinates are generated from addresses
- **Formatted Address Storage**: Confirm geocoded addresses are stored
- **Enhanced Error Handling**: Comprehensive error scenario testing
- **International Support**: Test cases for global addresses

### 4. New Documentation
- **POSTMAN_COLLECTION_README.md**: Comprehensive usage guide
- **TrackSnap.postman_environment.json**: Pre-configured environment variables
- **Examples**: Real-world address examples for testing

## 📝 API Request Changes

### Before (Coordinates Only)
```json
{
  "recipient": {
    "name": "Jane Doe",
    "coordinates": { "lat": 40.7128, "lng": -74.0060 }
  }
}
```

### After (Address-Based - Recommended)
```json
{
  "recipient": {
    "name": "Jane Doe",
    "address": "Times Square, New York, NY, USA"
  }
}
```

### API Response Enhancements
```json
{
  "recipient": {
    "name": "Jane Doe",
    "address": "Times Square, New York, NY, USA",
    "coordinates": { "lat": 40.758896, "lng": -73.985130 },
    "formattedAddress": "Times Square, Manhattan, New York, New York, 10036, United States"
  }
}
```

## 🚀 Benefits

1. **User-Friendly**: Natural address input instead of GPS coordinates
2. **Global Support**: Works with international addresses
3. **Automatic Formatting**: Standardized address formatting
4. **Error Resilient**: Comprehensive error handling for invalid addresses
5. **Backward Compatible**: Existing coordinate-based code continues to work

## 🧪 Testing Features

### Automated Test Cases
- ✅ Address geocoding validation
- ✅ Coordinate range validation  
- ✅ QR code generation verification
- ✅ Formatted address storage
- ✅ Error message validation
- ✅ International address support
- ✅ Legacy coordinate compatibility

### Test Data Examples
- **US Addresses**: Times Square, Silicon Valley locations
- **International**: London landmarks, global cities
- **Error Cases**: Invalid addresses, malformed data

## 📂 New Files Added

1. `TrackSnap.postman_collection.json` (updated)
2. `TrackSnap.postman_environment.json` (new)
3. `POSTMAN_COLLECTION_README.md` (new)
4. `examples/addressExamples.js` (new)

## 🔧 Environment Setup

### Required Variables
- `baseUrl`: API endpoint (default: http://localhost:4000)
- `parcelId`: Auto-populated from create parcel responses
- `testAddressUS`: Sample US address for testing
- `testAddressUK`: Sample UK address for testing

### Optional Variables  
- `testRecipientName`, `testRecipientPhone`, `testRecipientEmail`
- Test coordinates for pickup, sortation, and hub locations

## 📊 Collection Statistics

- **Total Requests**: 12 (was 7)
- **Test Scripts**: 100% coverage with automated validation
- **Error Scenarios**: 2 dedicated error test cases
- **International Support**: Multi-country address examples
- **Backward Compatibility**: Full legacy coordinate support

## 🎯 Next Steps

1. **Import Updated Collection**: Use the new JSON files in Postman
2. **Update Environment**: Set up the new environment variables
3. **Run Test Suite**: Execute full collection to verify functionality
4. **Review Documentation**: Check the comprehensive README

## 🔗 Related Changes

- **Backend Service**: `parcelService.js` updated with geocoding
- **Controller**: `parcelController.js` enhanced validation
- **New Service**: `geocodingService.js` for address conversion
- **Dependencies**: No new npm packages required (uses fetch API)

---

**Note**: The geocoding service uses OpenStreetMap Nominatim API which is free and requires no API keys, making it ideal for development and testing.