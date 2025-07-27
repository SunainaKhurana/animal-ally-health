
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield, User, Clock, Database, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type SecurityEvent = Database['public']['Tables']['security_logs']['Row'];

const SecurityMonitor = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch security logs from the security_logs table
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching security events:', error);
        setError(error.message);
        return;
      }

      console.log('Security events fetched:', data);
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching security events:', error);
      setError(error.message || 'Failed to fetch security events');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string, severity: string | null) => {
    if (severity === 'high' || severity === 'critical') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    
    if (eventType.includes('signin') || eventType.includes('signup')) {
      return <User className="h-4 w-4 text-green-500" />;
    }
    
    if (eventType.includes('otp') || eventType.includes('auth')) {
      return <Shield className="h-4 w-4 text-blue-500" />;
    }
    
    return <Database className="h-4 w-4 text-gray-500" />;
  };

  const getEventBadgeColor = (severity: string | null) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatEventDescription = (event: SecurityEvent) => {
    const eventType = event.event_type;
    const eventData = event.event_data as any;
    
    switch (eventType) {
      case 'otp_sent':
        return `OTP sent to phone number ending in ${eventData?.phone_number?.slice(-4)}`;
      case 'otp_verification_success':
        return `OTP verified successfully for user ${event.user_id}`;
      case 'otp_verification_failed':
        return `OTP verification failed: ${eventData?.error}`;
      case 'otp_rate_limit_exceeded':
        return `Rate limit exceeded for phone ${eventData?.phone_number?.slice(-4)}`;
      case 'email_signin_success':
        return `Email sign-in successful for ${eventData?.email}`;
      case 'email_signin_failed':
        return `Email sign-in failed: ${eventData?.error}`;
      case 'security_system_initialized':
        return 'Security monitoring system initialized';
      case 'suspicious_activity_detected':
        return `Suspicious activity: ${eventData?.failed_attempts} failed attempts`;
      default:
        return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Error loading security events</p>
            <p className="text-gray-600 text-sm mt-1">{error}</p>
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
          <Badge variant="outline" className="ml-auto">
            {events.length} events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.event_type, event.severity)}
                    <Badge variant={getEventBadgeColor(event.severity)}>
                      {(event.severity || 'low').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.timestamp || event.created_at || ''), 'MMM d, HH:mm')}
                  </div>
                </div>
                
                <div className="text-sm text-gray-800 font-medium">
                  {formatEventDescription(event)}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {event.user_id && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      User: {event.user_id.slice(0, 8)}...
                    </div>
                  )}
                  {event.ip_address && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      IP: {event.ip_address}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {events.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No security events found</p>
                <p className="text-sm mt-1">Security monitoring is active and will log events as they occur.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SecurityMonitor;
