
-- Add new fields to the pets table for pre-existing conditions and reproductive status
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS pre_existing_conditions text[],
ADD COLUMN IF NOT EXISTS reproductive_status text;

-- Update the reproductive status to have a default value
ALTER TABLE pets 
ALTER COLUMN reproductive_status SET DEFAULT 'not_yet';

-- Add a check constraint for reproductive status values
ALTER TABLE pets 
ADD CONSTRAINT check_reproductive_status 
CHECK (reproductive_status IN ('spayed', 'neutered', 'not_yet') OR reproductive_status IS NULL);

-- Update existing pets to have the default reproductive status if null
UPDATE pets 
SET reproductive_status = 'not_yet' 
WHERE reproductive_status IS NULL;
