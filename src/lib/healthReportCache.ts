
import { HealthReport } from '@/hooks/useHealthReports';

const CACHE_KEY_PREFIX = 'health_reports_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

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
  has_ai_diagnosis: boolean;
  ai_diagnosis_date?: string;
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
      console.log('💾 Cached reports for pet:', petId, reports.length);
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

      console.log('📦 Retrieved cached reports for pet:', petId, cacheData.data.length);
      return cacheData.data;
    } catch (error) {
      console.warn('Failed to retrieve cached health reports:', error);
      return null;
    }
  },

  // Enhanced methods for instant report preview caching
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
        status: report.status || 'completed',
        cached_at: Date.now(),
        has_ai_diagnosis: !!report.ai_analysis,
        ai_diagnosis_date: report.ai_analysis ? new Date().toISOString() : undefined
      };
      localStorage.setItem(key, JSON.stringify(preview));
      console.log('💾 Cached report preview:', report.id);
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
            const item = localStorage.getItem(key);
            if (item) {
              const preview = JSON.parse(item);
              // Check if preview is not expired and has required properties
              if (preview && preview.cached_at && Date.now() - preview.cached_at < CACHE_EXPIRY) {
                previews.push(preview);
              } else {
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
      
      console.log('📦 Retrieved cached previews for pet:', petId, previews.length);
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
        if (preview && typeof preview === 'object') {
          preview.ai_analysis = aiAnalysis;
          preview.status = 'completed';
          preview.has_ai_diagnosis = true;
          preview.ai_diagnosis_date = new Date().toISOString();
          localStorage.setItem(key, JSON.stringify(preview));
          console.log('✅ Updated cached preview with AI diagnosis:', reportId);
        }
      }
    } catch (error) {
      console.warn('Failed to update cached preview:', error);
    }
  },

  // Add new report to cache immediately after upload
  addReportToCache: (petId: string, report: HealthReport) => {
    try {
      // Update main cache
      const existing = this.get(petId) || [];
      const updated = [report, ...existing.filter(r => r.id !== report.id)];
      this.set(petId, updated);
      
      // Cache preview
      this.cacheReportPreview(petId, report);
      
      console.log('✅ Added new report to cache:', report.id);
    } catch (error) {
      console.warn('Failed to add report to cache:', error);
    }
  },

  // Check if cache has any reports
  hasReports: (petId: string): boolean => {
    try {
      const cached = this.get(petId);
      const previews = this.getCachedPreviews(petId);
      return (cached && cached.length > 0) || (previews && previews.length > 0);
    } catch (error) {
      console.warn('Failed to check cached reports:', error);
      return false;
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
      console.log('🗑️ Cleared cache for pet:', petId);
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
      console.log('🗑️ Cleared all health report caches');
    } catch (error) {
      console.warn('Failed to clear all health report caches:', error);
    }
  }
};
