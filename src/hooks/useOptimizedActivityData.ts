import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePetContext } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { PerformanceOptimizer, CompressedStorage } from '@/lib/performanceOptimizer';

interface ActivityItem {
  id: string;
  type: 'walk' | 'symptom' | 'health_report' | 'chat' | 'medication';
  title: string;
  time: string;
  status: string;
  icon: any;
  color: string;
  iconColor: string;
  route: string;
  timestamp: Date;
}

const ACTIVITY_CACHE_PREFIX = 'activity_cache_';
const CACHE_DURATION = 300000; // 5 minutes

export const useOptimizedActivityData = () => {
  const { selectedPet } = usePetContext();
  const [todayActivities, setTodayActivities] = useState<ActivityItem[]>([]);
  const [weekActivities, setWeekActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWeekly, setShowWeekly] = useState(false);

  // Memoized cache keys and date ranges
  const cacheKey = useMemo(() => 
    selectedPet ? `${ACTIVITY_CACHE_PREFIX}${selectedPet.id}_${format(new Date(), 'yyyy-MM-dd')}` : null,
    [selectedPet?.id]
  );

  const dateRanges = useMemo(() => {
    const today = new Date();
    return {
      todayStart: startOfDay(today),
      todayEnd: endOfDay(today),
      weekStart: startOfWeek(today, { weekStartsOn: 1 }),
      weekEnd: endOfWeek(today, { weekStartsOn: 1 })
    };
  }, []);

  // Optimized activity transformation
  const transformActivities = useCallback((data: any[], type: string, dateRange: 'today' | 'week') => {
    return data.map(item => {
      const timestamp = new Date(item.created_at);
      const timeFormat = dateRange === 'today' ? 'h:mm a' : 'MMM dd';
      
      switch (type) {
        case 'walks':
          return {
            id: `walk-${item.id}`,
            type: 'walk' as const,
            title: item.duration_minutes 
              ? `${item.duration_minutes} min walk ${dateRange === 'today' ? 'completed' : ''}`
              : 'Walk logged',
            time: format(timestamp, timeFormat),
            status: 'Completed',
            icon: '🚶‍♂️',
            color: 'bg-blue-100',
            iconColor: 'text-blue-600',
            route: '/activity',
            timestamp
          };
        case 'symptoms':
          return {
            id: `symptom-${item.id}`,
            type: 'symptom' as const,
            title: item.symptoms?.length 
              ? `Symptoms: ${item.symptoms.slice(0, 2).join(', ')}${item.symptoms.length > 2 ? '...' : ''}`
              : 'Symptoms reported',
            time: format(timestamp, timeFormat),
            status: item.ai_response ? 'Analyzed' : 'Processing',
            icon: '🩺',
            color: 'bg-red-100',
            iconColor: 'text-red-600',
            route: '/assistant',
            timestamp
          };
        case 'health_reports':
          return {
            id: `health-${item.id}`,
            type: 'health_report' as const,
            title: item.title || `${item.report_type || 'Health'} report`,
            time: format(timestamp, timeFormat),
            status: item.status === 'completed' ? 'Analyzed' : 'Processing',
            icon: '📋',
            color: 'bg-green-100',
            iconColor: 'text-green-600',
            route: '/health-reports',
            timestamp
          };
        case 'prescriptions':
          return {
            id: `prescription-${item.id}`,
            type: 'medication' as const,
            title: item.title || 'Prescription',
            time: format(timestamp, timeFormat),
            status: 'Active',
            icon: '💊',
            color: 'bg-purple-100',
            iconColor: 'text-purple-600',
            route: '/care',
            timestamp
          };
        default:
          return null;
      }
    }).filter(Boolean);
  }, []);

  // Optimized data fetching
  const fetchActivities = useCallback(async () => {
    if (!selectedPet || !cacheKey) {
      setTodayActivities([]);
      setWeekActivities([]);
      setShowWeekly(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check cache first
      const cached = CompressedStorage.get<{
        todayActivities: ActivityItem[];
        weekActivities: ActivityItem[];
        showWeekly: boolean;
      }>(cacheKey);

      if (cached) {
        setTodayActivities(cached.todayActivities);
        setWeekActivities(cached.weekActivities);
        setShowWeekly(cached.showWeekly);
        setLoading(false);
        return;
      }

      // Fetch fresh data with optimized queries
      const requests = [
        supabase
          .from('walks')
          .select('id, duration_minutes, created_at')
          .eq('pet_id', selectedPet.id)
          .gte('created_at', dateRanges.todayStart.toISOString())
          .lte('created_at', dateRanges.todayEnd.toISOString())
          .order('created_at', { ascending: false }),

        supabase
          .from('symptom_reports')
          .select('id, symptoms, ai_response, created_at')
          .eq('pet_id', selectedPet.id)
          .gte('created_at', dateRanges.todayStart.toISOString())
          .lte('created_at', dateRanges.todayEnd.toISOString())
          .order('created_at', { ascending: false }),

        supabase
          .from('health_reports')
          .select('id, title, report_type, status, created_at')
          .eq('pet_id', selectedPet.id)
          .gte('created_at', dateRanges.todayStart.toISOString())
          .lte('created_at', dateRanges.todayEnd.toISOString())
          .order('created_at', { ascending: false }),

        supabase
          .from('prescriptions')
          .select('id, title, created_at')
          .eq('pet_id', selectedPet.id)
          .gte('created_at', dateRanges.todayStart.toISOString())
          .lte('created_at', dateRanges.todayEnd.toISOString())
          .order('created_at', { ascending: false })
      ];

      const [walks, symptoms, healthReports, prescriptions] = await Promise.all(requests);

      // Transform today's data
      const todayItems: ActivityItem[] = [
        ...transformActivities(walks.data || [], 'walks', 'today'),
        ...transformActivities(symptoms.data || [], 'symptoms', 'today'),
        ...transformActivities(healthReports.data || [], 'health_reports', 'today'),
        ...transformActivities(prescriptions.data || [], 'prescriptions', 'today')
      ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setTodayActivities(todayItems);

      let weekItems: ActivityItem[] = [];
      let shouldShowWeekly = false;

      // If no today activities, fetch week's data
      if (todayItems.length === 0) {
        const weekRequests = [
          supabase
            .from('walks')
            .select('id, duration_minutes, created_at')
            .eq('pet_id', selectedPet.id)
            .gte('created_at', dateRanges.weekStart.toISOString())
            .lte('created_at', dateRanges.weekEnd.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('symptom_reports')
            .select('id, symptoms, ai_response, created_at')
            .eq('pet_id', selectedPet.id)
            .gte('created_at', dateRanges.weekStart.toISOString())
            .lte('created_at', dateRanges.weekEnd.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('health_reports')
            .select('id, title, report_type, status, created_at')
            .eq('pet_id', selectedPet.id)
            .gte('created_at', dateRanges.weekStart.toISOString())
            .lte('created_at', dateRanges.weekEnd.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('prescriptions')
            .select('id, title, created_at')
            .eq('pet_id', selectedPet.id)
            .gte('created_at', dateRanges.weekStart.toISOString())
            .lte('created_at', dateRanges.weekEnd.toISOString())
            .order('created_at', { ascending: false })
            .limit(5)
        ];

        const [weekWalks, weekSymptoms, weekHealthReports, weekPrescriptions] = await Promise.all(weekRequests);

        weekItems = [
          ...transformActivities(weekWalks.data || [], 'walks', 'week'),
          ...transformActivities(weekSymptoms.data || [], 'symptoms', 'week'),
          ...transformActivities(weekHealthReports.data || [], 'health_reports', 'week'),
          ...transformActivities(weekPrescriptions.data || [], 'prescriptions', 'week')
        ]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 4);

        shouldShowWeekly = weekItems.length > 0;
      }

      setWeekActivities(weekItems);
      setShowWeekly(shouldShowWeekly);

      // Cache results
      CompressedStorage.set(cacheKey, {
        todayActivities: todayItems,
        weekActivities: weekItems,
        showWeekly: shouldShowWeekly
      });

    } catch (error) {
      console.error('❌ Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPet, cacheKey, dateRanges, transformActivities]);

  // Debounced effect
  useEffect(() => {
    const debouncedFetch = PerformanceOptimizer.debounce(fetchActivities, 100);
    debouncedFetch();
  }, [fetchActivities]);

  return {
    activities: showWeekly ? weekActivities : todayActivities,
    loading,
    showWeekly,
    refresh: fetchActivities
  };
};