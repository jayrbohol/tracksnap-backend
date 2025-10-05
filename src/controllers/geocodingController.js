/**
 * Controller for geocoding cache management and statistics
 */

import { geocodingCache } from '../services/geocodingService.js';

/**
 * GET /geocoding/cache/stats
 * Get geocoding cache statistics
 */
export async function getCacheStats(req, res, next) {
  try {
    if (!geocodingCache) {
      return res.json({
        cacheEnabled: false,
        message: 'Geocoding cache requires PostgreSQL backend (DATA_BACKEND=postgres)'
      });
    }

    const stats = await geocodingCache.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /geocoding/cache/cleanup
 * Clean up old geocoding cache entries
 */
export async function cleanupCache(req, res, next) {
  try {
    if (!geocodingCache) {
      return res.status(400).json({
        error: 'Geocoding cache cleanup requires PostgreSQL backend'
      });
    }

    const { daysOld = 30 } = req.body;
    const result = await geocodingCache.cleanup(daysOld);
    
    res.json({
      message: `Cache cleanup completed`,
      ...result
    });
  } catch (error) {
    next(error);
  }
}