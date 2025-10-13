import { WebSocketServer } from 'ws';

let wss;
// Track parcel subscriptions: Map<parcelId, Set<WebSocket>>
const parcelSubscriptions = new Map();
// Track client subscriptions: Map<WebSocket, Set<parcelId>>
const clientSubscriptions = new Map();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    // Initialize client subscription tracking
    clientSubscriptions.set(ws, new Set());
    
    ws.send(JSON.stringify({ 
      type: 'welcome', 
      ts: Date.now(),
      message: 'Connected to TrackSnap WebSocket. Send {"type":"subscribe","parcelId":"parcel-xxx"} to track specific parcels.'
    }));

    // Handle incoming messages for subscription management
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(ws, message);
      } catch (error) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid JSON message format',
          ts: Date.now()
        }));
      }
    });

    // Clean up subscriptions when client disconnects
    ws.on('close', () => {
      cleanupClientSubscriptions(ws);
    });
  });
  return wss;
}

/**
 * Handle incoming client messages for subscription management
 */
function handleClientMessage(ws, message) {
  const { type, parcelId, parcelIds } = message;
  
  switch (type) {
    case 'subscribe':
      if (parcelId) {
        subscribeToParcel(ws, parcelId);
      } else if (parcelIds && Array.isArray(parcelIds)) {
        parcelIds.forEach(id => subscribeToParcel(ws, id));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Subscribe requires "parcelId" or "parcelIds" array',
          ts: Date.now()
        }));
      }
      break;
      
    case 'unsubscribe':
      if (parcelId) {
        unsubscribeFromParcel(ws, parcelId);
      } else if (parcelIds && Array.isArray(parcelIds)) {
        parcelIds.forEach(id => unsubscribeFromParcel(ws, id));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unsubscribe requires "parcelId" or "parcelIds" array',
          ts: Date.now()
        }));
      }
      break;
      
    case 'list_subscriptions':
      const subscriptions = Array.from(clientSubscriptions.get(ws) || []);
      ws.send(JSON.stringify({
        type: 'subscriptions',
        parcelIds: subscriptions,
        count: subscriptions.length,
        ts: Date.now()
      }));
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown message type: ${type}. Supported: subscribe, unsubscribe, list_subscriptions`,
        ts: Date.now()
      }));
  }
}

/**
 * Subscribe a WebSocket client to a specific parcel ID
 */
function subscribeToParcel(ws, parcelId) {
  if (!parcelId || typeof parcelId !== 'string') {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid parcelId - must be a non-empty string',
      ts: Date.now()
    }));
    return;
  }

  // Add to parcel subscriptions
  if (!parcelSubscriptions.has(parcelId)) {
    parcelSubscriptions.set(parcelId, new Set());
  }
  parcelSubscriptions.get(parcelId).add(ws);
  
  // Add to client subscriptions
  clientSubscriptions.get(ws).add(parcelId);
  
  ws.send(JSON.stringify({
    type: 'subscribed',
    parcelId,
    message: `Now tracking updates for parcel: ${parcelId}`,
    ts: Date.now()
  }));
}

/**
 * Unsubscribe a WebSocket client from a specific parcel ID
 */
function unsubscribeFromParcel(ws, parcelId) {
  // Remove from parcel subscriptions
  if (parcelSubscriptions.has(parcelId)) {
    parcelSubscriptions.get(parcelId).delete(ws);
    if (parcelSubscriptions.get(parcelId).size === 0) {
      parcelSubscriptions.delete(parcelId);
    }
  }
  
  // Remove from client subscriptions
  if (clientSubscriptions.has(ws)) {
    clientSubscriptions.get(ws).delete(parcelId);
  }
  
  ws.send(JSON.stringify({
    type: 'unsubscribed',
    parcelId,
    message: `Stopped tracking updates for parcel: ${parcelId}`,
    ts: Date.now()
  }));
}

/**
 * Clean up all subscriptions for a disconnected client
 */
function cleanupClientSubscriptions(ws) {
  const clientParcels = clientSubscriptions.get(ws) || new Set();
  
  // Remove client from all parcel subscriptions
  for (const parcelId of clientParcels) {
    if (parcelSubscriptions.has(parcelId)) {
      parcelSubscriptions.get(parcelId).delete(ws);
      if (parcelSubscriptions.get(parcelId).size === 0) {
        parcelSubscriptions.delete(parcelId);
      }
    }
  }
  
  // Remove client subscription tracking
  clientSubscriptions.delete(ws);
}

/**
 * Broadcast to all connected clients (legacy support)
 */
function broadcast(obj) {
  if (!wss) return;
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

/**
 * Broadcast to clients subscribed to a specific parcel ID
 */
function broadcastToParcel(parcelId, obj) {
  if (!wss || !parcelSubscriptions.has(parcelId)) return;
  
  const msg = JSON.stringify({ ...obj, ts: Date.now() });
  const subscribers = parcelSubscriptions.get(parcelId);
  
  for (const client of subscribers) {
    if (client.readyState === 1) {
      client.send(msg);
    } else {
      // Clean up disconnected clients
      subscribers.delete(client);
    }
  }
  
  // Clean up empty subscription sets
  if (subscribers.size === 0) {
    parcelSubscriptions.delete(parcelId);
  }
}

/**
 * Broadcast to multiple parcel IDs simultaneously
 */
function broadcastToMultipleParcels(parcelIds, obj) {
  if (!Array.isArray(parcelIds)) return;
  
  parcelIds.forEach(parcelId => {
    broadcastToParcel(parcelId, obj);
  });
}

export const wsHub = {
  /**
   * Broadcast handoff event to clients tracking this parcel
   */
  broadcastHandoff(parcel) {
    const payload = { 
      type: 'handoff', 
      parcelId: parcel.id, 
      status: parcel.status, 
      lastLog: parcel.handoffLog.at(-1),
      metadata: parcel.metadata || {}
    };
    
    // Send to specific parcel subscribers
    broadcastToParcel(parcel.id, payload);
    
    // Also send to global broadcast for backward compatibility
    broadcast(payload);
  },

  /**
   * Broadcast tracking update to clients tracking this parcel
   */
  broadcastTracking(parcelId, entry) {
    const payload = { 
      type: 'tracking', 
      parcelId, 
      point: entry,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    
    // Send to specific parcel subscribers
    broadcastToParcel(parcelId, payload);
    
    // Also send to global broadcast for backward compatibility
    broadcast(payload);
  },

  /**
   * Broadcast parcel status updates
   */
  broadcastStatusUpdate(parcelId, status, metadata = {}) {
    const payload = {
      type: 'status_update',
      parcelId,
      status,
      metadata
    };
    
    broadcastToParcel(parcelId, payload);
    broadcast(payload);
  },

  /**
   * Broadcast route updates (hub changes)
   */
  broadcastRouteUpdate(parcelId, routeChange) {
    const payload = {
      type: 'route_update',
      parcelId,
      change: routeChange
    };
    
    broadcastToParcel(parcelId, payload);
    broadcast(payload);
  },

  /**
   * Broadcast feedback updates
   */
  broadcastFeedback(parcelId, feedback) {
    const payload = {
      type: 'feedback',
      parcelId,
      feedback
    };
    
    broadcastToParcel(parcelId, payload);
    broadcast(payload);
  },

  /**
   * Broadcast to multiple parcels simultaneously
   */
  broadcastToMultiple(parcelIds, type, data) {
    const payload = {
      type,
      ...data
    };
    
    broadcastToMultipleParcels(parcelIds, payload);
  },

  /**
   * Get subscription statistics
   */
  getSubscriptionStats() {
    return {
      totalParcelsTracked: parcelSubscriptions.size,
      totalConnectedClients: clientSubscriptions.size,
      averageSubscriptionsPerClient: clientSubscriptions.size > 0 
        ? Array.from(clientSubscriptions.values()).reduce((sum, subs) => sum + subs.size, 0) / clientSubscriptions.size 
        : 0,
      parcelSubscriptionCounts: Object.fromEntries(
        Array.from(parcelSubscriptions.entries()).map(([parcelId, subscribers]) => [parcelId, subscribers.size])
      )
    };
  },

  /**
   * Force cleanup of disconnected clients (utility function)
   */
  cleanup() {
    if (!wss) return;
    
    for (const [parcelId, subscribers] of parcelSubscriptions.entries()) {
      for (const client of subscribers) {
        if (client.readyState !== 1) {
          subscribers.delete(client);
        }
      }
      if (subscribers.size === 0) {
        parcelSubscriptions.delete(parcelId);
      }
    }
    
    for (const [client, parcels] of clientSubscriptions.entries()) {
      if (client.readyState !== 1) {
        clientSubscriptions.delete(client);
      }
    }
  }
};
