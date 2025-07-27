
import { supabase } from '@/integrations/supabase/client';

export interface SecurityEvent {
  event_type: string;
  event_data?: any;
  ip_address?: string;
  user_agent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export const checkOTPRateLimit = async (phoneNumber: string): Promise<{ allowed: boolean; reason?: string; retry_after?: string; attempts_remaining?: number }> => {
  try {
    console.log('Checking OTP rate limit for phone:', phoneNumber);
    
    // Use the new server-side rate limiting function
    const { data, error } = await supabase.rpc('check_otp_rate_limit', {
      phone_number_param: phoneNumber
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fall back to client-side rate limiting if server-side fails
      return checkClientSideRateLimit(phoneNumber);
    }

    console.log('Server-side rate limit check result:', data);
    return data;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fall back to client-side rate limiting
    return checkClientSideRateLimit(phoneNumber);
  }
};

// Fallback client-side rate limiting for emergency cases
const checkClientSideRateLimit = (phoneNumber: string): { allowed: boolean; reason?: string; attempts_remaining?: number } => {
  try {
    const rateLimitKey = `otp_rate_limit_${phoneNumber}`;
    const stored = localStorage.getItem(rateLimitKey);
    
    if (stored) {
      const { count, timestamp } = JSON.parse(stored);
      const hourAgo = Date.now() - (60 * 60 * 1000);
      
      if (timestamp > hourAgo) {
        if (count >= 5) {
          return { allowed: false, reason: 'rate_limited' };
        }
        localStorage.setItem(rateLimitKey, JSON.stringify({ count: count + 1, timestamp: Date.now() }));
        return { allowed: true, attempts_remaining: 5 - count };
      } else {
        localStorage.setItem(rateLimitKey, JSON.stringify({ count: 1, timestamp: Date.now() }));
      }
    } else {
      localStorage.setItem(rateLimitKey, JSON.stringify({ count: 1, timestamp: Date.now() }));
    }
    
    return { allowed: true, attempts_remaining: 4 };
  } catch (error) {
    console.error('Client-side rate limit check failed:', error);
    return { allowed: true }; // Allow on error to not block legitimate users
  }
};

export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    console.log('Logging security event:', event);
    
    // Use the new server-side security logging function
    const { error } = await supabase.rpc('log_security_event', {
      user_id_param: user?.id || null,
      event_type_param: event.event_type,
      event_data_param: event.event_data ? JSON.stringify(event.event_data) : null,
      ip_address_param: event.ip_address || null,
      user_agent_param: event.user_agent || navigator.userAgent,
      severity_param: event.severity || 'low'
    });

    if (error) {
      console.error('Server-side security logging failed:', error);
      // Fall back to console logging
      console.log('Security Event (fallback):', {
        user_id: user?.id || null,
        event_type: event.event_type,
        event_data: event.event_data,
        ip_address: event.ip_address,
        user_agent: event.user_agent || navigator.userAgent,
        severity: event.severity || 'low',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Security logging failed:', error);
    // Fall back to console logging
    console.log('Security Event (error fallback):', {
      event_type: event.event_type,
      event_data: event.event_data,
      timestamp: new Date().toISOString(),
      error: error
    });
  }
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
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

// Enhanced security monitoring
export const monitorSecurityEvent = async (eventType: string, eventData?: any, severity: 'low' | 'medium' | 'high' | 'critical' = 'low') => {
  await logSecurityEvent({
    event_type: eventType,
    event_data: eventData,
    severity: severity
  });
};

// Security headers validation
export const validateSecurityHeaders = () => {
  const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!csp) {
    console.warn('Missing Content Security Policy header');
    monitorSecurityEvent('missing_csp_header', null, 'medium');
  }
};

// Initialize security monitoring
export const initSecurity = () => {
  console.log('Initializing security monitoring...');
  validateSecurityHeaders();
  
  // Monitor for suspicious activity
  let failedAttempts = 0;
  const maxFailedAttempts = 5;
  
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('auth') || event.reason?.message?.includes('unauthorized')) {
      failedAttempts++;
      if (failedAttempts >= maxFailedAttempts) {
        monitorSecurityEvent('suspicious_activity_detected', {
          failed_attempts: failedAttempts,
          reason: event.reason?.message
        }, 'high');
      }
    }
  });
  
  monitorSecurityEvent('security_system_initialized', null, 'low');
};
