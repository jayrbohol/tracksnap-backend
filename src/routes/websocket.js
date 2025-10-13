/**
 * WebSocket Hub Management Routes
 * REST endpoints for managing WebSocket subscriptions and broadcasting
 */

import { Router } from 'express';
import { 
  getWebSocketStats, 
  broadcastToSubscribers, 
  broadcastSystemAlert,
  cleanupConnections,
  getTrackedParcels,
  sendTestMessage
} from '../controllers/websocketController.js';

const router = Router();

// GET /ws/stats - Get WebSocket subscription statistics
router.get('/stats', getWebSocketStats);

// GET /ws/tracked-parcels - Get all parcel IDs currently being tracked
router.get('/tracked-parcels', getTrackedParcels);

// POST /ws/broadcast - Broadcast message to specific parcel subscribers
router.post('/broadcast', broadcastToSubscribers);

// POST /ws/system-alert - Send system alert to all or specific subscribers
router.post('/system-alert', broadcastSystemAlert);

// POST /ws/cleanup - Force cleanup of disconnected WebSocket clients
router.post('/cleanup', cleanupConnections);

// POST /ws/test - Send test message to specific parcel subscribers
router.post('/test', sendTestMessage);

export default router;