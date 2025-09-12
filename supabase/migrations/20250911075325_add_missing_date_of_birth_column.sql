-- Add missing date_of_birth column to users_profile table

-- Add the date_of_birth column if it doesn't exist
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Add a comment to document the column
COMMENT ON COLUMN public.users_profile.date_of_birth IS 'User date of birth for age verification and compliance';