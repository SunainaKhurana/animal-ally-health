-- Create prescriptions storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', true);

-- Create policies for prescription uploads
CREATE POLICY "Users can view their own prescriptions" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own prescriptions" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own prescriptions" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prescriptions" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);