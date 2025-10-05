import { parcelService } from '../services/parcelService.js';

export async function verifyScan(req, res, next) {
  try {
    const { parcelId, courierId, gps, timestamp, photoURL } = req.body;
    
    // Validate GPS parameter if provided (can be address string or coordinate object)
    if (gps) {
      // If it's a string, it should be an address
      if (typeof gps === 'string') {
        if (gps.trim().length === 0) {
          return res.status(400).json({ error: 'GPS address cannot be empty' });
        }
      }
      // If it's an object, it should be coordinates (legacy support)
      else if (typeof gps === 'object' && gps.lat !== undefined && gps.lng !== undefined) {
        const { lat, lng } = gps;
        const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
        if (!isNum(lat) || !isNum(lng)) {
          return res.status(400).json({ error: 'gps.lat & lng must be numbers' });
        }
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return res.status(400).json({ error: 'gps coordinates out of range' });
        }
      } else {
        return res.status(400).json({ error: 'gps must be either an address string or coordinates object with lat/lng' });
      }
    }

    const result = await parcelService.logHandoff({ parcelId, courierId, gps, timestamp, photoURL });

    res.json({ status: 'logged', parcel: result });
  } catch (err) {
    if (/geocode/.test(err.message)) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
