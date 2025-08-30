
import { useState, useEffect } from 'react';
import { usePetContext } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

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

export const useSmartActivityData = () => {
  const { selectedPet } = usePetContext();
  const [todayActivities, setTodayActivities] = useState<ActivityItem[]>([]);
  const [weekActivities, setWeekActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWeekly, setShowWeekly] = useState(false);

  useEffect(() => {
    if (!selectedPet) {
      setLoading(false);
      return;
    }

    fetchActivities();
  }, [selectedPet]);

  const fetchActivities = async () => {
    if (!selectedPet) return;

    try {
      setLoading(true);
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

      // Fetch today's activities
      const [walks, symptoms, healthReports, prescriptions] = await Promise.all([
        // Walks
        supabase
          .from('walks')
          .select('*')
          .eq('pet_id', selectedPet.id)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false }),

        // Symptom reports
        supabase
          .from('symptom_reports')
          .select('*')
          .eq('pet_id', selectedPet.id)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false }),

        // Health reports
        supabase
          .from('health_reports')
          .select('*')
          .eq('pet_id', selectedPet.id)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false }),

        // Prescriptions
        supabase
          .from('prescriptions')
          .select('*')
          .eq('pet_id', selectedPet.id)
          .gte('created_at', todayStart.toISOString())
          .lte('created_at', todayEnd.toISOString())
          .order('created_at', { ascending: false })
      ]);

      // Transform today's data
      const todayItems: ActivityItem[] = [];

      // Add walks
      walks.data?.forEach(walk => {
        todayItems.push({
          id: `walk-${walk.id}`,
          type: 'walk',
          title: walk.duration_minutes 
            ? `${walk.duration_minutes} min walk completed`
            : 'Walk logged',
          time: format(new Date(walk.created_at), 'h:mm a'),
          status: 'Completed',
          icon: '🚶‍♂️',
          color: 'bg-blue-100',
          iconColor: 'text-blue-600',
          route: '/activity',
          timestamp: new Date(walk.created_at)
        });
      });

      // Add symptom reports
      symptoms.data?.forEach(symptom => {
        todayItems.push({
          id: `symptom-${symptom.id}`,
          type: 'symptom',
          title: symptom.symptoms?.length 
            ? `Symptoms reported: ${symptom.symptoms.slice(0, 2).join(', ')}${symptom.symptoms.length > 2 ? '...' : ''}`
            : 'Symptoms reported',
          time: format(new Date(symptom.created_at), 'h:mm a'),
          status: symptom.ai_response ? 'Analyzed' : 'Processing',
          icon: '🩺',
          color: 'bg-red-100',
          iconColor: 'text-red-600',
          route: '/assistant',
          timestamp: new Date(symptom.created_at)
        });
      });

      // Add health reports
      healthReports.data?.forEach(report => {
        todayItems.push({
          id: `health-${report.id}`,
          type: 'health_report',
          title: report.title || `${report.report_type} report uploaded`,
          time: format(new Date(report.created_at), 'h:mm a'),
          status: report.status === 'completed' ? 'Analyzed' : 'Processing',
          icon: '📋',
          color: 'bg-green-100',
          iconColor: 'text-green-600',
          route: '/health-reports',
          timestamp: new Date(report.created_at)
        });
      });

      // Add prescriptions
      prescriptions.data?.forEach(prescription => {
        todayItems.push({
          id: `prescription-${prescription.id}`,
          type: 'medication',
          title: prescription.title || 'Prescription added',
          time: format(new Date(prescription.created_at), 'h:mm a'),
          status: 'Active',
          icon: '💊',
          color: 'bg-purple-100',
          iconColor: 'text-purple-600',
          route: '/report-symptoms',
          timestamp: new Date(prescription.created_at)
        });
      });

      // Sort by timestamp
      todayItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setTodayActivities(todayItems);

      // If no today activities, fetch week's activities
      if (todayItems.length === 0) {
        const [weekWalks, weekSymptoms, weekHealthReports, weekPrescriptions] = await Promise.all([
          supabase
            .from('walks')
            .select('*')
            .eq('pet_id', selectedPet.id)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('symptom_reports')
            .select('*')
            .eq('pet_id', selectedPet.id)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('health_reports')
            .select('*')
            .eq('pet_id', selectedPet.id)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString())
            .order('created_at', { ascending: false })
            .limit(5),

          supabase
            .from('prescriptions')
            .select('*')
            .eq('pet_id', selectedPet.id)
            .gte('created_at', weekStart.toISOString())
            .lte('created_at', weekEnd.toISOString())
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        const weekItems: ActivityItem[] = [];

        // Process week data similar to today's data
        weekWalks.data?.forEach(walk => {
          weekItems.push({
            id: `walk-${walk.id}`,
            type: 'walk',
            title: walk.duration_minutes 
              ? `${walk.duration_minutes} min walk`
              : 'Walk logged',
            time: format(new Date(walk.created_at), 'MMM dd'),
            status: 'Completed',
            icon: '🚶‍♂️',
            color: 'bg-blue-100',
            iconColor: 'text-blue-600',
            route: '/activity',
            timestamp: new Date(walk.created_at)
          });
        });

        weekSymptoms.data?.forEach(symptom => {
          weekItems.push({
            id: `symptom-${symptom.id}`,
            type: 'symptom',
            title: 'Symptoms reported',
            time: format(new Date(symptom.created_at), 'MMM dd'),
            status: symptom.ai_response ? 'Analyzed' : 'Processing',
            icon: '🩺',
            color: 'bg-red-100',
            iconColor: 'text-red-600',
            route: '/assistant',
            timestamp: new Date(symptom.created_at)
          });
        });

        weekHealthReports.data?.forEach(report => {
          weekItems.push({
            id: `health-${report.id}`,
            type: 'health_report',
            title: report.title || `${report.report_type} report`,
            time: format(new Date(report.created_at), 'MMM dd'),
            status: report.status === 'completed' ? 'Analyzed' : 'Processing',
            icon: '📋',
            color: 'bg-green-100',
            iconColor: 'text-green-600',
            route: '/health-reports',
            timestamp: new Date(report.created_at)
          });
        });

        weekPrescriptions.data?.forEach(prescription => {
          weekItems.push({
            id: `prescription-${prescription.id}`,
            type: 'medication',
            title: prescription.title || 'Prescription',
            time: format(new Date(prescription.created_at), 'MMM dd'),
            status: 'Active',
            icon: '💊',
            color: 'bg-purple-100',
            iconColor: 'text-purple-600',
            route: '/report-symptoms',
            timestamp: new Date(prescription.created_at)
          });
        });

        weekItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setWeekActivities(weekItems.slice(0, 4));
        setShowWeekly(true);
      } else {
        setShowWeekly(false);
      }

    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    activities: showWeekly ? weekActivities : todayActivities,
    loading,
    showWeekly,
    refresh: fetchActivities
  };
};
