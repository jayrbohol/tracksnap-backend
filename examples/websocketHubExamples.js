/**
 * Enhanced WebSocket Hub Usage Examples
 * Demonstrates how to use the updated wsHub with parcel-specific subscriptions
 */

// ===================================
// CLIENT-SIDE USAGE EXAMPLES
// ===================================

// Example 1: Basic WebSocket connection and parcel subscription
const websocketExample = () => {
  const ws = new WebSocket('ws://localhost:3000/ws');
  
  ws.onopen = () => {
    console.log('Connected to TrackSnap WebSocket');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
    
    switch (data.type) {
      case 'welcome':
        // Subscribe to specific parcels after connection
        subscribeToParcel('parcel-abc123');
        subscribeToParcel('parcel-def456');
        break;
        
      case 'tracking':
        console.log(`Parcel ${data.parcelId} location update:`, data.point);
        updateTrackingUI(data.parcelId, data.point);
        break;
        
      case 'handoff':
        console.log(`Parcel ${data.parcelId} delivered!`, data.lastLog);
        markAsDelivered(data.parcelId, data.status);
        break;
        
      case 'status_update':
        console.log(`Parcel ${data.parcelId} status changed to: ${data.status}`);
        updateParcelStatus(data.parcelId, data.status);
        break;
        
      case 'route_update':
        console.log(`Parcel ${data.parcelId} route changed:`, data.change);
        updateRouteDisplay(data.parcelId, data.change);
        break;
        
      case 'subscribed':
        console.log(`✅ Now tracking: ${data.parcelId}`);
        break;
        
      case 'error':
        console.error('WebSocket error:', data.message);
        break;
    }
  };
  
  // Helper functions for subscription management
  function subscribeToParcel(parcelId) {
    ws.send(JSON.stringify({
      type: 'subscribe',
      parcelId: parcelId
    }));
  }
  
  function subscribeToMultipleParcels(parcelIds) {
    ws.send(JSON.stringify({
      type: 'subscribe',
      parcelIds: parcelIds
    }));
  }
  
  function unsubscribeFromParcel(parcelId) {
    ws.send(JSON.stringify({
      type: 'unsubscribe',
      parcelId: parcelId
    }));
  }
  
  function listSubscriptions() {
    ws.send(JSON.stringify({
      type: 'list_subscriptions'
    }));
  }
  
  return { subscribeToParcel, subscribeToMultipleParcels, unsubscribeFromParcel, listSubscriptions };
};

// ===================================
// SERVER-SIDE INTEGRATION EXAMPLES
// ===================================

// Example 2: Enhanced parcel service integration
import { wsHub } from '../utils/wsHub.js';

const enhancedParcelService = {
  async trackLocation({ parcelId, coordinates, timestamp }) {
    // ... existing tracking logic ...
    
    // Enhanced broadcasting with multiple webhook support
    const trackingEntry = {
      timestamp: timestamp || new Date().toISOString(),
      coordinates: { lat: coordinates.lat, lng: coordinates.lng },
      // ... other tracking data
    };
    
    // This will now broadcast only to clients subscribed to this specific parcel
    wsHub.broadcastTracking(parcelId, trackingEntry);
    
    // Optional: Also broadcast to multiple related parcels (e.g., batch deliveries)
    if (parcel.batchId) {
      const relatedParcels = await getBatchParcels(parcel.batchId);
      const relatedIds = relatedParcels.map(p => p.id).filter(id => id !== parcelId);
      wsHub.broadcastToMultiple(relatedIds, 'batch_update', {
        batchId: parcel.batchId,
        updatedParcel: parcelId,
        location: coordinates
      });
    }
    
    return parcel;
  },

  async updateParcelStatus(parcelId, newStatus, metadata = {}) {
    // ... status update logic ...
    
    // Broadcast status change to subscribed clients
    wsHub.broadcastStatusUpdate(parcelId, newStatus, metadata);
    
    return updatedParcel;
  },

  async updateHubs({ parcelId, sortationCenter, deliveryHub, actor }) {
    // ... existing hub update logic ...
    
    // Broadcast route changes to subscribed clients
    wsHub.broadcastRouteUpdate(parcelId, {
      actor,
      changes: {
        sortationCenter: { from: oldSortation, to: sortationCenter },
        deliveryHub: { from: oldHub, to: deliveryHub }
      },
      timestamp: new Date().toISOString()
    });
    
    return updatedParcel;
  }
};

// ===================================
// WEBHOOK INTEGRATION EXAMPLES
// ===================================

// Example 3: External webhook integration
const webhookIntegration = {
  // Register external webhooks for specific parcels
  async registerWebhook(parcelId, webhookUrl, events = ['tracking', 'handoff', 'status_update']) {
    // Store webhook configuration in database
    await webhookRepo.save({
      parcelId,
      url: webhookUrl,
      events,
      active: true,
      createdAt: new Date().toISOString()
    });
    
    // Optional: Subscribe to WebSocket for real-time webhook triggering
    // This could be handled by a separate webhook service
  },

  // Trigger external webhooks based on WebSocket events
  async triggerWebhooks(parcelId, eventType, data) {
    const webhooks = await webhookRepo.getByParcelId(parcelId);
    const relevantWebhooks = webhooks.filter(wh => wh.events.includes(eventType) && wh.active);
    
    for (const webhook of relevantWebhooks) {
      try {
        await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            parcelId,
            eventType,
            data,
            timestamp: new Date().toISOString(),
            webhookId: webhook.id
          })
        });
      } catch (error) {
        console.error(`Webhook failed for ${webhook.url}:`, error);
        // Could implement retry logic here
      }
    }
  }
};

// ===================================
// DASHBOARD/ADMIN USAGE EXAMPLES
// ===================================

// Example 4: Admin dashboard with subscription monitoring
const adminDashboard = {
  async getSubscriptionStats() {
    return wsHub.getSubscriptionStats();
  },

  async broadcastSystemAlert(message, priority = 'info') {
    // Broadcast to all connected clients
    wsHub.broadcastToMultiple(
      Array.from(wsHub.getSubscriptionStats().parcelSubscriptionCounts.keys()),
      'system_alert',
      { message, priority, timestamp: new Date().toISOString() }
    );
  },

  async broadcastParcelAlert(parcelIds, alert) {
    wsHub.broadcastToMultiple(parcelIds, 'parcel_alert', {
      alert,
      timestamp: new Date().toISOString()
    });
  }
};

// ===================================
// USAGE SCENARIOS
// ===================================

/*
SCENARIO 1: Customer tracking specific parcel
- Customer opens tracking page for parcel-abc123
- Frontend subscribes to parcel-abc123 via WebSocket
- Customer receives real-time updates only for their parcel
- Reduces bandwidth and improves user experience

SCENARIO 2: Courier app tracking multiple parcels
- Courier has 15 parcels in their batch
- Mobile app subscribes to all 15 parcel IDs
- Courier receives updates for any parcel in their batch
- Can track delivery progress across entire route

SCENARIO 3: Logistics dashboard monitoring high-priority parcels
- Admin selects "Priority" filter
- Dashboard subscribes to all priority parcel IDs
- Real-time monitoring of critical shipments
- Instant alerts for delays or issues

SCENARIO 4: Third-party integration
- E-commerce platform wants order updates
- Registers webhook for specific parcel
- WebSocket triggers webhook calls
- Real-time integration without polling

SCENARIO 5: Batch delivery optimization
- Multiple parcels in same delivery area
- Courier updates location once
- System broadcasts to all related parcels
- Customers get coordinated updates
*/

export { 
  websocketExample, 
  enhancedParcelService, 
  webhookIntegration, 
  adminDashboard 
};