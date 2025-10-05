/**
 * Geocoding service to convert addresses to coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 * Automatically uses database caching when PostgreSQL is configured
 */

import { geocodingServiceWithCache } from './geocodingServiceWithCache.js';

// Dynamic service selection based on current environment
function getGeocodingService() {
  const useCache = process.env.DATA_BACKEND === 'postgres';
  return useCache ? geocodingServiceWithCache : basicGeocodingService;
}

const basicGeocodingService = {
  /**
   * Convert address to coordinates using Nominatim API
   * @param {string} address - The address to geocode
   * @returns {Promise<{lat: number, lng: number, displayName: string}>} Coordinates and formatted address
   */
  async getCoordinates(address) {
    if (!address || typeof address !== 'string') {
      throw new Error('Address is required and must be a string');
    }

    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;

    try {
      console.log(`Geocoding address: ${address}`);
      
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
      console.error('Geocoding error:', error.message);
      throw new Error(`Failed to geocode address "${address}": ${error.message}`);
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

// Export the dynamic geocoding service
export const geocodingService = {
  async getCoordinates(address) {
    const service = getGeocodingService();
    return await service.getCoordinates(address);
  },
  
  validateCoordinates(lat, lng) {
    const service = getGeocodingService();
    return service.validateCoordinates(lat, lng);
  }
};

// Export cache stats and cleanup utilities when using PostgreSQL
export const geocodingCache = {
  getStats: () => {
    const useCache = process.env.DATA_BACKEND === 'postgres';
    return useCache ? geocodingServiceWithCache.getCacheStats() : Promise.resolve({ cacheEnabled: false, message: 'Geocoding cache requires PostgreSQL backend (DATA_BACKEND=postgres)' });
  },
  cleanup: (daysOld) => {
    const useCache = process.env.DATA_BACKEND === 'postgres';
    return useCache ? geocodingServiceWithCache.cleanupCache(daysOld) : Promise.resolve({ cleaned: 0, error: 'Cache not enabled' });
  }
};