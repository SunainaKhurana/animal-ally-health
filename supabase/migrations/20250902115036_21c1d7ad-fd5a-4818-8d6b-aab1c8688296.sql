
-- Add new columns to symptom_reports table for enhanced functionality
ALTER TABLE symptom_reports 
ADD COLUMN IF NOT EXISTS severity_level TEXT CHECK (severity_level IN ('mild', 'moderate', 'severe')),
ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_severity_analysis TEXT,
ADD COLUMN IF NOT EXISTS recurring_note TEXT;

-- Create index for better performance on queries
CREATE INDEX IF NOT EXISTS idx_symptom_reports_pet_severity ON symptom_reports(pet_id, severity_level);
CREATE INDEX IF NOT EXISTS idx_symptom_reports_pet_resolved ON symptom_reports(pet_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_symptom_reports_reported_on ON symptom_reports(reported_on DESC);

-- Add RLS policy for updates (so users can mark logs as resolved)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'symptom_reports' 
        AND policyname = 'Users can update symptom reports for their pets'
    ) THEN
        CREATE POLICY "Users can update symptom reports for their pets" 
        ON symptom_reports 
        FOR UPDATE 
        USING (EXISTS ( 
            SELECT 1 FROM pets 
            WHERE pets.id = symptom_reports.pet_id 
            AND (pets.user_id = auth.uid() OR EXISTS ( 
                SELECT 1 FROM pet_parents 
                WHERE pet_parents.pet_id = pets.id 
                AND pet_parents.user_id = auth.uid()
            ))
        ))
        WITH CHECK (EXISTS ( 
            SELECT 1 FROM pets 
            WHERE pets.id = symptom_reports.pet_id 
            AND (pets.user_id = auth.uid() OR EXISTS ( 
                SELECT 1 FROM pet_parents 
                WHERE pet_parents.pet_id = pets.id 
                AND pet_parents.user_id = auth.uid()
            ))
        ));
    END IF;
END $$;
