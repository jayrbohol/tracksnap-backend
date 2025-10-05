import { parcelService } from '../services/parcelService.js';

export async function createParcel(req, res, next) {
  try {
    const { recipient, metadata, sortationCenter, deliveryHub, pickupLocation } = req.body;
    if (!recipient || typeof recipient !== 'object') {
      return res.status(400).json({ error: 'recipient object is required' });
    }
    
    // Validate mandatory recipient fields
    if (!recipient.name || typeof recipient.name !== 'string' || recipient.name.trim().length === 0) {
      return res.status(400).json({ error: 'recipient.name is required and must be a non-empty string' });
    }
    
    if (!recipient.phone || typeof recipient.phone !== 'string' || recipient.phone.trim().length === 0) {
      return res.status(400).json({ error: 'recipient.phone is required and must be a non-empty string' });
    }
    
    if (!recipient.address || typeof recipient.address !== 'string' || recipient.address.trim().length === 0) {
      return res.status(400).json({ error: 'recipient.address is required and must be a non-empty string' });
    }
    
    // Note: address is now mandatory, coordinates are optional (legacy support)
    // If coordinates are provided along with address, validate them
    
    if (recipient.coordinates) {
      const { coordinates } = recipient;
      const lat = coordinates.lat;
      const lng = coordinates.lng;
      const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
      if (!isNum(lat) || !isNum(lng)) {
        return res.status(400).json({ error: 'recipient.coordinates.lat & lng must be numbers' });
      }
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: 'recipient.coordinates out of range' });
      }
      // Strip extra props to keep schema tight
      recipient.coordinates = { lat, lng };
    }

    // Validate location parameters (can be address strings or coordinate objects)
    const validateLocation = (location, label) => {
      if (!location) return undefined;
      
      // If it's a string, it should be an address
      if (typeof location === 'string') {
        if (location.trim().length === 0) {
          throw new Error(`${label} address cannot be empty`);
        }
        return location;
      }
      
      // If it's an object, it should be coordinates (legacy support)
      if (typeof location === 'object' && location.lat !== undefined && location.lng !== undefined) {
        const { lat, lng } = location;
        const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
        if (!isNum(lat) || !isNum(lng)) throw new Error(label + '.lat & lng must be numbers');
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(label + ' out of range');
        return { lat, lng };
      }
      
      throw new Error(`${label} must be either an address string or coordinates object with lat/lng`);
    };

    let validatedSortation, validatedHub, validatedPickup;
    try {
      validatedSortation = validateLocation(sortationCenter, 'sortationCenter');
      validatedHub = validateLocation(deliveryHub, 'deliveryHub');
      validatedPickup = validateLocation(pickupLocation, 'pickupLocation');
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const parcel = await parcelService.createParcel({ recipient, metadata, pickupLocation: validatedPickup, sortationCenter: validatedSortation, deliveryHub: validatedHub });
    res.status(201).json(parcel);
  } catch (err) {
    next(err);
  }
}

export async function getParcelById(req, res, next) {
  try {
    const parcel = await parcelService.getParcel(req.params.id);
    if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
    res.json(parcel);
  } catch (err) {
    next(err);
  }
}

export async function updateParcelHubs(req, res, next) {
  try {
    const { id } = req.params;
    const { sortationCenter, deliveryHub, actor } = req.body;
    if (!sortationCenter && !deliveryHub) {
      return res.status(400).json({ error: 'Provide at least one of sortationCenter or deliveryHub' });
    }

    // Validate hub parameters (can be address strings or coordinate objects)
    const validateHub = (hub, label) => {
      if (!hub) return undefined;
      
      // If it's a string, it should be an address
      if (typeof hub === 'string') {
        if (hub.trim().length === 0) {
          throw new Error(`${label} address cannot be empty`);
        }
        return hub;
      }
      
      // If it's an object, it should be coordinates (legacy support)
      if (typeof hub === 'object' && hub.lat !== undefined && hub.lng !== undefined) {
        const { lat, lng } = hub;
        const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
        if (!isNum(lat) || !isNum(lng)) throw new Error(label + '.lat & lng must be numbers');
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(label + ' out of range');
        return { lat, lng };
      }
      
      throw new Error(`${label} must be either an address string or coordinates object with lat/lng`);
    };

    let validatedSortation, validatedHub;
    try {
      validatedSortation = validateHub(sortationCenter, 'sortationCenter');
      validatedHub = validateHub(deliveryHub, 'deliveryHub');
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const parcel = await parcelService.updateHubs({ parcelId: id, sortationCenter: validatedSortation, deliveryHub: validatedHub, actor });
    res.json(parcel);
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ error: 'Parcel not found' });
    if (/out of range|must be numbers|geocode/.test(err.message)) return res.status(400).json({ error: err.message });
    next(err);
  }
}
