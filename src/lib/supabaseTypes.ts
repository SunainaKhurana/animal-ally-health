
// Supabase Database Schema Types
// These types will be used once Supabase integration is set up

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  type: 'dog' | 'cat';
  breed?: string;
  gender: 'male' | 'female';
  age: number;
  weight: number;
  photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VaccinationRecord {
  id: string;
  pet_id: string;
  vaccine_name: string;
  administered_date: string;
  next_due_date?: string;
  veterinarian?: string;
  image_url?: string;
  extracted_data?: any;
  created_at: string;
  updated_at: string;
}

export interface HealthRecord {
  id: string;
  pet_id: string;
  record_type: 'vaccination' | 'checkup' | 'medication' | 'test';
  title: string;
  description?: string;
  date: string;
  image_url?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// Database Setup SQL (for reference):
/*
-- Users table (handled by Supabase Auth)

-- Pets table
CREATE TABLE pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('dog', 'cat')),
  breed VARCHAR,
  gender VARCHAR NOT NULL CHECK (gender IN ('male', 'female')),
  age INTEGER NOT NULL,
  weight DECIMAL NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vaccination records table
CREATE TABLE vaccination_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  vaccine_name VARCHAR NOT NULL,
  administered_date DATE NOT NULL,
  next_due_date DATE,
  veterinarian VARCHAR,
  image_url TEXT,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health records table (for future expansion)
CREATE TABLE health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  record_type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  image_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security policies
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Policies to ensure users can only access their own data
CREATE POLICY "Users can view their own pets" ON pets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage vaccination records for their pets" ON vaccination_records
  FOR ALL USING (auth.uid() = (SELECT user_id FROM pets WHERE id = pet_id));

CREATE POLICY "Users can manage health records for their pets" ON health_records
  FOR ALL USING (auth.uid() = (SELECT user_id FROM pets WHERE id = pet_id));
*/
