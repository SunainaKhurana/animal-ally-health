
-- COMPREHENSIVE SECURITY FIX MIGRATION
-- This migration addresses all critical security vulnerabilities

-- Phase 1: Remove dangerous policies and enable proper RLS

-- Remove the dangerous "Allow open read" policy from pets table
DROP POLICY IF EXISTS "Allow open read" ON public.pets;

-- Enable RLS on tables that don't have it
ALTER TABLE public.disease_knowledge ENABLE ROW LEVEL SECURITY;

-- Create proper RLS policy for disease_knowledge (authenticated users only)
CREATE POLICY "Authenticated users can view disease knowledge" 
ON public.disease_knowledge 
FOR SELECT 
TO authenticated 
USING (true);

-- Phase 2: Create missing security infrastructure tables

-- Create OTP rate limiting table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_otp_rate_limits_phone ON public.otp_rate_limits(phone_number);

-- Enable RLS on otp_rate_limits
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for otp_rate_limits (service role only)
CREATE POLICY "Service role can manage OTP rate limits" 
ON public.otp_rate_limits 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create security logs table
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type TEXT NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for security_logs (users can only view their own logs)
CREATE POLICY "Users can view their own security logs" 
ON public.security_logs 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Service role can insert security logs
CREATE POLICY "Service role can insert security logs" 
ON public.security_logs 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Phase 3: Create server-side OTP rate limiting functions

-- Function to check OTP rate limit
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(phone_number_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    rate_limit_record RECORD;
    max_attempts INTEGER := 5;
    window_minutes INTEGER := 60;
    block_minutes INTEGER := 15;
    result JSONB;
BEGIN
    -- Get or create rate limit record
    SELECT * INTO rate_limit_record 
    FROM public.otp_rate_limits 
    WHERE phone_number = phone_number_param;
    
    -- If no record exists, create one
    IF rate_limit_record IS NULL THEN
        INSERT INTO public.otp_rate_limits (phone_number) 
        VALUES (phone_number_param)
        RETURNING * INTO rate_limit_record;
    END IF;
    
    -- Check if currently blocked
    IF rate_limit_record.blocked_until IS NOT NULL AND rate_limit_record.blocked_until > NOW() THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'rate_limited',
            'retry_after', rate_limit_record.blocked_until
        );
    END IF;
    
    -- Check if we're within the time window
    IF rate_limit_record.first_attempt_at > NOW() - INTERVAL '1 hour' * window_minutes / 60 THEN
        -- Within window, check attempt count
        IF rate_limit_record.attempts >= max_attempts THEN
            -- Block the phone number
            UPDATE public.otp_rate_limits 
            SET blocked_until = NOW() + INTERVAL '1 minute' * block_minutes,
                updated_at = NOW()
            WHERE phone_number = phone_number_param;
            
            RETURN jsonb_build_object(
                'allowed', false,
                'reason', 'rate_limited',
                'retry_after', NOW() + INTERVAL '1 minute' * block_minutes
            );
        ELSE
            -- Increment attempts
            UPDATE public.otp_rate_limits 
            SET attempts = attempts + 1,
                last_attempt_at = NOW(),
                updated_at = NOW()
            WHERE phone_number = phone_number_param;
        END IF;
    ELSE
        -- Outside window, reset
        UPDATE public.otp_rate_limits 
        SET attempts = 1,
            first_attempt_at = NOW(),
            last_attempt_at = NOW(),
            blocked_until = NULL,
            updated_at = NOW()
        WHERE phone_number = phone_number_param;
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', true,
        'attempts_remaining', max_attempts - COALESCE(rate_limit_record.attempts, 0)
    );
END;
$$;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    user_id_param UUID,
    event_type_param TEXT,
    event_data_param JSONB DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    severity_param TEXT DEFAULT 'info'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.security_logs (
        user_id,
        event_type,
        event_data,
        ip_address,
        user_agent,
        severity
    ) VALUES (
        user_id_param,
        event_type_param,
        event_data_param,
        ip_address_param,
        user_agent_param,
        severity_param
    );
END;
$$;

-- Phase 4: Fix existing function search paths

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Phase 5: Create pet_condition_summary table if it doesn't exist properly
CREATE TABLE IF NOT EXISTS public.pet_condition_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id UUID NOT NULL,
    pet_name TEXT,
    condition_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on pet_condition_summary
ALTER TABLE public.pet_condition_summary ENABLE ROW LEVEL SECURITY;

-- Create policy for pet_condition_summary
CREATE POLICY "Users can view condition summaries for their pets" 
ON public.pet_condition_summary 
FOR SELECT 
TO authenticated 
USING (EXISTS (
    SELECT 1 FROM public.pets 
    WHERE pets.id = pet_condition_summary.pet_id 
    AND pets.user_id = auth.uid()
));

-- Phase 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON public.security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_otp_rate_limits_phone ON public.otp_rate_limits(phone_number);

-- Phase 7: Create updated_at triggers
CREATE TRIGGER update_otp_rate_limits_updated_at
    BEFORE UPDATE ON public.otp_rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_condition_summary_updated_at
    BEFORE UPDATE ON public.pet_condition_summary
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
