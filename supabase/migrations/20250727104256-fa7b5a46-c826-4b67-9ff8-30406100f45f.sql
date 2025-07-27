
-- Phase 1: Critical RLS Policy Fixes

-- First, let's fix the overly permissive policies on the pets table
DROP POLICY IF EXISTS "Allow open read" ON public.pets;

-- Update pets table policies to require authentication
CREATE POLICY "Users can view their own pets" ON public.pets
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pets" ON public.pets
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets" ON public.pets
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets" ON public.pets
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on disease_knowledge table (currently disabled)
ALTER TABLE public.disease_knowledge ENABLE ROW LEVEL SECURITY;

-- Create policy for disease_knowledge to allow read access to authenticated users
CREATE POLICY "Authenticated users can read disease knowledge" ON public.disease_knowledge
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Enable RLS on pet_condition_summary table (currently disabled)
ALTER TABLE public.pet_condition_summary ENABLE ROW LEVEL SECURITY;

-- Create policy for pet_condition_summary to allow users to see their own pet conditions
CREATE POLICY "Users can view their own pet condition summaries" ON public.pet_condition_summary
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.pets 
  WHERE pets.id = pet_condition_summary.pet_id 
  AND pets.user_id = auth.uid()
));

-- Fix the update_updated_at_column function to use proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Add triggers for updated_at columns where missing
CREATE TRIGGER update_pets_updated_at 
  BEFORE UPDATE ON public.pets 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at 
  BEFORE UPDATE ON public.prescriptions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_reports_updated_at 
  BEFORE UPDATE ON public.health_reports 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pet_conditions_updated_at 
  BEFORE UPDATE ON public.pet_conditions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add rate limiting table for OTP requests
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on otp_rate_limits
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for otp_rate_limits (only the system should manage this)
CREATE POLICY "System can manage OTP rate limits" ON public.otp_rate_limits
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to check OTP rate limits
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(phone TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_attempts INTEGER;
  last_attempt_time TIMESTAMP WITH TIME ZONE;
  blocked_until_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Clean up old records (older than 1 hour)
  DELETE FROM public.otp_rate_limits 
  WHERE last_attempt < NOW() - INTERVAL '1 hour';
  
  -- Check current rate limit status
  SELECT attempts, last_attempt, blocked_until 
  INTO current_attempts, last_attempt_time, blocked_until_time
  FROM public.otp_rate_limits 
  WHERE phone_number = phone;
  
  -- If blocked, check if block has expired
  IF blocked_until_time IS NOT NULL AND blocked_until_time > NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- If no record exists or block has expired, allow request
  IF current_attempts IS NULL OR blocked_until_time IS NOT NULL AND blocked_until_time <= NOW() THEN
    INSERT INTO public.otp_rate_limits (phone_number) 
    VALUES (phone)
    ON CONFLICT (phone_number) DO UPDATE SET
      attempts = 1,
      last_attempt = NOW(),
      blocked_until = NULL;
    RETURN TRUE;
  END IF;
  
  -- If less than 5 attempts in the last hour, increment and allow
  IF current_attempts < 5 THEN
    UPDATE public.otp_rate_limits 
    SET attempts = attempts + 1, last_attempt = NOW()
    WHERE phone_number = phone;
    RETURN TRUE;
  END IF;
  
  -- If 5 or more attempts, block for 1 hour
  UPDATE public.otp_rate_limits 
  SET blocked_until = NOW() + INTERVAL '1 hour'
  WHERE phone_number = phone;
  
  RETURN FALSE;
END;
$$;

-- Add unique constraint to prevent duplicate phone numbers
ALTER TABLE public.otp_rate_limits 
ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);

-- Create function to log security events
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for security_logs (only system and admins should access)
CREATE POLICY "System can manage security logs" ON public.security_logs
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.security_logs (user_id, event_type, event_data, ip_address, user_agent)
  VALUES (p_user_id, p_event_type, p_event_data, p_ip_address, p_user_agent);
END;
$$;
