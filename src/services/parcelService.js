import { v4 as uuid } from 'uuid';
import { qrGenerator } from '../utils/qrGenerator.js';
import { getParcelRepo } from '../services/repositories/index.js';
import { wsHub } from '../utils/wsHub.js';

// Dynamic repository selection
const repo = getParcelRepo();

export const parcelService = {
  async createParcel({ recipient, metadata }) {
    const id = uuid();
    const qr = await qrGenerator.generateDataUrl(id);
    const parcel = {
      id,
      recipient,
      metadata: metadata || {},
      status: 'pending',
      qr,
      handoffLog: [],
      trackingLog: [],
      feedback: null,
      createdAt: new Date().toISOString()
    };
    await repo.save(parcel);
    return parcel;
  },

  async getParcel(id) {
    return repo.getById(id);
  },

  async logHandoff({ parcelId, courierId, gps, timestamp, photoURL }) {
    const parcel = await repo.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');
    const logEntry = {
      timestamp: timestamp || new Date().toISOString(),
      gps: gps || null,
      courierId,
      photoURL: photoURL || null
    };
    parcel.handoffLog.push(logEntry);
    parcel.status = 'delivered';
    await repo.save(parcel);
    wsHub.broadcastHandoff(parcel);
    return parcel;
  },

  async trackLocation({ parcelId, coordinates, timestamp }) {
    const parcel = await repo.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      throw new Error('Invalid coordinates');
    }
    const entry = {
      timestamp: timestamp || new Date().toISOString(),
      coordinates: { lat: coordinates.lat, lng: coordinates.lng }
    };
    parcel.trackingLog = parcel.trackingLog || [];
    parcel.trackingLog.push(entry);
    await repo.save(parcel);
    wsHub.broadcastTracking(parcel.id, entry);
    return { parcelId: parcel.id, latest: entry, count: parcel.trackingLog.length };
  },

  async addFeedback({ parcelId, rating, issue }) {
    const parcel = await repo.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');
    parcel.feedback = { rating, issue: issue || null, timestamp: new Date().toISOString() };
    if (issue) parcel.status = 'flagged';
    await repo.save(parcel);
    return parcel;
  }
  ,

  async getTrackingHistory(parcelId) {
    const parcel = await repo.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');
    return parcel.trackingLog || [];
  }
};
