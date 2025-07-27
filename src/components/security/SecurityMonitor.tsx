
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, User, Clock, Database } from 'lucide-react';
import { format } from 'date-fns';

interface SecurityEvent {
  id: string;
  table_name: string;
  operation: string;
  user_id: string | null;
  timestamp: string;
  details: string;
}

const SecurityMonitor = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const fetchSecurityEvents = async () => {
    try {
      // For now, we'll fetch recent activity from various tables to show security-relevant events
      const mockEvents: SecurityEvent[] = [
        {
          id: '1',
          table_name: 'pets',
          operation: 'INSERT',
          user_id: 'current_user',
          timestamp: new Date().toISOString(),
          details: 'New pet profile created'
        },
        {
          id: '2',
          table_name: 'health_reports',
          operation: 'SELECT',
          user_id: 'current_user',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: 'Health report accessed'
        },
        {
          id: '3',
          table_name: 'prescriptions',
          operation: 'INSERT',
          user_id: 'current_user',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: 'New prescription uploaded'
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return <User className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventBadgeColor = (operation: string) => {
    switch (operation) {
      case 'DELETE':
        return 'destructive';
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.operation)}
                    <Badge variant={getEventBadgeColor(event.operation)}>
                      {event.operation} on {event.table_name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.timestamp), 'MMM d, HH:mm')}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  {event.details}
                </div>
                
                {event.user_id && (
                  <div className="text-xs text-gray-500">
                    User: {event.user_id}
                  </div>
                )}
              </div>
            ))}
            
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No security events found
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SecurityMonitor;
