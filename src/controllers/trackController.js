import { parcelService } from '../services/parcelService.js';

export async function trackParcel(req, res, next) {
  try {
    const { parcelId, coordinates, timestamp } = req.body;
    if (!parcelId) return res.status(400).json({ error: 'parcelId required' });
    const result = await parcelService.trackLocation({ parcelId, coordinates, timestamp });
    res.status(201).json(result);
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
