import React from 'react';

// Performance optimization utilities
export class PerformanceOptimizer {
  private static requestCache = new Map<string, { data: any; timestamp: number; expiry: number }>();
  private static pendingRequests = new Map<string, Promise<any>>();

  // Cache management
  static getCached<T>(key: string): T | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() < cached.timestamp + cached.expiry) {
      return cached.data;
    }
    if (cached) {
      this.requestCache.delete(key);
    }
    return null;
  }

  static setCached<T>(key: string, data: T, expiry: number = 300000): void { // 5 min default
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  // Request deduplication
  static async dedupedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check cache first
    const cached = this.getCached<T>(key);
    if (cached) {
      return cached;
    }

    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const request = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, request);
    const result = await request;
    
    // Cache successful results
    this.setCached(key, result);
    return result;
  }

  // Debounce utility
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Clear caches
  static clearCache(): void {
    this.requestCache.clear();
    this.pendingRequests.clear();
  }
}

// React hook for optimized data fetching
export const useOptimizedFetch = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: { cacheTime?: number; enabled?: boolean } = {}
) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { cacheTime = 300000, enabled = true } = options;

  React.useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await PerformanceOptimizer.dedupedRequest(key, fetchFn);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [...dependencies, enabled]);

  return { data, loading, error };
};

// Local storage with compression
export const CompressedStorage = {
  set: (key: string, data: any) => {
    try {
      const compressed = JSON.stringify(data);
      localStorage.setItem(key, compressed);
    } catch (error) {
      console.warn('Storage failed:', error);
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn('Storage retrieval failed:', error);
      return null;
    }
  },

  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Storage removal failed:', error);
    }
  }
};