import { parcelService } from '../services/parcelService.js';
import { haversineMeters, metersToKm } from '../utils/geo.js';

export async function trackParcel(req, res, next) {
  try {
    const { parcelId, coordinates, timestamp } = req.body;
    if (!parcelId) return res.status(400).json({ error: 'parcelId required' });

    // Retrieve parcel first to access recipient coordinates (destination)
    const parcel = await parcelService.getParcel(parcelId);
    if (!parcel) return res.status(404).json({ error: 'Parcel not found' });
    const recipientCoordinates = parcel?.recipient?.coordinates || null;

    // Proceed with tracking update (still requires current coordinates in body)
    const result = await parcelService.trackLocation({ parcelId, coordinates, recipientCoordinates, timestamp });

    let distanceMeters = null;
    if (recipientCoordinates && coordinates && typeof coordinates?.lat === 'number' && typeof coordinates?.lng === 'number') {
      distanceMeters = haversineMeters(coordinates, recipientCoordinates);
    }
    const distanceKm = metersToKm(distanceMeters);

    // Include recipient/destination coordinates & distance metrics
    res.status(201).json({ ...result, recipientCoordinates, distanceMeters, distanceKm });
  } catch (err) {
    next(err);
  }
}

export async function getTrackingHistory(req, res, next) {
  try {
    const { id } = req.params; // parcel id
    const history = await parcelService.getTrackingHistory(id);
    res.json({ parcelId: id, points: history, count: history.length });
  } catch (err) {
    next(err);
  }
}
