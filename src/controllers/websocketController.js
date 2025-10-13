/**
 * WebSocket Hub Management Controller
 * Provides REST endpoints for managing WebSocket subscriptions and monitoring
 */

import { wsHub } from '../utils/wsHub.js';

/**
 * Get current WebSocket subscription statistics
 * GET /ws/stats
 */
export async function getWebSocketStats(req, res, next) {
  try {
    const stats = wsHub.getSubscriptionStats();
    
    res.json({
      status: 'success',
      data: {
        ...stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Broadcast a message to all clients subscribed to specific parcel IDs
 * POST /ws/broadcast
 */
export async function broadcastToSubscribers(req, res, next) {
  try {
    const { parcelIds, type, data, message } = req.body;
    
    if (!parcelIds || !Array.isArray(parcelIds) || parcelIds.length === 0) {
      return res.status(400).json({
        error: 'parcelIds array is required and must not be empty'
      });
    }
    
    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        error: 'type is required and must be a string'
      });
    }
    
    // Broadcast to specified parcels
    wsHub.broadcastToMultiple(parcelIds, type, {
      message: message || 'Admin broadcast',
      data: data || {},
      broadcastId: `broadcast-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      status: 'success',
      message: `Broadcast sent to ${parcelIds.length} parcel subscription(s)`,
      data: {
        parcelIds,
        type,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send a system alert to all connected clients
 * POST /ws/system-alert
 */
export async function broadcastSystemAlert(req, res, next) {
  try {
    const { message, priority = 'info', targetParcels } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'message is required and must be a string'
      });
    }
    
    const validPriorities = ['info', 'warning', 'error', 'critical'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        error: `priority must be one of: ${validPriorities.join(', ')}`
      });
    }
    
    const alertPayload = {
      message,
      priority,
      alertId: `alert-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    
    if (targetParcels && Array.isArray(targetParcels) && targetParcels.length > 0) {
      // Send to specific parcels
      wsHub.broadcastToMultiple(targetParcels, 'system_alert', alertPayload);
    } else {
      // Send to all subscribed parcels
      const stats = wsHub.getSubscriptionStats();
      const allParcelIds = Object.keys(stats.parcelSubscriptionCounts);
      wsHub.broadcastToMultiple(allParcelIds, 'system_alert', alertPayload);
    }
    
    res.json({
      status: 'success',
      message: 'System alert broadcast successfully',
      data: {
        ...alertPayload,
        targetCount: targetParcels?.length || 'all_subscriptions'
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Trigger cleanup of disconnected WebSocket clients
 * POST /ws/cleanup
 */
export async function cleanupConnections(req, res, next) {
  try {
    const statsBefore = wsHub.getSubscriptionStats();
    
    // Force cleanup of disconnected clients
    wsHub.cleanup();
    
    const statsAfter = wsHub.getSubscriptionStats();
    
    res.json({
      status: 'success',
      message: 'WebSocket cleanup completed',
      data: {
        before: {
          connectedClients: statsBefore.totalConnectedClients,
          trackedParcels: statsBefore.totalParcelsTracked
        },
        after: {
          connectedClients: statsAfter.totalConnectedClients,
          trackedParcels: statsAfter.totalParcelsTracked
        },
        removed: {
          clients: statsBefore.totalConnectedClients - statsAfter.totalConnectedClients,
          parcels: statsBefore.totalParcelsTracked - statsAfter.totalParcelsTracked
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get all parcel IDs currently being tracked via WebSocket
 * GET /ws/tracked-parcels
 */
export async function getTrackedParcels(req, res, next) {
  try {
    const stats = wsHub.getSubscriptionStats();
    const trackedParcels = Object.entries(stats.parcelSubscriptionCounts).map(([parcelId, subscriberCount]) => ({
      parcelId,
      subscriberCount,
      isActive: subscriberCount > 0
    }));
    
    res.json({
      status: 'success',
      data: {
        totalParcels: trackedParcels.length,
        totalSubscribers: Object.values(stats.parcelSubscriptionCounts).reduce((a, b) => a + b, 0),
        parcels: trackedParcels,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Send a test message to specific parcel subscribers
 * POST /ws/test
 */
export async function sendTestMessage(req, res, next) {
  try {
    const { parcelId, message = 'Test message from TrackSnap API' } = req.body;
    
    if (!parcelId || typeof parcelId !== 'string') {
      return res.status(400).json({
        error: 'parcelId is required and must be a string'
      });
    }
    
    const stats = wsHub.getSubscriptionStats();
    const subscriberCount = stats.parcelSubscriptionCounts[parcelId] || 0;
    
    if (subscriberCount === 0) {
      return res.status(404).json({
        error: `No active subscribers found for parcel: ${parcelId}`
      });
    }
    
    wsHub.broadcastToMultiple([parcelId], 'test_message', {
      message,
      parcelId,
      testId: `test-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      status: 'success',
      message: `Test message sent to ${subscriberCount} subscriber(s) of parcel ${parcelId}`,
      data: {
        parcelId,
        subscriberCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}