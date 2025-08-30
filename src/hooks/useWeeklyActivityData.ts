
import { useState, useEffect } from 'react';
import { usePetContext } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, subWeeks, eachDayOfInterval } from 'date-fns';

interface DayActivity {
  day: string;
  walks: number;
  totalMinutes: number;
}

interface WeeklyActivityData {
  currentWeek: DayActivity[];
  percentageChange: number;
  loading: boolean;
}

export const useWeeklyActivityData = (): WeeklyActivityData => {
  const { selectedPet } = usePetContext();
  const [data, setData] = useState<WeeklyActivityData>({
    currentWeek: [],
    percentageChange: 0,
    loading: true
  });

  useEffect(() => {
    if (!selectedPet) {
      setData({
        currentWeek: [],
        percentageChange: 0,
        loading: false
      });
      return;
    }

    fetchWeeklyActivityData();
  }, [selectedPet]);

  const fetchWeeklyActivityData = async () => {
    if (!selectedPet) return;

    try {
      setData(prev => ({ ...prev, loading: true }));
      
      const now = new Date();
      
      // Current week (Monday to Sunday)
      const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
      const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
      
      // Previous week
      const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

      console.log('🗓️ Fetching weekly activity data:', {
        petId: selectedPet.id,
        currentWeek: `${currentWeekStart.toISOString()} to ${currentWeekEnd.toISOString()}`,
        previousWeek: `${previousWeekStart.toISOString()} to ${previousWeekEnd.toISOString()}`
      });

      // Fetch current week walks
      const { data: currentWeekWalks, error: currentError } = await supabase
        .from('walks')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .gte('start_time', currentWeekStart.toISOString())
        .lte('start_time', currentWeekEnd.toISOString());

      // Fetch previous week walks
      const { data: previousWeekWalks, error: previousError } = await supabase
        .from('walks')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .gte('start_time', previousWeekStart.toISOString())
        .lte('start_time', previousWeekEnd.toISOString());

      if (currentError) {
        console.error('❌ Error fetching current week walks:', currentError);
        throw currentError;
      }

      if (previousError) {
        console.error('❌ Error fetching previous week walks:', previousError);
        throw previousError;
      }

      console.log('📊 Walk data fetched:', {
        currentWeekWalks: currentWeekWalks?.length || 0,
        previousWeekWalks: previousWeekWalks?.length || 0
      });

      // Generate all days of the current week
      const weekDays = eachDayOfInterval({
        start: currentWeekStart,
        end: currentWeekEnd
      });

      // Process current week data
      const currentWeekData: DayActivity[] = weekDays.map(day => {
        const dayName = format(day, 'EEE'); // Mon, Tue, Wed, etc.
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        // Find walks for this day
        const dayWalks = currentWeekWalks?.filter(walk => {
          const walkDate = new Date(walk.start_time);
          return walkDate >= dayStart && walkDate <= dayEnd;
        }) || [];

        // Calculate total minutes for the day - use actual duration_minutes if available
        const totalMinutes = dayWalks.reduce((sum, walk) => {
          // Use the actual duration_minutes from the database if it exists, otherwise default to 30
          const walkDuration = walk.duration_minutes || 30;
          return sum + walkDuration;
        }, 0);

        console.log(`📅 ${dayName} activity:`, {
          walks: dayWalks.length,
          totalMinutes,
          walkDetails: dayWalks.map(w => ({ 
            id: w.id, 
            duration: w.duration_minutes || 30,
            startTime: w.start_time 
          }))
        });

        return {
          day: dayName,
          walks: dayWalks.length,
          totalMinutes
        };
      });

      // Calculate percentage change based on total minutes
      const currentWeekTotal = currentWeekData.reduce((sum, day) => sum + day.totalMinutes, 0);
      const previousWeekTotal = (previousWeekWalks || []).reduce((sum, walk) => {
        return sum + (walk.duration_minutes || 30);
      }, 0);

      let percentageChange = 0;
      if (previousWeekTotal > 0) {
        percentageChange = Math.round(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100);
      } else if (currentWeekTotal > 0) {
        percentageChange = 100; // First week with activity
      }

      console.log('📈 Activity comparison:', {
        currentWeekTotal: `${currentWeekTotal} minutes`,
        previousWeekTotal: `${previousWeekTotal} minutes`,
        percentageChange: `${percentageChange}%`
      });

      setData({
        currentWeek: currentWeekData,
        percentageChange,
        loading: false
      });

    } catch (error) {
      console.error('❌ Error fetching weekly activity data:', error);
      setData({
        currentWeek: [],
        percentageChange: 0,
        loading: false
      });
    }
  };

  return data;
};
