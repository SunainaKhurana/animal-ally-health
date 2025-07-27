
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  event_type: string;
  event_data?: any;
  ip_address?: string;
  user_agent?: string;
}

export const checkOTPRateLimit = async (phoneNumber: string): Promise<boolean> => {
  try {
    // For now, implement a basic client-side rate limiting
    const rateLimitKey = `otp_rate_limit_${phoneNumber}`;
    const stored = localStorage.getItem(rateLimitKey);
    
    if (stored) {
      const { count, timestamp } = JSON.parse(stored);
      const hourAgo = Date.now() - (60 * 60 * 1000);
      
      if (timestamp > hourAgo) {
        if (count >= 5) {
          return false; // Rate limit exceeded
        }
        localStorage.setItem(rateLimitKey, JSON.stringify({ count: count + 1, timestamp: Date.now() }));
      } else {
        localStorage.setItem(rateLimitKey, JSON.stringify({ count: 1, timestamp: Date.now() }));
      }
    } else {
      localStorage.setItem(rateLimitKey, JSON.stringify({ count: 1, timestamp: Date.now() }));
    }
    
    return true;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow on error to not block legitimate users
  }
};

export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // For now, just log to console until we have proper database support
    console.log('Security Event:', {
      user_id: user?.id || null,
      event_type: event.event_type,
      event_data: event.event_data,
      ip_address: event.ip_address,
      user_agent: event.user_agent || navigator.userAgent,
      timestamp: new Date().toISOString()
    });
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
