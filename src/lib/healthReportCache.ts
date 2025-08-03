import { HealthReport } from '@/hooks/useHealthReports';

const CACHE_KEY_PREFIX = 'health_reports_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CachedData {
  data: HealthReport[];
  timestamp: number;
}

interface CachedReportPreview {
  id: string;
  pet_id: string;
  title: string;
  report_type: string;
  report_date: string;
  report_label?: string;
  vet_diagnosis?: string;
  image_url?: string;
  ai_analysis?: string;
  status: 'processing' | 'completed' | 'failed';
  cached_at: number;
}

export const healthReportCache = {
  // Main cache methods for complete reports
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

  // New methods for instant report preview caching
  cacheReportPreview: (petId: string, report: Partial<HealthReport>) => {
    try {
      const key = `${CACHE_KEY_PREFIX}preview_${petId}_${report.id}`;
      const preview: CachedReportPreview = {
        id: report.id!,
        pet_id: petId,
        title: report.title!,
        report_type: report.report_type!,
        report_date: report.report_date!,
        report_label: report.report_label,
        vet_diagnosis: report.vet_diagnosis,
        image_url: report.image_url,
        ai_analysis: report.ai_analysis,
        status: report.status || 'processing',
        cached_at: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(preview));
    } catch (error) {
      console.warn('Failed to cache report preview:', error);
    }
  },

  getCachedPreviews: (petId: string): CachedReportPreview[] => {
    try {
      const previews: CachedReportPreview[] = [];
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(`${CACHE_KEY_PREFIX}preview_${petId}_`)) {
          try {
            const preview = JSON.parse(localStorage.getItem(key)!);
            // Check if preview is not expired (keep for 7 days)
            if (Date.now() - preview.cached_at < 7 * 24 * 60 * 60 * 1000) {
              previews.push(preview);
            } else {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
      
      return previews.sort((a, b) => new Date(b.report_date).getTime() - new Date(a.report_date).getTime());
    } catch (error) {
      console.warn('Failed to get cached previews:', error);
      return [];
    }
  },

  updatePreviewWithDiagnosis: (petId: string, reportId: string, aiAnalysis: string) => {
    try {
      const key = `${CACHE_KEY_PREFIX}preview_${petId}_${reportId}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        const preview = JSON.parse(cached);
        preview.ai_analysis = aiAnalysis;
        preview.status = 'completed';
        localStorage.setItem(key, JSON.stringify(preview));
      }
    } catch (error) {
      console.warn('Failed to update cached preview:', error);
    }
  },

  clear: (petId: string) => {
    try {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${petId}`);
      // Also clear all previews for this pet
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`${CACHE_KEY_PREFIX}preview_${petId}_`)) {
          localStorage.removeItem(key);
        }
      });
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
