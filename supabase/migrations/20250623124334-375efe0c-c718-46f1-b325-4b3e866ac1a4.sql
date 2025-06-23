
-- Create symptom_reports table if it doesn't exist (updating existing structure)
CREATE TABLE IF NOT EXISTS public.symptom_reports (
  id bigserial PRIMARY KEY,
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  symptoms text[] NOT NULL,
  notes text,
  photo_url text,
  reported_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Create daily_checkins table
CREATE TABLE public.daily_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  energy_level text NOT NULL CHECK (energy_level IN ('low', 'normal', 'hyper')),
  hunger_level text NOT NULL CHECK (hunger_level IN ('not eating', 'normal', 'overeating')),
  thirst_level text NOT NULL CHECK (thirst_level IN ('less', 'normal', 'more')),
  stool_consistency text NOT NULL CHECK (stool_consistency IN ('normal', 'soft', 'diarrhea')),
  notes text,
  checkin_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on tables
ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS policies for symptom_reports
CREATE POLICY "Users can view symptom reports for their pets" ON public.symptom_reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = pets.id AND user_id = auth.uid())))
  );

CREATE POLICY "Users can create symptom reports for their pets" ON public.symptom_reports
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = pets.id AND user_id = auth.uid())))
  );

-- RLS policies for daily_checkins
CREATE POLICY "Users can view daily checkins for their pets" ON public.daily_checkins
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = daily_checkins.pet_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create daily checkins for their pets" ON public.daily_checkins
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = pets.id AND user_id = auth.uid())))
  );

-- Create storage bucket for symptom photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('symptom-photos', 'symptom-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for symptom photos
CREATE POLICY "Users can upload symptom photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'symptom-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view symptom photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'symptom-photos');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_symptom_reports_pet_id ON public.symptom_reports(pet_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_pet_id ON public.daily_checkins(pet_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON public.daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON public.daily_checkins(checkin_date);
