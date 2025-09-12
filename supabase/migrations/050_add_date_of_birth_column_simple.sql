-- Simple fix: Add date_of_birth column to users_profile
-- This is a focused migration to resolve the immediate column error

-- Add the date_of_birth column if it doesn't exist
DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'date_of_birth'
        AND table_schema = 'public'
    ) THEN
        -- Add the column
        ALTER TABLE public.users_profile 
        ADD COLUMN date_of_birth date;
        
        -- Add a comment
        COMMENT ON COLUMN public.users_profile.date_of_birth 
        IS 'User date of birth for age verification and compliance';
        
        -- Log the addition
        INSERT INTO domain_events (event_type, event_data, created_at)
        VALUES (
            'users_profile_schema_updated',
            jsonb_build_object(
                'migration_version', '050',
                'column_added', 'date_of_birth',
                'table', 'users_profile',
                'reason', 'fix_missing_column_error'
            ),
            NOW()
        );
        
        RAISE NOTICE 'Successfully added date_of_birth column to users_profile table';
    ELSE
        RAISE NOTICE 'date_of_birth column already exists in users_profile table';
    END IF;
END $$;