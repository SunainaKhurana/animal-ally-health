import { HealthReport } from '@/hooks/useHealthReports';
import { CompressedStorage } from '@/lib/performanceOptimizer';

const CACHE_KEY_PREFIX = 'health_reports_v2_';
const PREVIEW_KEY_PREFIX = 'health_previews_v2_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

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

export class ImprovedHealthReportCache {
  // Main cache operations
  static set(petId: string, reports: HealthReport[]): void {
    try {
      const cacheData: CachedData = {
        data: reports,
        timestamp: Date.now()
      };
      CompressedStorage.set(`${CACHE_KEY_PREFIX}${petId}`, cacheData);
    } catch (error) {
      console.warn('Failed to cache health reports:', error);
    }
  }

  static get(petId: string): HealthReport[] | null {
    try {
      const cached = CompressedStorage.get<CachedData>(`${CACHE_KEY_PREFIX}${petId}`);
      if (!cached) return null;
      
      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_EXPIRY) {
        CompressedStorage.remove(`${CACHE_KEY_PREFIX}${petId}`);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.warn('Failed to retrieve cached health reports:', error);
      return null;
    }
  }

  // Preview cache operations
  static cacheReportPreview(petId: string, report: Partial<HealthReport>): void {
    try {
      if (!report?.id || !report.title || !report.report_type || !report.report_date) return;

      const preview: CachedReportPreview = {
        id: report.id,
        pet_id: petId,
        title: report.title,
        report_type: report.report_type,
        report_date: report.report_date,
        report_label: report.report_label,
        vet_diagnosis: report.vet_diagnosis,
        image_url: report.image_url,
        ai_analysis: report.ai_analysis,
        status: report.status || 'completed',
        cached_at: Date.now(),
        has_ai_diagnosis: !!report.ai_analysis,
        ai_diagnosis_date: report.ai_analysis ? new Date().toISOString() : undefined
      };

      const key = `${PREVIEW_KEY_PREFIX}${petId}_${report.id}`;
      CompressedStorage.set(key, preview);
    } catch (error) {
      console.warn('Failed to cache report preview:', error);
    }
  }

  static getCachedPreviews(petId: string): CachedReportPreview[] {
    try {
      const previews: CachedReportPreview[] = [];
      
      // Get all preview keys for this pet (simulated)
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${PREVIEW_KEY_PREFIX}${petId}_`)) {
          try {
            const preview = CompressedStorage.get<CachedReportPreview>(key);
            if (preview && Date.now() - preview.cached_at < CACHE_EXPIRY) {
              previews.push(preview);
            } else if (preview) {
              CompressedStorage.remove(key);
            }
          } catch (e) {
            CompressedStorage.remove(key);
          }
        }
      }
      
      return previews.sort((a, b) => 
        new Date(b.report_date).getTime() - new Date(a.report_date).getTime()
      );
    } catch (error) {
      console.warn('Failed to get cached previews:', error);
      return [];
    }
  }

  // Update operations
  static updatePreviewWithDiagnosis(petId: string, reportId: string, aiAnalysis: string): void {
    try {
      const key = `${PREVIEW_KEY_PREFIX}${petId}_${reportId}`;
      const preview = CompressedStorage.get<CachedReportPreview>(key);
      
      if (preview) {
        preview.ai_analysis = aiAnalysis;
        preview.status = 'completed';
        preview.has_ai_diagnosis = true;
        preview.ai_diagnosis_date = new Date().toISOString();
        CompressedStorage.set(key, preview);
      }
    } catch (error) {
      console.warn('Failed to update cached preview:', error);
    }
  }

  static addReportToCache(petId: string, report: HealthReport): void {
    try {
      if (!report?.id) return;

      // Update main cache
      const existing = this.get(petId) || [];
      const filtered = existing.filter(r => r?.id !== report.id);
      const updated = [report, ...filtered];
      this.set(petId, updated);
      
      // Cache preview
      this.cacheReportPreview(petId, report);
    } catch (error) {
      console.warn('Failed to add report to cache:', error);
    }
  }

  // Utility operations
  static hasReports(petId: string): boolean {
    try {
      const cached = this.get(petId) || [];
      const previews = this.getCachedPreviews(petId);
      return cached.length > 0 || previews.length > 0;
    } catch {
      return false;
    }
  }

  static removeReportFromCache(petId: string, reportId: string): void {
    try {
      // Remove from main cache
      const cached = this.get(petId);
      if (cached) {
        const filtered = cached.filter(r => r?.id !== reportId);
        this.set(petId, filtered);
      }
      
      // Remove preview
      const previewKey = `${PREVIEW_KEY_PREFIX}${petId}_${reportId}`;
      CompressedStorage.remove(previewKey);
    } catch (error) {
      console.warn('Failed to remove report from cache:', error);
    }
  }

  static clear(petId: string): void {
    try {
      CompressedStorage.remove(`${CACHE_KEY_PREFIX}${petId}`);
      
      // Clear all previews for this pet
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${PREVIEW_KEY_PREFIX}${petId}_`)) {
          CompressedStorage.remove(key);
        }
      }
    } catch (error) {
      console.warn('Failed to clear health report cache:', error);
    }
  }

  static clearAll(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(CACHE_KEY_PREFIX) || key?.startsWith(PREVIEW_KEY_PREFIX)) {
          CompressedStorage.remove(key);
        }
      }
    } catch (error) {
      console.warn('Failed to clear all health report caches:', error);
    }
  }
}

// Legacy compatibility - export same interface
export const healthReportCache = {
  set: ImprovedHealthReportCache.set.bind(ImprovedHealthReportCache),
  get: ImprovedHealthReportCache.get.bind(ImprovedHealthReportCache),
  cacheReportPreview: ImprovedHealthReportCache.cacheReportPreview.bind(ImprovedHealthReportCache),
  getCachedPreviews: ImprovedHealthReportCache.getCachedPreviews.bind(ImprovedHealthReportCache),
  updatePreviewWithDiagnosis: ImprovedHealthReportCache.updatePreviewWithDiagnosis.bind(ImprovedHealthReportCache),
  addReportToCache: ImprovedHealthReportCache.addReportToCache.bind(ImprovedHealthReportCache),
  hasReports: ImprovedHealthReportCache.hasReports.bind(ImprovedHealthReportCache),
  removeReportFromCache: ImprovedHealthReportCache.removeReportFromCache.bind(ImprovedHealthReportCache),
  clear: ImprovedHealthReportCache.clear.bind(ImprovedHealthReportCache),
  clearAll: ImprovedHealthReportCache.clearAll.bind(ImprovedHealthReportCache)
};