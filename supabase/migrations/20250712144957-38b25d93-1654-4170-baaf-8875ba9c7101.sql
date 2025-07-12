
-- Add new columns to health_reports table for enhanced functionality
ALTER TABLE public.health_reports 
ADD COLUMN IF NOT EXISTS report_label TEXT,
ADD COLUMN IF NOT EXISTS vet_diagnosis TEXT,
ADD COLUMN IF NOT EXISTS parent_report_id UUID REFERENCES public.health_reports(id);

-- Create index for efficient querying of related reports
CREATE INDEX IF NOT EXISTS idx_health_reports_parent_id ON public.health_reports(parent_report_id);
CREATE INDEX IF NOT EXISTS idx_health_reports_pet_date ON public.health_reports(pet_id, actual_report_date DESC);

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE TRIGGER update_health_reports_updated_at
    BEFORE UPDATE ON public.health_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
