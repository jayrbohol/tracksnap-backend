/**
 * Example usage of the updated createParcel function
 * This shows how to use the new address-based approach
 */

// Example 1: Using address (new approach)
const exampleWithAddress = {
  recipient: {
    name: "John Doe",
    phone: "+1234567890",
    email: "john@example.com",
    address: "1600 Amphitheatre Parkway, Mountain View, CA, USA" // This will be geocoded to coordinates
  },
  metadata: {
    weight: "2.5kg",
    dimensions: "30x20x10cm",
    value: "$150"
  },
  pickupLocation: {
    lat: 37.4221,
    lng: -122.0841
  },
  sortationCenter: {
    lat: 37.4419,
    lng: -122.1430
  },
  deliveryHub: {
    lat: 37.4419,
    lng: -122.1430
  }
};

// Example 2: Using coordinates (legacy support)
const exampleWithCoordinates = {
  recipient: {
    name: "Jane Smith",
    phone: "+1987654321",
    email: "jane@example.com",
    coordinates: {
      lat: 37.4419,
      lng: -122.1430
    }
  },
  metadata: {
    weight: "1.2kg",
    dimensions: "20x15x5cm",
    value: "$75"
  }
};

// Example 3: POST request body for address-based parcel creation
const postRequestExample = {
  method: "POST",
  url: "/parcel",
  body: {
    recipient: {
      name: "Alice Johnson",
      phone: "+1122334455",
      email: "alice@example.com",
      address: "Times Square, New York, NY, USA"
    },
    metadata: {
      weight: "0.8kg",
      dimensions: "15x10x8cm",
      value: "$45",
      description: "Birthday gift"
    }
  }
};

console.log("Example API usage:");
console.log("1. Address-based (recommended):", JSON.stringify(exampleWithAddress, null, 2));
console.log("2. Coordinates-based (legacy):", JSON.stringify(exampleWithCoordinates, null, 2));
console.log("3. POST request example:", JSON.stringify(postRequestExample, null, 2));