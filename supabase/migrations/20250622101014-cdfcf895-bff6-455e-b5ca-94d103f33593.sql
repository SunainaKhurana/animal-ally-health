
-- Add RLS policies for health_reports table
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own health reports
CREATE POLICY "Users can view their own health reports" 
  ON public.health_reports 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own health reports
CREATE POLICY "Users can create their own health reports" 
  ON public.health_reports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own health reports
CREATE POLICY "Users can update their own health reports" 
  ON public.health_reports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own health reports
CREATE POLICY "Users can delete their own health reports" 
  ON public.health_reports 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create storage bucket for health reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('health-reports', 'health-reports', true);

-- Create storage policies for health reports bucket
CREATE POLICY "Users can upload health reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view health reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update health reports" ON storage.objects
  FOR UPDATE USING (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete health reports" ON storage.objects
  FOR DELETE USING (bucket_id = 'health-reports' AND auth.uid()::text = (storage.foldername(name))[1]);
