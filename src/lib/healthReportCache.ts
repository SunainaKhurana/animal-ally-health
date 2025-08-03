
import { HealthReport } from '@/hooks/useHealthReports';

const CACHE_KEY_PREFIX = 'health_reports_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData {
  data: HealthReport[];
  timestamp: number;
}

export const healthReportCache = {
  set: (petId: string, reports: HealthReport[]) => {
    try {
      const cacheData: CachedData = {
        data: reports,
        timestamp: Date.now()
      };
      localStorage.setItem(`${CACHE_KEY_PREFIX}${petId}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache health reports:', error);
    }
  },

  get: (petId: string): HealthReport[] | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${petId}`);
      if (!cached) return null;

      const cacheData: CachedData = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(`${CACHE_KEY_PREFIX}${petId}`);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to retrieve cached health reports:', error);
      return null;
    }
  },

  clear: (petId: string) => {
    try {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${petId}`);
    } catch (error) {
      console.warn('Failed to clear health report cache:', error);
    }
  },

  clearAll: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear all health report caches:', error);
    }
  }
};
