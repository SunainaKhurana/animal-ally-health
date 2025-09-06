
import { useState, useEffect } from 'react';
import { usePetContext } from '@/contexts/PetContext';
import { useRealHealthStatus } from '@/hooks/useRealHealthStatus';

interface ActivityData {
  day: string;
  walks: number;
  feedings: number;
  playtime: number;
}

interface ActivityItem {
  id: string;
  type: 'walk' | 'feeding' | 'health' | 'checkup';
  title: string;
  time: string;
  icon: string;
}

interface DashboardData {
  weeklyActivity: ActivityData[];
  hasActivity: boolean;
  recentActivities: ActivityItem[];
  healthReports: number;
  lastCheckup: string | null;
  healthStatus: 'good' | 'attention' | 'unknown';
  upcomingReminders: number;
}

export const useDashboardData = () => {
  const { selectedPet } = usePetContext();
  const { healthAnalysis, loading: healthLoading } = useRealHealthStatus(selectedPet?.id);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    weeklyActivity: [],
    hasActivity: false,
    recentActivities: [],
    healthReports: 0,
    lastCheckup: null,
    healthStatus: 'unknown',
    upcomingReminders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedPet) {
      setLoading(false);
      return;
    }

    // Generate mock data for activity (will be replaced with real data later)
    const generateMockActivityData = () => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyActivity: ActivityData[] = days.map(day => ({
        day,
        walks: Math.floor(Math.random() * 3),
        feedings: Math.floor(Math.random() * 4),
        playtime: Math.floor(Math.random() * 2)
      }));

      const hasActivity = weeklyActivity.some(day => 
        day.walks > 0 || day.feedings > 0 || day.playtime > 0
      );

      const recentActivities: ActivityItem[] = hasActivity ? [
        {
          id: '1',
          type: 'walk',
          title: `${selectedPet.name} went for a morning walk`,
          time: '2 hours ago',
          icon: '🚶‍♂️'
        },
        {
          id: '2', 
          type: 'feeding',
          title: 'Breakfast served',
          time: '5 hours ago',
          icon: '🍽️'
        },
        {
          id: '3',
          type: 'health',
          title: 'Health report uploaded',
          time: '1 day ago',
          icon: '🩺'
        }
      ] : [];

      return { weeklyActivity, hasActivity, recentActivities };
    };

    // Simulate loading for activity data
    setTimeout(() => {
      const activityData = generateMockActivityData();
      
      setDashboardData(prev => ({
        ...prev,
        ...activityData,
        // Use real health data from the hook
        healthReports: healthAnalysis.recentReports,
        lastCheckup: healthAnalysis.lastCheckup,
        healthStatus: healthAnalysis.healthStatus,
        upcomingReminders: healthAnalysis.upcomingReminders
      }));
      setLoading(false);
    }, 500);

  }, [selectedPet, healthAnalysis]);

  return { dashboardData, loading: loading || healthLoading };
};
