
-- Enable real-time for health_reports table
ALTER TABLE health_reports REPLICA IDENTITY FULL;

-- Add health_reports table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE health_reports;
