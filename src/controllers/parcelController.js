import { parcelService } from '../services/parcelService.js';

export async function createParcel(req, res, next) {
  try {
    const { recipient, metadata, sortationCenter, deliveryHub, pickupLocation } = req.body;
    if (!recipient || typeof recipient !== 'object') {
      return res.status(400).json({ error: 'recipient object is required' });
    }
    // Normalize & validate coordinates if provided
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
    const validatePoint = (pt, label) => {
      if (pt == null) return undefined;
      if (typeof pt !== 'object') throw new Error(label + ' must be object');
      const { lat, lng } = pt;
      const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
      if (!isNum(lat) || !isNum(lng)) throw new Error(label + '.lat & lng must be numbers');
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(label + ' out of range');
      return { lat, lng };
    };
    let sanitizedSortation; let sanitizedHub; let sanitizedPickup;
    try {
      sanitizedSortation = validatePoint(sortationCenter, 'sortationCenter');
      sanitizedHub = validatePoint(deliveryHub, 'deliveryHub');
      sanitizedPickup = validatePoint(pickupLocation, 'pickupLocation');
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }
    const parcel = await parcelService.createParcel({ recipient, metadata, pickupLocation: sanitizedPickup, sortationCenter: sanitizedSortation, deliveryHub: sanitizedHub });
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
    const parcel = await parcelService.updateHubs({ parcelId: id, sortationCenter, deliveryHub, actor });
    res.json(parcel);
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ error: 'Parcel not found' });
    if (/out of range|must be numbers/.test(err.message)) return res.status(400).json({ error: err.message });
    next(err);
  }
}
