import React from 'react';

// Performance monitoring and analytics
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static enabled = process.env.NODE_ENV === 'development';

  static startTimer(label: string): () => number {
    if (!this.enabled) return () => 0;
    
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  static recordMetric(label: string, value: number): void {
    if (!this.enabled) return;
    
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const values = this.metrics.get(label)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  static getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((values, label) => {
      if (values.length > 0) {
        result[label] = {
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    });
    
    return result;
  }

  static logReport(): void {
    if (!this.enabled) return;
    
    const metrics = this.getMetrics();
    console.group('🚀 Performance Report');
    
    Object.entries(metrics).forEach(([label, stats]) => {
      console.log(`${label}: avg=${stats.avg.toFixed(2)}ms, min=${stats.min.toFixed(2)}ms, max=${stats.max.toFixed(2)}ms (${stats.count} samples)`);
    });
    
    console.groupEnd();
  }

  static clear(): void {
    this.metrics.clear();
  }

  // React hook for measuring component render time
  static useRenderTimer(componentName: string) {
    if (!this.enabled) return;
    
    const start = performance.now();
    
    React.useEffect(() => {
      const duration = performance.now() - start;
      this.recordMetric(`Render: ${componentName}`, duration);
    });
  }
}

// Hook for measuring async operations
export const useAsyncTimer = (label: string) => {
  const measure = React.useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    const timer = PerformanceMonitor.startTimer(label);
    try {
      const result = await operation();
      return result;
    } finally {
      timer();
    }
  }, [label]);

  return measure;
};

// Export for easy access
if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = PerformanceMonitor;
}
