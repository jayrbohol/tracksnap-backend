import pg from 'pg';
const { Pool } = pg;

let pool;

function ensurePool() {
  if (pool) return pool;
  
  const config = {
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || process.env.POSTGRES_DATABASE || 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };

  if (!config.password) {
    throw new Error('PostgreSQL password is required. Set POSTGRES_PASSWORD environment variable.');
  }

  pool = new Pool(config);
  
  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

// Helper function to convert database row to parcel object format
function convertRowToParcel(row, trackingEvents = [], handoffEvents = [], feedback = null) {
  const parcel = {
    id: row.id,
    recipient: {
      name: row.recipient_name,
      phone: row.recipient_phone,
      email: row.recipient_email,
      address: row.recipient_address,
      formattedAddress: row.recipient_formatted_address,
      coordinates: row.recipient_lat && row.recipient_lng ? {
        lat: parseFloat(row.recipient_lat),
        lng: parseFloat(row.recipient_lng)
      } : undefined
    },
    pickupLocation: row.pickup_address ? {
      address: row.pickup_address,
      formattedAddress: row.pickup_formatted_address,
      coordinates: row.pickup_lat && row.pickup_lng ? {
        lat: parseFloat(row.pickup_lat),
        lng: parseFloat(row.pickup_lng)
      } : undefined
    } : undefined,
    sortationCenter: row.sortation_address ? {
      address: row.sortation_address,
      formattedAddress: row.sortation_formatted_address,
      coordinates: row.sortation_lat && row.sortation_lng ? {
        lat: parseFloat(row.sortation_lat),
        lng: parseFloat(row.sortation_lng)
      } : undefined
    } : undefined,
    deliveryHub: row.delivery_hub_address ? {
      address: row.delivery_hub_address,
      formattedAddress: row.delivery_hub_formatted_address,
      coordinates: row.delivery_hub_lat && row.delivery_hub_lng ? {
        lat: parseFloat(row.delivery_hub_lat),
        lng: parseFloat(row.delivery_hub_lng)
      } : undefined
    } : undefined,
    legs: {
      pickupToSortation: row.pickup_to_sortation_meters ? {
        meters: row.pickup_to_sortation_meters,
        km: row.pickup_to_sortation_meters / 1000
      } : undefined,
      sortationToHub: row.sortation_to_hub_meters ? {
        meters: row.sortation_to_hub_meters,
        km: row.sortation_to_hub_meters / 1000
      } : undefined,
      hubToDestination: row.hub_to_destination_meters ? {
        meters: row.hub_to_destination_meters,
        km: row.hub_to_destination_meters / 1000
      } : undefined,
      sortationToDestination: row.sortation_to_destination_meters ? {
        meters: row.sortation_to_destination_meters,
        km: row.sortation_to_destination_meters / 1000
      } : undefined,
      totalRoute: row.total_route_meters ? {
        meters: row.total_route_meters,
        km: row.total_route_meters / 1000
      } : undefined
    },
    hubAuditLog: [], // Will be populated if needed
    status: row.status,
    qr: row.qr_code,
    handoffLog: handoffEvents.map(event => ({
      timestamp: event.timestamp,
      courierId: event.courier_id,
      gps: event.gps_lat && event.gps_lng ? {
        address: event.gps_address,
        formattedAddress: event.gps_formatted_address,
        coordinates: {
          lat: parseFloat(event.gps_lat),
          lng: parseFloat(event.gps_lng)
        }
      } : undefined,
      photoURL: event.photo_url,
      signatureURL: event.signature_url,
      notes: event.notes,
      qrScanned: event.qr_scanned,
      verificationCode: event.verification_code
    })),
    trackingLog: trackingEvents.map(event => ({
      timestamp: event.timestamp,
      coordinates: {
        lat: parseFloat(event.lat),
        lng: parseFloat(event.lng)
      },
      courierId: event.courier_id,
      deviceId: event.device_id,
      accuracy: event.accuracy ? parseFloat(event.accuracy) : undefined,
      speed: event.speed ? parseFloat(event.speed) : undefined,
      heading: event.heading ? parseFloat(event.heading) : undefined,
      altitude: event.altitude ? parseFloat(event.altitude) : undefined,
      batteryLevel: event.battery_level
    })),
    feedback: feedback ? {
      rating: feedback.rating,
      issue: feedback.issue,
      comments: feedback.comments,
      timestamp: feedback.timestamp,
      resolved: feedback.resolved,
      resolutionNotes: feedback.resolution_notes
    } : null,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveredAt: row.delivered_at
  };

  return parcel;
}

// Helper function to convert parcel object to database format
function convertParcelToRow(parcel) {
  return {
    id: parcel.id,
    recipient_name: parcel.recipient.name,
    recipient_phone: parcel.recipient.phone,
    recipient_email: parcel.recipient.email || null,
    recipient_address: parcel.recipient.address,
    recipient_formatted_address: parcel.recipient.formattedAddress || null,
    recipient_lat: parcel.recipient.coordinates?.lat || null,
    recipient_lng: parcel.recipient.coordinates?.lng || null,
    
    pickup_address: parcel.pickupLocation?.address || null,
    pickup_formatted_address: parcel.pickupLocation?.formattedAddress || null,
    pickup_lat: parcel.pickupLocation?.coordinates?.lat || null,
    pickup_lng: parcel.pickupLocation?.coordinates?.lng || null,
    
    sortation_address: parcel.sortationCenter?.address || null,
    sortation_formatted_address: parcel.sortationCenter?.formattedAddress || null,
    sortation_lat: parcel.sortationCenter?.coordinates?.lat || null,
    sortation_lng: parcel.sortationCenter?.coordinates?.lng || null,
    
    delivery_hub_address: parcel.deliveryHub?.address || null,
    delivery_hub_formatted_address: parcel.deliveryHub?.formattedAddress || null,
    delivery_hub_lat: parcel.deliveryHub?.coordinates?.lat || null,
    delivery_hub_lng: parcel.deliveryHub?.coordinates?.lng || null,
    
    status: parcel.status,
    qr_code: parcel.qr,
    metadata: JSON.stringify(parcel.metadata || {}),
    delivered_at: parcel.deliveredAt || null
  };
}

export const postgresParcelRepo = {
  async save(parcel) {
    const client = await ensurePool().connect();
    
    try {
      await client.query('BEGIN');
      
      const parcelRow = convertParcelToRow(parcel);
      
      // Insert or update parcel
      const parcelQuery = `
        INSERT INTO parcels (
          id, recipient_name, recipient_phone, recipient_email, recipient_address, 
          recipient_formatted_address, recipient_lat, recipient_lng,
          pickup_address, pickup_formatted_address, pickup_lat, pickup_lng,
          sortation_address, sortation_formatted_address, sortation_lat, sortation_lng,
          delivery_hub_address, delivery_hub_formatted_address, delivery_hub_lat, delivery_hub_lng,
          status, qr_code, metadata, delivered_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
        ) ON CONFLICT (id) DO UPDATE SET
          recipient_name = EXCLUDED.recipient_name,
          recipient_phone = EXCLUDED.recipient_phone,
          recipient_email = EXCLUDED.recipient_email,
          recipient_address = EXCLUDED.recipient_address,
          recipient_formatted_address = EXCLUDED.recipient_formatted_address,
          recipient_lat = EXCLUDED.recipient_lat,
          recipient_lng = EXCLUDED.recipient_lng,
          pickup_address = EXCLUDED.pickup_address,
          pickup_formatted_address = EXCLUDED.pickup_formatted_address,
          pickup_lat = EXCLUDED.pickup_lat,
          pickup_lng = EXCLUDED.pickup_lng,
          sortation_address = EXCLUDED.sortation_address,
          sortation_formatted_address = EXCLUDED.sortation_formatted_address,
          sortation_lat = EXCLUDED.sortation_lat,
          sortation_lng = EXCLUDED.sortation_lng,
          delivery_hub_address = EXCLUDED.delivery_hub_address,
          delivery_hub_formatted_address = EXCLUDED.delivery_hub_formatted_address,
          delivery_hub_lat = EXCLUDED.delivery_hub_lat,
          delivery_hub_lng = EXCLUDED.delivery_hub_lng,
          status = EXCLUDED.status,
          qr_code = EXCLUDED.qr_code,
          metadata = EXCLUDED.metadata,
          delivered_at = EXCLUDED.delivered_at,
          updated_at = NOW()
      `;
      
      await client.query(parcelQuery, [
        parcelRow.id, parcelRow.recipient_name, parcelRow.recipient_phone, parcelRow.recipient_email,
        parcelRow.recipient_address, parcelRow.recipient_formatted_address, parcelRow.recipient_lat, parcelRow.recipient_lng,
        parcelRow.pickup_address, parcelRow.pickup_formatted_address, parcelRow.pickup_lat, parcelRow.pickup_lng,
        parcelRow.sortation_address, parcelRow.sortation_formatted_address, parcelRow.sortation_lat, parcelRow.sortation_lng,
        parcelRow.delivery_hub_address, parcelRow.delivery_hub_formatted_address, parcelRow.delivery_hub_lat, parcelRow.delivery_hub_lng,
        parcelRow.status, parcelRow.qr_code, parcelRow.metadata, parcelRow.delivered_at
      ]);
      
      // Handle tracking events
      if (parcel.trackingLog && parcel.trackingLog.length > 0) {
        // First, delete existing tracking events to avoid duplicates
        await client.query('DELETE FROM tracking_events WHERE parcel_id = $1', [parcel.id]);
        
        // Insert new tracking events
        for (const event of parcel.trackingLog) {
          await client.query(`
            INSERT INTO tracking_events (
              parcel_id, timestamp, lat, lng, altitude, accuracy, speed, heading,
              courier_id, device_id, battery_level
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `, [
            parcel.id, event.timestamp, event.coordinates.lat, event.coordinates.lng,
            event.altitude, event.accuracy, event.speed, event.heading,
            event.courierId, event.deviceId, event.batteryLevel
          ]);
        }
      }
      
      // Handle handoff events
      if (parcel.handoffLog && parcel.handoffLog.length > 0) {
        // First, delete existing handoff events to avoid duplicates
        await client.query('DELETE FROM handoff_events WHERE parcel_id = $1', [parcel.id]);
        
        // Insert new handoff events
        for (const event of parcel.handoffLog) {
          await client.query(`
            INSERT INTO handoff_events (
              parcel_id, timestamp, courier_id, gps_address, gps_formatted_address,
              gps_lat, gps_lng, photo_url, signature_url, notes, qr_scanned, verification_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            parcel.id, event.timestamp, event.courierId,
            event.gps?.address, event.gps?.formattedAddress,
            event.gps?.coordinates?.lat, event.gps?.coordinates?.lng,
            event.photoURL, event.signatureURL, event.notes,
            event.qrScanned, event.verificationCode
          ]);
        }
      }
      
      // Handle feedback
      if (parcel.feedback) {
        await client.query(`
          INSERT INTO feedback (
            parcel_id, rating, issue, comments, timestamp, resolved, resolution_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (parcel_id) DO UPDATE SET
            rating = EXCLUDED.rating,
            issue = EXCLUDED.issue,
            comments = EXCLUDED.comments,
            timestamp = EXCLUDED.timestamp,
            resolved = EXCLUDED.resolved,
            resolution_notes = EXCLUDED.resolution_notes
        `, [
          parcel.id, parcel.feedback.rating, parcel.feedback.issue,
          parcel.feedback.comments, parcel.feedback.timestamp,
          parcel.feedback.resolved, parcel.feedback.resolutionNotes
        ]);
      }
      
      await client.query('COMMIT');
      return parcel;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getById(id) {
    const client = await ensurePool().connect();
    
    try {
      // Get parcel data
      const parcelResult = await client.query('SELECT * FROM parcels WHERE id = $1', [id]);
      if (parcelResult.rows.length === 0) {
        return null;
      }
      
      const parcelRow = parcelResult.rows[0];
      
      // Get tracking events
      const trackingResult = await client.query(
        'SELECT * FROM tracking_events WHERE parcel_id = $1 ORDER BY timestamp ASC',
        [id]
      );
      
      // Get handoff events
      const handoffResult = await client.query(
        'SELECT * FROM handoff_events WHERE parcel_id = $1 ORDER BY timestamp ASC',
        [id]
      );
      
      // Get feedback
      const feedbackResult = await client.query(
        'SELECT * FROM feedback WHERE parcel_id = $1 LIMIT 1',
        [id]
      );
      
      const feedback = feedbackResult.rows.length > 0 ? feedbackResult.rows[0] : null;
      
      return convertRowToParcel(parcelRow, trackingResult.rows, handoffResult.rows, feedback);
      
    } finally {
      client.release();
    }
  },

  // Additional helper methods for the normalized schema
  async addTrackingEvent(parcelId, trackingEvent) {
    const client = await ensurePool().connect();
    
    try {
      await client.query(`
        INSERT INTO tracking_events (
          parcel_id, timestamp, lat, lng, altitude, accuracy, speed, heading,
          courier_id, device_id, battery_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        parcelId, trackingEvent.timestamp, trackingEvent.coordinates.lat, trackingEvent.coordinates.lng,
        trackingEvent.altitude, trackingEvent.accuracy, trackingEvent.speed, trackingEvent.heading,
        trackingEvent.courierId, trackingEvent.deviceId, trackingEvent.batteryLevel
      ]);
    } finally {
      client.release();
    }
  },

  async addHandoffEvent(parcelId, handoffEvent) {
    const client = await ensurePool().connect();
    
    try {
      await client.query(`
        INSERT INTO handoff_events (
          parcel_id, timestamp, courier_id, gps_address, gps_formatted_address,
          gps_lat, gps_lng, photo_url, signature_url, notes, qr_scanned, verification_code
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        parcelId, handoffEvent.timestamp, handoffEvent.courierId,
        handoffEvent.gps?.address, handoffEvent.gps?.formattedAddress,
        handoffEvent.gps?.coordinates?.lat, handoffEvent.gps?.coordinates?.lng,
        handoffEvent.photoURL, handoffEvent.signatureURL, handoffEvent.notes,
        handoffEvent.qrScanned, handoffEvent.verificationCode
      ]);
    } finally {
      client.release();
    }
  },

  async updateFeedback(parcelId, feedback) {
    const client = await ensurePool().connect();
    
    try {
      await client.query(`
        INSERT INTO feedback (
          parcel_id, rating, issue, comments, timestamp, resolved, resolution_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (parcel_id) DO UPDATE SET
          rating = EXCLUDED.rating,
          issue = EXCLUDED.issue,
          comments = EXCLUDED.comments,
          timestamp = EXCLUDED.timestamp,
          resolved = EXCLUDED.resolved,
          resolution_notes = EXCLUDED.resolution_notes
      `, [
        parcelId, feedback.rating, feedback.issue,
        feedback.comments, feedback.timestamp,
        feedback.resolved, feedback.resolutionNotes
      ]);
    } finally {
      client.release();
    }
  }
};
