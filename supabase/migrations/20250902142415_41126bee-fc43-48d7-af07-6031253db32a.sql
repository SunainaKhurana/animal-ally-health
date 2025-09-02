-- Enable real-time updates for symptom_reports table
ALTER TABLE public.symptom_reports REPLICA IDENTITY FULL;

-- Add symptom_reports to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.symptom_reports;