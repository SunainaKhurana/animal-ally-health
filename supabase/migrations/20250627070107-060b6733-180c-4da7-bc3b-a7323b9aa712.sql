
-- Allow null values in the symptoms column to distinguish general questions from symptom reports
ALTER TABLE public.symptom_reports ALTER COLUMN symptoms DROP NOT NULL;
