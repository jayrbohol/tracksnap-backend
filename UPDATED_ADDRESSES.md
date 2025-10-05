# Updated Metro Manila Addresses - Specific Locations

## 📍 More Specific, Geocodable Addresses

### **Primary Test Locations (Updated):**

#### **Before (Generic - Failed Geocoding):**
- ❌ `Makati Central Business District, Makati, Metro Manila, Philippines`
- ❌ `BGC Taguig, Metro Manila, Philippines`

#### **After (Specific - Should Work):**
- ✅ `Ayala Avenue, Makati, Philippines`
- ✅ `5th Avenue, Bonifacio Global City, Taguig, Philippines`

### **Complete Updated Address Set:**

#### **Primary Locations:**
- **Recipient**: `SM Mall of Asia, Pasay, Philippines`
- **Pickup**: `NAIA Terminal 3, Pasay, Philippines`
- **Sortation**: `Ayala Avenue, Makati, Philippines`
- **Delivery Hub**: `5th Avenue, Bonifacio Global City, Taguig, Philippines`

#### **Alternative Locations:**
- **Recipient**: `Rizal Park, Manila, Philippines`
- **Pickup**: `Roxas Boulevard, Manila, Philippines`
- **Sortation**: `EDSA, Quezon City, Philippines`
- **Delivery Hub**: `Ortigas Avenue, Pasig, Philippines`

#### **Other Locations:**
- **GPS Handoff**: `Ayala Avenue, Makati, Philippines`
- **Updated Sortation**: `Makati Avenue, Makati, Philippines`
- **Updated Hub**: `26th Street, Bonifacio Global City, Taguig, Philippines`

## 🗺️ Why These Should Work Better

### **Street-Level Specificity:**
- **Ayala Avenue**: Major street in Makati, well-known
- **5th Avatar**: Specific street in BGC
- **Roxas Boulevard**: Famous Manila waterfront street
- **EDSA**: Major highway, easily geocodable
- **Ortigas Avenue**: Major street in Pasig

### **Simplified Location Format:**
- Removed "Metro Manila" (redundant)
- Removed "Central Business District" (too generic)
- Used specific street names instead of district names
- Kept city names (Makati, Taguig, Manila, etc.)

### **Real Streets & Landmarks:**
- All are actual streets/locations in Metro Manila
- Well-documented in OpenStreetMap
- Specific enough for geocoding services
- Not overly complex or generic

## 🧪 Testing Strategy

These addresses follow the pattern:
```
[Specific Street/Landmark], [City], Philippines
```

Examples:
- `Ayala Avenue, Makati, Philippines` ✅
- `Roxas Boulevard, Manila, Philippines` ✅
- `EDSA, Quezon City, Philippines` ✅

This format is:
- **Specific enough** for geocoding
- **Simple enough** to avoid confusion
- **Real locations** that exist in OpenStreetMap
- **Filipino context** with proper city names

## 📍 Coordinate Expectations

- **Ayala Avenue, Makati**: ~14.5547°N, 121.0244°E
- **5th Avenue, BGC**: ~14.5515°N, 121.0481°E
- **Roxas Boulevard, Manila**: ~14.5800°N, 120.9770°E
- **EDSA, Quezon City**: ~14.6507°N, 121.0494°E

These should all geocode successfully with OpenStreetMap Nominatim API.