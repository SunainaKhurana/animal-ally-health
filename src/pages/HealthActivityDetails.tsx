import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Pill, FileText, Activity, Stethoscope } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePetContext } from '@/contexts/PetContext';
import { supabase } from '@/integrations/supabase/client';
import PetLoader from '@/components/ui/PetLoader';

interface HealthActivity {
  id: string;
  type: 'medication' | 'symptom' | 'walk' | 'report';
  title: string;
  details: string;
  date: string;
  time: string;
  timestamp: Date;
  icon: string;
  color: string;
}

const HealthActivityDetails = () => {
  const navigate = useNavigate();
  const { selectedPet } = usePetContext();
  const [activities, setActivities] = useState<HealthActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (selectedPet) {
      fetchHealthActivities();
    }
  }, [selectedPet, timeframe]);

  const fetchHealthActivities = async () => {
    if (!selectedPet) return;

    setLoading(true);
    try {
      const now = new Date();
      const daysBack = timeframe === 'week' ? 7 : 30;
      // Set start date to beginning of the day to include all activities from that day
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);

      const activities: HealthActivity[] = [];

      // Fetch walks
      const { data: walks } = await supabase
        .from('walks')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: false });

      if (walks) {
        walks.forEach(walk => {
          const timestamp = new Date(walk.start_time);
          const duration = walk.duration_minutes || 0;
          activities.push({
            id: `walk-${walk.id}`,
            type: 'walk',
            title: 'Walk Completed',
            details: `Duration: ${duration} minutes${walk.distance_meters ? ` • Distance: ${Math.round(walk.distance_meters)}m` : ''}`,
            date: timestamp.toLocaleDateString(),
            time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp,
            icon: '🚶‍♂️',
            color: 'bg-green-100 text-green-700'
          });
        });
      }

      // Fetch symptom reports
      const { data: symptoms } = await supabase
        .from('symptom_reports')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (symptoms) {
        symptoms.forEach(symptom => {
          const timestamp = new Date(symptom.created_at);
          const symptomsList = symptom.symptoms?.join(', ') || 'Health log entry';
          activities.push({
            id: `symptom-${symptom.id}`,
            type: 'symptom',
            title: 'Symptom Reported',
            details: `Symptoms: ${symptomsList}${symptom.severity_level ? ` • Severity: ${symptom.severity_level}` : ''}`,
            date: timestamp.toLocaleDateString(),
            time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp,
            icon: '🩺',
            color: 'bg-red-100 text-red-700'
          });
        });
      }

      // Fetch health reports
      const { data: reports } = await supabase
        .from('health_reports')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (reports) {
        reports.forEach(report => {
          const timestamp = new Date(report.created_at);
          activities.push({
            id: `report-${report.id}`,
            type: 'report',
            title: 'Health Report Scanned',
            details: `Report: ${report.title}${report.report_type ? ` • Type: ${report.report_type}` : ''}`,
            date: timestamp.toLocaleDateString(),
            time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp,
            icon: '📋',
            color: 'bg-blue-100 text-blue-700'
          });
        });
      }

      // Fetch medication logs
      const { data: medications } = await supabase
        .from('medication_logs')
        .select('*')
        .gte('given_at', startDate.toISOString())
        .order('given_at', { ascending: false });

      if (medications) {
        medications.forEach(med => {
          const timestamp = new Date(med.given_at);
          activities.push({
            id: `medication-${med.id}`,
            type: 'medication',
            title: 'Medication Given',
            details: `Medicine: ${med.medication_name}${med.notes ? ` • ${med.notes}` : ''}`,
            date: timestamp.toLocaleDateString(),
            time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp,
            icon: '💊',
            color: 'bg-purple-100 text-purple-700'
          });
        });
      }

      // Sort all activities by timestamp (newest first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(activities);
    } catch (error) {
      console.error('Error fetching health activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medication': return <Pill className="h-5 w-5" />;
      case 'symptom': return <Stethoscope className="h-5 w-5" />;
      case 'walk': return <Activity className="h-5 w-5" />;
      case 'report': return <FileText className="h-5 w-5" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  if (!selectedPet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-gray-600">Please select a pet to view their health activities.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <PetLoader type="chasing" size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">
              {selectedPet.name}'s Health Activity
            </h1>
            <p className="text-sm text-white/80">
              {timeframe === 'week' ? 'This Week' : 'This Month'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Timeframe Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={timeframe === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('week')}
                className="flex-1"
              >
                This Week
              </Button>
              <Button
                variant={timeframe === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('month')}
                className="flex-1"
              >
                This Month
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center`}>
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {activity.details}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {activity.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </span>
                      </div>
                    </div>
                    <div className={`p-2 rounded-full ${activity.color}`}>
                      {getTypeIcon(activity.type)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Health Activities Yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start tracking your pet's health by logging activities, medications, or uploading reports.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/care')} className="w-full">
                  Add Medication or Report
                </Button>
                <Button onClick={() => navigate('/activity')} variant="outline" className="w-full">
                  Log Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HealthActivityDetails;