
// Basic input validation and sanitization functions only
// All security logging and rate limiting removed for MVP

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic phone number validation
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Simplified logging function that doesn't depend on database
export const logSecurityEvent = async (event: {
  event_type: string;
  event_data?: any;
  severity?: string;
  ip_address?: string;
  user_agent?: string;
}) => {
  // Just log to console for now - no database dependency
  console.log('Security Event:', event);
};

// Simple rate limiting without database
export const checkOTPRateLimit = async (phone: string) => {
  // Always allow for MVP - no database dependency
  return {
    allowed: true,
    attempts_remaining: 5,
    retry_after: null,
    reason: null
  };
};
