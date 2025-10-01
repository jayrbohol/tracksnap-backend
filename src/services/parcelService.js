import { v4 as uuid } from 'uuid';
import { qrGenerator } from '../utils/qrGenerator.js';
import { getParcelRepo } from '../services/repositories/index.js';
import { wsHub } from '../utils/wsHub.js';

// Dynamic repository selection
const repo = getParcelRepo();

export const parcelService = {
  async createParcel({ recipient, metadata, pickupLocation, sortationCenter, deliveryHub }) {
    if (!recipient || typeof recipient !== 'object') throw new Error('recipient is required');
    // Defensive validation of coordinates if present
    if (recipient.coordinates) {
      const { lat, lng } = recipient.coordinates;
      const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
      if (!isNum(lat) || !isNum(lng)) throw new Error('recipient.coordinates.lat & lng must be numbers');
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error('recipient.coordinates out of range');
      recipient = { ...recipient, coordinates: { lat, lng } }; // sanitized
    }
    const validatePoint = (obj, label) => {
      if (!obj) return undefined;
      const { lat, lng } = obj;
      const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
      if (!isNum(lat) || !isNum(lng)) throw new Error(label + '.lat & lng must be numbers');
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(label + ' out of range');
      return { lat, lng };
    };
    const sanitizedPickup = validatePoint(pickupLocation, 'pickupLocation');
    const sanitizedSortation = validatePoint(sortationCenter, 'sortationCenter');
    const sanitizedHub = validatePoint(deliveryHub, 'deliveryHub');
    const id = uuid();
    const qr = await qrGenerator.generateDataUrl(id);
    const parcel = {
      id,
      recipient,
      metadata: metadata || {},
      pickupLocation: sanitizedPickup,
      sortationCenter: sanitizedSortation,
      deliveryHub: sanitizedHub,
      legs: undefined, // will be computed on first tracking event
      hubAuditLog: [],
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
    // Compute legs distances on first tracking event if not already done and sufficient data is present
    const dest = parcel.recipient?.coordinates;
    const pickup = parcel.pickupLocation;
    const sc = parcel.sortationCenter;
    const hub = parcel.deliveryHub;
    const canCompute = dest && (sc || hub);
    if (!parcel.legs && canCompute) {
      // Lazy import haversine to avoid circular (utils already independent)
      const { haversineMeters, metersToKm } = await import('../utils/geo.js');
      const legs = {};
      if (pickup && sc) {
        const m = haversineMeters(pickup, sc); legs.pickupToSortation = { meters: m, km: metersToKm(m) };
      }
      if (sc && hub) {
        const m = haversineMeters(sc, hub); legs.sortationToHub = { meters: m, km: metersToKm(m) };
      }
      if (hub && dest) {
        const m = haversineMeters(hub, dest); legs.hubToDestination = { meters: m, km: metersToKm(m) };
      }
      if (sc && !hub && dest) { // direct route
        const m = haversineMeters(sc, dest); legs.sortationToDestination = { meters: m, km: metersToKm(m) };
      }
      // total route
      const totalMeters = Object.values(legs).reduce((acc, seg) => acc + (seg?.meters || 0), 0);
      if (totalMeters > 0) legs.totalRoute = { meters: totalMeters, km: metersToKm(totalMeters) };
      parcel.legs = legs;
    }
    const entry = {
      timestamp: timestamp || new Date().toISOString(),
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
      recipientCoordinates: dest ? { lat: dest.lat, lng: dest.lng } : null,
      pickupLocationCoordinates: pickup ? { lat: pickup.lat, lng: pickup.lng } : null,
      sortationCenterCoordinates: sc ? { lat: sc.lat, lng: sc.lng } : null,
      deliveryHubCoordinates: hub ? { lat: hub.lat, lng: hub.lng } : null
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
  ,
  async updateHubs({ parcelId, sortationCenter, deliveryHub, actor }) {
    const parcel = await repo.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');
    const validatePoint = (obj, label) => {
      if (!obj) return undefined;
      const { lat, lng } = obj;
      const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
      if (!isNum(lat) || !isNum(lng)) throw new Error(label + '.lat & lng must be numbers');
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(label + ' out of range');
      return { lat, lng };
    };
    const newSort = validatePoint(sortationCenter, 'sortationCenter');
    const newHub = validatePoint(deliveryHub, 'deliveryHub');
    const changes = {};
    if (typeof newSort !== 'undefined' && JSON.stringify(newSort) !== JSON.stringify(parcel.sortationCenter || null)) {
      changes.sortationCenter = { from: parcel.sortationCenter || null, to: newSort };
      parcel.sortationCenter = newSort;
    }
    if (typeof newHub !== 'undefined' && JSON.stringify(newHub) !== JSON.stringify(parcel.deliveryHub || null)) {
      changes.deliveryHub = { from: parcel.deliveryHub || null, to: newHub };
      parcel.deliveryHub = newHub;
    }
    if (Object.keys(changes).length === 0) return parcel; // nothing changed
    parcel.hubAuditLog = parcel.hubAuditLog || [];
    parcel.hubAuditLog.push({ timestamp: new Date().toISOString(), actor: actor || null, changes });
    // Reset legs so they recompute on next tracking event
    parcel.legs = undefined;
    await repo.save(parcel);
    return parcel;
  }
};
