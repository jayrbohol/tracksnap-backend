/**
 * Enhanced Geocoding service with PostgreSQL database caching
 * Uses OpenStreetMap Nominatim API with database cache for performance
 */

import crypto from 'crypto';
import pg from 'pg';

let pgClient = null;

// Initialize PostgreSQL client if configured
function getPgClient() {
  if (pgClient) return pgClient;
  
  // Only create client if PostgreSQL is configured
  if (process.env.DATA_BACKEND === 'postgres') {
    const config = process.env.POSTGRES_CONNECTION_STRING ? {
      connectionString: process.env.POSTGRES_CONNECTION_STRING,
    } : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB || 'tracksnap',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
    };
    
    pgClient = new pg.Client(config);
    pgClient.connect().catch(err => {
      console.warn('PostgreSQL connection failed, geocoding cache disabled:', err.message);
      pgClient = null;
    });
  }
  
  return pgClient;
}

export const geocodingServiceWithCache = {
  /**
   * Convert address to coordinates using cache-first approach
   * @param {string} address - The address to geocode
   * @returns {Promise<{lat: number, lng: number, displayName: string}>} Coordinates and formatted address
   */
  async getCoordinates(address) {
    if (!address || typeof address !== 'string') {
      throw new Error('Address is required and must be a string');
    }

    const normalizedAddress = address.trim().toLowerCase();
    const addressHash = crypto.createHash('sha256').update(normalizedAddress).digest('hex');

    // Try cache first if PostgreSQL is available
    const client = getPgClient();
    if (client) {
      try {
        const cacheResult = await this.getCachedResult(client, addressHash);
        if (cacheResult) {
          console.log(`🚀 Cache HIT for address: ${address}`);
          return {
            lat: parseFloat(cacheResult.lat),
            lng: parseFloat(cacheResult.lng),
            displayName: cacheResult.formatted_address
          };
        }
      } catch (error) {
        console.warn('Cache lookup failed:', error.message);
      }
    }

    // Cache miss or no database - use Nominatim API
    console.log(`🌐 Cache MISS - Geocoding via API: ${address}`);
    const apiResult = await this.geocodeViaAPI(address);

    // Store in cache if database is available
    if (client && apiResult) {
      try {
        await this.storeCacheResult(client, address, addressHash, apiResult);
        console.log(`💾 Cached result for: ${address}`);
      } catch (error) {
        console.warn('Failed to cache result:', error.message);
      }
    }

    return apiResult;
  },

  /**
   * Get cached geocoding result
   */
  async getCachedResult(client, addressHash) {
    const query = `
      UPDATE geocoding_cache 
      SET last_used = NOW(), use_count = use_count + 1
      WHERE address_hash = $1
      RETURNING lat, lng, formatted_address;
    `;
    
    const result = await client.query(query, [addressHash]);
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  /**
   * Store geocoding result in cache
   */
  async storeCacheResult(client, originalAddress, addressHash, geocodeResult) {
    const query = `
      INSERT INTO geocoding_cache (
        address_input, address_hash, formatted_address, lat, lng, 
        accuracy, confidence, geocoding_service, created_at, last_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (address_hash) DO UPDATE SET
        last_used = NOW(),
        use_count = geocoding_cache.use_count + 1;
    `;

    await client.query(query, [
      originalAddress,
      addressHash,
      geocodeResult.displayName,
      geocodeResult.lat,
      geocodeResult.lng,
      'APPROXIMATE', // Nominatim accuracy level
      0.85, // Default confidence for Nominatim
      'nominatim'
    ]);
  },

  /**
   * Geocode via Nominatim API (original implementation)
   */
  async geocodeViaAPI(address) {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TrackSnap-API/1.0' // Required by Nominatim
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error(`Address not found: ${address}`);
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid coordinates returned for address: ${address}`);
      }

      return {
        lat,
        lng,
        displayName: result.display_name // Formatted address from API
      };
    } catch (error) {
      console.error('Geocoding API error:', error.message);
      throw new Error(`Failed to geocode address "${address}": ${error.message}`);
    }
  },

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    const client = getPgClient();
    if (!client) return { cacheEnabled: false };

    try {
      const query = `
        SELECT 
          COUNT(*) as total_entries,
          AVG(use_count) as avg_use_count,
          MAX(last_used) as most_recent_use,
          COUNT(*) FILTER (WHERE last_used > NOW() - INTERVAL '24 hours') as recent_entries
        FROM geocoding_cache;
      `;
      
      const result = await client.query(query);
      return {
        cacheEnabled: true,
        ...result.rows[0]
      };
    } catch (error) {
      return { cacheEnabled: true, error: error.message };
    }
  },

  /**
   * Clear old cache entries (cleanup utility)
   */
  async cleanupCache(daysOld = 30) {
    const client = getPgClient();
    if (!client) return { cleaned: 0 };

    try {
      const query = `
        DELETE FROM geocoding_cache 
        WHERE last_used < NOW() - INTERVAL '${daysOld} days'
        AND use_count < 3;
      `;
      
      const result = await client.query(query);
      console.log(`🧹 Cleaned up ${result.rowCount} old geocoding cache entries`);
      return { cleaned: result.rowCount };
    } catch (error) {
      console.error('Cache cleanup failed:', error.message);
      return { cleaned: 0, error: error.message };
    }
  },

  /**
   * Validate that coordinates are within valid ranges
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} True if coordinates are valid
   */
  validateCoordinates(lat, lng) {
    const isNum = (v) => typeof v === 'number' && !Number.isNaN(v);
    if (!isNum(lat) || !isNum(lng)) return false;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
    return true;
  }
};