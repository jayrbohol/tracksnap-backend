import { parcelService } from '../services/parcelService.js';

export async function createParcel(req, res, next) {
  try {
    const { recipient, metadata } = req.body;
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
    const parcel = await parcelService.createParcel({ recipient, metadata });
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
