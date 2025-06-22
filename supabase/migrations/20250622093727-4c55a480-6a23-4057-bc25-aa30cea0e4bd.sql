
-- Enable Row Level Security on the pets table
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own pets
CREATE POLICY "Users can view their own pets" 
  ON public.pets 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own pets
CREATE POLICY "Users can create their own pets" 
  ON public.pets 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own pets
CREATE POLICY "Users can update their own pets" 
  ON public.pets 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own pets
CREATE POLICY "Users can delete their own pets" 
  ON public.pets 
  FOR DELETE 
  USING (auth.uid() = user_id);
