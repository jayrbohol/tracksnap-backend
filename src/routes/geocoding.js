/**
 * Routes for geocoding cache management
 */

import { Router } from 'express';
import { getCacheStats, cleanupCache } from '../controllers/geocodingController.js';

const router = Router();

// GET /geocoding/cache/stats
router.get('/cache/stats', getCacheStats);

// POST /geocoding/cache/cleanup  
router.post('/cache/cleanup', cleanupCache);

export default router;