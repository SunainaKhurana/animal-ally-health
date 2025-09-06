-- Enable realtime for health_reports table
ALTER TABLE public.health_reports REPLICA IDENTITY FULL;

-- Add table to realtime publication if not already added
DO $$
BEGIN
    -- Check if the table is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'health_reports'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.health_reports;
    END IF;
END $$;