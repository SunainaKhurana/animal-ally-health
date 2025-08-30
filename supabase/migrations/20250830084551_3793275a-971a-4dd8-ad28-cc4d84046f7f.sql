
-- Add make.com policy to health_reports table (similar to symptom_reports)
CREATE POLICY "Allow updates from Make.com API key" 
ON public.health_reports
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Enable RLS on disease_knowledge table and add public read policy
ALTER TABLE public.disease_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to disease knowledge" 
ON public.disease_knowledge
FOR SELECT 
USING (true);

-- Enable RLS on pet_condition_summary table and add appropriate policies
ALTER TABLE public.pet_condition_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pet condition summaries for their pets" 
ON public.pet_condition_summary
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM pets 
    WHERE pets.id = pet_condition_summary.pet_id 
    AND (
      pets.user_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM pet_parents 
        WHERE pet_parents.pet_id = pets.id 
        AND pet_parents.user_id = auth.uid()
      )
    )
  )
);
