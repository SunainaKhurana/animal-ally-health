
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  event_type: string;
  event_data?: any;
  ip_address?: string;
  user_agent?: string;
}

export const checkOTPRateLimit = async (phoneNumber: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('check_otp_rate_limit', {
      phone: phoneNumber
    });

    if (error) {
      console.error('Rate limit check error:', error);
      return false;
    }

    return data as boolean;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false;
  }
};

export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.rpc('log_security_event', {
      p_user_id: user?.id || null,
      p_event_type: event.event_type,
      p_event_data: event.event_data ? JSON.stringify(event.event_data) : null,
      p_ip_address: event.ip_address || null,
      p_user_agent: event.user_agent || navigator.userAgent
    });

    if (error) {
      console.error('Security logging error:', error);
    }
  } catch (error) {
    console.error('Security logging failed:', error);
  }
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .trim();
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
