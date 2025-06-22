
-- Add prescription tracking table
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  prescribed_date date NOT NULL,
  image_url text,
  extracted_text text,
  ai_analysis text,
  medications jsonb, -- Array of medication objects with dosage, frequency, duration
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'discontinued')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add medication tracking table
CREATE TABLE public.medication_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  given_at timestamp with time zone NOT NULL,
  given_by uuid NOT NULL, -- user who gave the medication
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add walk tracking table
CREATE TABLE public.walks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  duration_minutes integer,
  distance_meters numeric,
  route_data jsonb, -- GPS coordinates for map view
  notes text,
  weather text,
  created_at timestamp with time zone DEFAULT now()
);

-- Add pet conditions table
CREATE TABLE public.pet_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  condition_name text NOT NULL,
  diagnosed_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'managed')),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add pet parents table for multi-parent support
CREATE TABLE public.pet_parents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text DEFAULT 'parent' CHECK (role IN ('owner', 'parent', 'caregiver')),
  permissions jsonb DEFAULT '{"read": true, "write": true, "admin": false}'::jsonb,
  added_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add spayed/neutered and other medical info to pets table
ALTER TABLE public.pets 
ADD COLUMN is_spayed_neutered boolean DEFAULT false,
ADD COLUMN microchip_id text,
ADD COLUMN special_conditions text[],
ADD COLUMN food_allergies text[],
ADD COLUMN current_diet text;

-- Enable RLS on new tables
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_parents ENABLE ROW LEVEL SECURITY;

-- RLS policies for prescriptions
CREATE POLICY "Users can view prescriptions for their pets" ON public.prescriptions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = prescriptions.pet_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create prescriptions for their pets" ON public.prescriptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = pets.id AND user_id = auth.uid())))
  );

-- RLS policies for medication logs
CREATE POLICY "Users can view medication logs for their pets" ON public.medication_logs
  FOR SELECT USING (
    given_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.prescriptions p WHERE p.id = prescription_id AND (p.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pet_parents pp WHERE pp.pet_id = p.pet_id AND pp.user_id = auth.uid())))
  );

CREATE POLICY "Users can create medication logs" ON public.medication_logs
  FOR INSERT WITH CHECK (given_by = auth.uid());

-- RLS policies for walks
CREATE POLICY "Users can view walks for their pets" ON public.walks
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = walks.pet_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create walks for their pets" ON public.walks
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = pets.id AND user_id = auth.uid())))
  );

-- RLS policies for pet conditions
CREATE POLICY "Users can view conditions for their pets" ON public.pet_conditions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = pets.id AND user_id = auth.uid())))
  );

CREATE POLICY "Users can manage conditions for their pets" ON public.pet_conditions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.pet_parents WHERE pet_id = pets.id AND user_id = auth.uid())))
  );

-- RLS policies for pet parents
CREATE POLICY "Users can view pet parent relationships" ON public.pet_parents
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND user_id = auth.uid())
  );

CREATE POLICY "Pet owners can manage parent relationships" ON public.pet_parents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND user_id = auth.uid())
  );

-- Update health_reports table to use actual report date from OCR
ALTER TABLE public.health_reports 
ADD COLUMN actual_report_date date;

-- Create indexes for better performance
CREATE INDEX idx_prescriptions_pet_id ON public.prescriptions(pet_id);
CREATE INDEX idx_medication_logs_prescription_id ON public.medication_logs(prescription_id);
CREATE INDEX idx_walks_pet_id ON public.walks(pet_id);
CREATE INDEX idx_pet_conditions_pet_id ON public.pet_conditions(pet_id);
CREATE INDEX idx_pet_parents_pet_id ON public.pet_parents(pet_id);
CREATE INDEX idx_pet_parents_user_id ON public.pet_parents(user_id);
