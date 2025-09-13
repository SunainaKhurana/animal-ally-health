-- Add date_of_birth column to pets table
ALTER TABLE public.pets 
ADD COLUMN date_of_birth DATE;

-- Update existing pets with calculated date_of_birth based on age_years and age_months if they exist
UPDATE public.pets 
SET date_of_birth = (
  CURRENT_DATE - 
  INTERVAL '1 year' * COALESCE(age_years, 0) - 
  INTERVAL '1 month' * COALESCE(age_months, 0)
)
WHERE date_of_birth IS NULL 
  AND (age_years IS NOT NULL OR age_months IS NOT NULL);