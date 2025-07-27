
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  event_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const SecurityMonitor = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const fetchSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching security events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('failed') || eventType.includes('exceeded')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (eventType.includes('signin') || eventType.includes('signup')) {
      return <User className="h-4 w-4 text-green-500" />;
    }
    return <Shield className="h-4 w-4 text-blue-500" />;
  };

  const getEventBadgeColor = (eventType: string) => {
    if (eventType.includes('failed') || eventType.includes('exceeded')) {
      return 'destructive';
    }
    if (eventType.includes('success')) {
      return 'default';
    }
    return 'secondary';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
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
          Security Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.event_type)}
                    <Badge variant={getEventBadgeColor(event.event_type)}>
                      {event.event_type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.created_at), 'MMM d, HH:mm')}
                  </div>
                </div>
                
                {event.event_data && (
                  <div className="text-sm text-gray-600">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(event.event_data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {event.ip_address && (
                  <div className="text-xs text-gray-500">
                    IP: {event.ip_address}
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
