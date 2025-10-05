# TrackSnap API - Metro Manila Locations Update

## 📍 Updated: October 5, 2025

## 🇵🇭 Metro Manila, Philippines Locations

### Real Addresses Used (All Geocodable)

#### **Primary Test Locations:**
- **Recipient Address**: `SM Mall of Asia, Pasay, Metro Manila, Philippines`
- **Pickup Location**: `NAIA Terminal 3, Pasay, Metro Manila, Philippines`
- **Sortation Center**: `Makati Central Business District, Makati, Metro Manila, Philippines`
- **Delivery Hub**: `BGC Taguig, Metro Manila, Philippines`

#### **Alternative Test Locations:**
- **Recipient Address**: `Rizal Park, Manila, Philippines`
- **Pickup Location**: `Manila Bay, Manila, Philippines`
- **Sortation Center**: `Quezon City Hall, Quezon City, Philippines`
- **Delivery Hub**: `Ortigas Center, Pasig, Metro Manila, Philippines`

#### **GPS/Handoff Location:**
- **Handoff Location**: `Ayala Triangle, Makati, Metro Manila, Philippines`

#### **Hub Update Locations:**
- **Updated Sortation**: `Updated Makati Sorting Facility, Makati, Metro Manila, Philippines`
- **Updated Hub**: `Updated BGC Distribution Center, Taguig, Metro Manila, Philippines`

### Coordinate References (Metro Manila)
- **Manila City Center**: `14.5995, 120.9842`
- **NAIA Terminal 3**: `14.5086, 121.0194`
- **Makati CBD**: `14.5547, 121.0244`
- **BGC Taguig**: `14.5515, 121.0481`

## 🔄 Changes Made

### Environment Variables Updated:
```json
{
  "testAddressPH": "SM Mall of Asia, Pasay, Metro Manila, Philippines",
  "testPickupAddress": "NAIA Terminal 3, Pasay, Metro Manila, Philippines",
  "testSortationAddress": "Makati Central Business District, Makati, Metro Manila, Philippines",
  "testHubAddress": "BGC Taguig, Metro Manila, Philippines"
}
```

### Postman Collection Updates:
1. **Create Parcel (Address-based)**: Uses SM Mall of Asia as recipient, NAIA as pickup
2. **Create Parcel (Metro Manila Address)**: Uses Rizal Park as recipient
3. **Create Parcel (Legacy Coordinates)**: Uses Manila coordinates
4. **Verify Scan**: Uses Ayala Triangle for GPS location
5. **Update Hubs**: Uses Makati and BGC locations

### Phone Numbers Updated:
- Changed from US format (`+1555...`) to Philippines format (`+639...`)
- Examples: `+639171234567`, `+639181234567`, `+639191234567`

### Currency Updated:
- Changed from USD (`$75`) to PHP (`₱3750`)
- Changed from GBP (`£45`) to PHP (`₱2250`)

## 🗺️ Why These Locations?

### ✅ **Verified Real Locations:**
- **SM Mall of Asia**: Major shopping mall, easily recognizable
- **NAIA Terminal 3**: International airport, well-known landmark
- **Makati CBD**: Business district, clear geographic area
- **BGC Taguig**: Modern business district, popular location
- **Rizal Park**: National park, famous landmark
- **Ayala Triangle**: Business area, recognizable location

### ✅ **Geocoding Friendly:**
- All locations are major landmarks or districts
- Well-documented in OpenStreetMap
- Unambiguous names with proper city/region context
- Include "Metro Manila, Philippines" for clarity

### ✅ **Logistics Realistic:**
- NAIA Terminal 3: Realistic pickup point (airport cargo)
- Makati CBD: Logical sortation center (business district)
- BGC Taguig: Modern delivery hub location
- SM Mall of Asia: Common delivery destination

## 🧪 Testing Benefits

### **Geocoding Success:**
- All addresses should successfully resolve to coordinates
- No more "Address not found" errors
- Consistent response format

### **Real-World Accuracy:**
- Actual distances between locations
- Realistic delivery routes
- Valid Philippine postal geography

### **Cultural Relevance:**
- Local phone number formats
- Philippine peso currency
- Metro Manila context

## 📋 Next Steps

1. **Test the Collection**: Run the updated Postman requests
2. **Verify Geocoding**: Confirm all addresses resolve correctly
3. **Check Distances**: Validate calculated route distances
4. **Monitor Performance**: Ensure geocoding service responds well

## 🌏 Geographic Context

**Metro Manila Bounds:**
- **Latitude Range**: 14.4° to 14.8° North
- **Longitude Range**: 120.9° to 121.1° East
- **Major Cities**: Manila, Quezon City, Makati, Pasig, Taguig, Pasay
- **Key Districts**: Makati CBD, BGC, Ortigas Center, Manila Bay Area

All test locations fall within this geographic area, ensuring realistic parcel delivery scenarios within Metro Manila's urban logistics network.