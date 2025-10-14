-- Auto-generate and apply search_path fixes for ALL remaining functions
-- This migration queries the database to find all functions without search_path set,
-- then automatically fixes them with the correct signatures.

DO $$
DECLARE
    func_record RECORD;
    func_count INTEGER := 0;
    fixed_count INTEGER := 0;
BEGIN
    -- Loop through all functions in public schema that don't have search_path set
    FOR func_record IN
        SELECT
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'  -- Only functions, not procedures
        AND NOT EXISTS (
            -- Check if search_path is already set
            SELECT 1
            FROM pg_proc p2
            WHERE p2.oid = p.oid
            AND p2.proconfig IS NOT NULL
            AND 'search_path' = ANY(
                SELECT split_part(unnest(p2.proconfig), '=', 1)
            )
        )
        ORDER BY p.proname
    LOOP
        func_count := func_count + 1;

        BEGIN
            -- Build and execute the ALTER FUNCTION statement
            EXECUTE format(
                'ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp',
                func_record.function_name,
                func_record.args
            );

            fixed_count := fixed_count + 1;
            RAISE NOTICE 'Fixed [%/%]: %(%)',
                fixed_count,
                func_count,
                func_record.function_name,
                func_record.args;

        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to fix %.%(%): %',
                    'public',
                    func_record.function_name,
                    func_record.args,
                    SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Migration Complete!';
    RAISE NOTICE 'Total functions processed: %', func_count;
    RAISE NOTICE 'Successfully fixed: %', fixed_count;
    RAISE NOTICE 'Failed: %', (func_count - fixed_count);
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'Run the Supabase linter again to verify all warnings are resolved.';
    RAISE NOTICE '====================================================================';
END $$;
