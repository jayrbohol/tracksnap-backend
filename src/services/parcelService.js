import { v4 as uuid } from 'uuid';
import { qrGenerator } from '../utils/qrGenerator.js';
import { getParcelRepo } from '../services/repositories/index.js';
import { wsHub } from '../utils/wsHub.js';
import { geocodingService } from './geocodingService.js';

// Dynamic repository selection
const repo = getParcelRepo();

export const parcelService = {
  async createParcel({ recipient, metadata, pickupLocation, sortationCenter, deliveryHub }) {
    if (!recipient || typeof recipient !== 'object') throw new Error('recipient is required');
    
    // Validate mandatory fields
    if (!recipient.name || typeof recipient.name !== 'string' || recipient.name.trim().length === 0) {
      throw new Error('recipient.name is required and must be a non-empty string');
    }
    if (!recipient.phone || typeof recipient.phone !== 'string' || recipient.phone.trim().length === 0) {
      throw new Error('recipient.phone is required and must be a non-empty string');
    }
    if (!recipient.address || typeof recipient.address !== 'string' || recipient.address.trim().length === 0) {
      throw new Error('recipient.address is required and must be a non-empty string');
    }
    
    console.log('test data', recipient, metadata, pickupLocation, sortationCenter, deliveryHub);
    
    // Handle recipient address and geocode to coordinates (address is now mandatory)
    try {
      const geocodeResult = await geocodingService.getCoordinates(recipient.address);
      recipient = { 
        ...recipient, 
        coordinates: { lat: geocodeResult.lat, lng: geocodeResult.lng },
        formattedAddress: geocodeResult.displayName // Store the formatted address from geocoding
      };
      console.log(`Geocoded address "${recipient.address}" to coordinates:`, recipient.coordinates);
    } catch (error) {
      throw new Error(`Failed to geocode recipient address: ${error.message}`);
    }
    
    // If coordinates were also provided (legacy support), validate them but prioritize geocoded coordinates
    if (recipient.coordinates && typeof recipient.coordinates === 'object') {
      const { lat, lng } = recipient.coordinates;
      const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
      if (!isNum(lat) || !isNum(lng)) throw new Error('recipient.coordinates.lat & lng must be numbers');
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error('recipient.coordinates out of range');
    }

    // Helper function to geocode address strings or validate coordinate objects
    const processLocation = async (location, label) => {
      if (!location) return undefined;
      
      // If it's a string, treat as address and geocode
      if (typeof location === 'string') {
        try {
          const geocodeResult = await geocodingService.getCoordinates(location);
          console.log(`Geocoded ${label} "${location}" to coordinates:`, { lat: geocodeResult.lat, lng: geocodeResult.lng });
          return {
            address: location,
            formattedAddress: geocodeResult.displayName,
            coordinates: { lat: geocodeResult.lat, lng: geocodeResult.lng }
          };
        } catch (error) {
          throw new Error(`Failed to geocode ${label} address "${location}": ${error.message}`);
        }
      }
      
      // If it's an object, treat as legacy coordinates and validate
      if (typeof location === 'object' && location.lat !== undefined && location.lng !== undefined) {
        const { lat, lng } = location;
        const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
        if (!isNum(lat) || !isNum(lng)) throw new Error(label + '.lat & lng must be numbers');
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(label + ' out of range');
        return { coordinates: { lat, lng } }; // Legacy format
      }
      
      throw new Error(`${label} must be either an address string or coordinates object with lat/lng`);
    };

    // Process all location parameters
    const processedPickup = await processLocation(pickupLocation, 'pickupLocation');
    const processedSortation = await processLocation(sortationCenter, 'sortationCenter');
    const processedHub = await processLocation(deliveryHub, 'deliveryHub');
    const id = `parcel-${uuid().substring(0, 8)}`;
    const qr = await qrGenerator.generateDataUrl(id);
    const parcel = {
      id,
      recipient,
      metadata: metadata || {},
      pickupLocation: processedPickup,
      sortationCenter: processedSortation,
      deliveryHub: processedHub,
      legs: undefined, // will be computed on first tracking event
      hubAuditLog: [],
      status: 'pending',
      qr,
      handoffLog: [],
      trackingLog: [],
      feedback: null,
      createdAt: new Date().toISOString()
    };
    console.log('Creating parcel', parcel);
    await repo.save(parcel);
    return parcel;
  },

  async getParcel(id) {
    return repo.getById(id);
  },

  async logHandoff({ parcelId, courierId, gps, timestamp, photoURL }) {
    const parcel = await repo.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');
    
    // Process GPS location (can be address string or coordinates object)
    let processedGps = null;
    if (gps) {
      // If it's a string, treat as address and geocode
      if (typeof gps === 'string') {
        try {
          const geocodeResult = await geocodingService.getCoordinates(gps);
          console.log(`Geocoded handoff location "${gps}" to coordinates:`, { lat: geocodeResult.lat, lng: geocodeResult.lng });
          processedGps = {
            address: gps,
            formattedAddress: geocodeResult.displayName,
            coordinates: { lat: geocodeResult.lat, lng: geocodeResult.lng }
          };
        } catch (error) {
          throw new Error(`Failed to geocode handoff GPS address "${gps}": ${error.message}`);
        }
      } 
      // If it's an object, treat as legacy coordinates and validate
      else if (typeof gps === 'object' && gps.lat !== undefined && gps.lng !== undefined) {
        const { lat, lng } = gps;
        const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
        if (!isNum(lat) || !isNum(lng)) throw new Error('gps.lat & lng must be numbers');
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error('gps coordinates out of range');
        processedGps = { coordinates: { lat, lng } }; // Legacy format
      } else {
        throw new Error('gps must be either an address string or coordinates object with lat/lng');
      }
    }

    const logEntry = {
      timestamp: timestamp || new Date().toISOString(),
      gps: processedGps,
      courierId,
      photoURL: photoURL || null
    };
    parcel.handoffLog.push(logEntry);
    const oldStatus = parcel.status;
    parcel.status = 'delivered';
    parcel.deliveredAt = logEntry.timestamp;
    await repo.save(parcel);
    
    // Enhanced broadcasting with multiple event types
    wsHub.broadcastHandoff(parcel);
    
    // Broadcast status change if different
    if (oldStatus !== 'delivered') {
      wsHub.broadcastStatusUpdate(parcel.id, 'delivered', {
        deliveredAt: parcel.deliveredAt,
        courierId,
        location: processedGps
      });
    }
    
    return parcel;
  },

  async trackLocation({ parcelId, coordinates, timestamp }) {
    console.log('Tracking', parcelId, coordinates, timestamp);
    const parcel = await repo.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      throw new Error('Invalid coordinates');
    }
    // Compute legs distances on first tracking event if not already done and sufficient data is present
    const dest = parcel.recipient?.coordinates;
    const pickup = parcel.pickupLocation?.coordinates || parcel.pickupLocation; // Handle both new and legacy formats
    const sc = parcel.sortationCenter?.coordinates || parcel.sortationCenter;
    const hub = parcel.deliveryHub?.coordinates || parcel.deliveryHub;
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
    
    // Update status to in_transit if still pending
    const oldStatus = parcel.status;
    if (parcel.status === 'pending') {
      parcel.status = 'in_transit';
    }
    
    await repo.save(parcel);
    
    // Enhanced broadcasting with detailed tracking information
    const enhancedEntry = {
      ...entry,
      parcelId: parcel.id,
      status: parcel.status,
      legs: parcel.legs,
      metadata: parcel.metadata
    };
    
    wsHub.broadcastTracking(parcel.id, enhancedEntry);
    
    // Broadcast status change if transitioned from pending to in_transit
    if (oldStatus === 'pending' && parcel.status === 'in_transit') {
      wsHub.broadcastStatusUpdate(parcel.id, 'in_transit', {
        firstTrackingUpdate: entry.timestamp,
        location: entry.coordinates
      });
    }
    
    // Handle batch updates if parcel is part of a batch
    if (parcel.metadata?.batchId) {
      // Note: This would require additional batch management logic
      wsHub.broadcastToMultiple([parcel.metadata.batchId], 'batch_tracking_update', {
        updatedParcel: parcel.id,
        location: entry.coordinates,
        timestamp: entry.timestamp
      });
    }
    
    return { parcelId: parcel.id, latest: entry, count: parcel.trackingLog.length };
  },

  async addFeedback({ parcelId, rating, issue, comments }) {
    const parcel = await repo.getById(parcelId);
    if (!parcel) throw new Error('Parcel not found');
    
    const feedback = { 
      rating, 
      issue: issue || null, 
      comments: comments || null,
      timestamp: new Date().toISOString() 
    };
    
    parcel.feedback = feedback;
    const oldStatus = parcel.status;
    
    if (issue) {
      parcel.status = 'flagged';
    }
    
    await repo.save(parcel);
    
    // Broadcast feedback event
    wsHub.broadcastFeedback(parcel.id, feedback);
    
    // Broadcast status change if flagged
    if (issue && oldStatus !== 'flagged') {
      wsHub.broadcastStatusUpdate(parcel.id, 'flagged', {
        reason: 'customer_feedback',
        issue,
        rating,
        flaggedAt: feedback.timestamp
      });
    }
    
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
    
    // Helper function to process location (address string or coordinates object)
    const processLocation = async (location, label) => {
      if (!location) return undefined;
      
      // If it's a string, treat as address and geocode
      if (typeof location === 'string') {
        try {
          const geocodeResult = await geocodingService.getCoordinates(location);
          console.log(`Geocoded ${label} "${location}" to coordinates:`, { lat: geocodeResult.lat, lng: geocodeResult.lng });
          return {
            address: location,
            formattedAddress: geocodeResult.displayName,
            coordinates: { lat: geocodeResult.lat, lng: geocodeResult.lng }
          };
        } catch (error) {
          throw new Error(`Failed to geocode ${label} address "${location}": ${error.message}`);
        }
      }
      
      // If it's an object, treat as legacy coordinates and validate
      if (typeof location === 'object' && location.lat !== undefined && location.lng !== undefined) {
        const { lat, lng } = location;
        const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
        if (!isNum(lat) || !isNum(lng)) throw new Error(label + '.lat & lng must be numbers');
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error(label + ' out of range');
        return { coordinates: { lat, lng } }; // Legacy format
      }
      
      throw new Error(`${label} must be either an address string or coordinates object with lat/lng`);
    };

    const newSort = await processLocation(sortationCenter, 'sortationCenter');
    const newHub = await processLocation(deliveryHub, 'deliveryHub');
    
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
    
    const auditEntry = { 
      timestamp: new Date().toISOString(), 
      actor: actor || null, 
      changes 
    };
    
    parcel.hubAuditLog = parcel.hubAuditLog || [];
    parcel.hubAuditLog.push(auditEntry);
    
    // Reset legs so they recompute on next tracking event
    parcel.legs = undefined;
    
    await repo.save(parcel);
    
    // Broadcast route update with detailed change information
    wsHub.broadcastRouteUpdate(parcel.id, {
      actor: actor || 'system',
      changes,
      timestamp: auditEntry.timestamp,
      parcelId: parcel.id,
      newSortationCenter: parcel.sortationCenter,
      newDeliveryHub: parcel.deliveryHub
    });
    
    return parcel;
  }
};
