import { parcelService } from '../services/parcelService.js';

export async function createParcel(req, res, next) {
  try {
    const { recipient, metadata } = req.body;
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
