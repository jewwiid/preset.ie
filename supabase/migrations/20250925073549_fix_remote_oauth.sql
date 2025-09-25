-- Fix OAuth for Remote Supabase
-- Add RLS policies for auth.users to allow OAuth user creation

-- Enable RLS on auth.users if not already enabled
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow user creation during signup" ON auth.users;
DROP POLICY IF EXISTS "Allow user access during signup" ON auth.users;
DROP POLICY IF EXISTS "Allow service role full access" ON auth.users;
DROP POLICY IF EXISTS "Allow auth admin full access" ON auth.users;

-- Create comprehensive RLS policies for OAuth
CREATE POLICY "Allow user creation during signup" ON auth.users 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow user access during signup" ON auth.users 
FOR SELECT TO anon, authenticated 
USING (true);

CREATE POLICY "Allow service role full access" ON auth.users 
FOR ALL TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "Allow auth admin full access" ON auth.users 
FOR ALL TO supabase_auth_admin 
USING (true) WITH CHECK (true);

-- Also ensure public.users table has proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users;
DROP POLICY IF EXISTS "Allow user access during signup" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users;
DROP POLICY IF EXISTS "Allow auth admin full access" ON public.users;

CREATE POLICY "Allow user creation during signup" ON public.users 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow user access during signup" ON public.users 
FOR SELECT TO anon, authenticated 
USING (true);

CREATE POLICY "Allow service role full access" ON public.users 
FOR ALL TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "Allow auth admin full access" ON public.users 
FOR ALL TO supabase_auth_admin 
USING (true) WITH CHECK (true);

-- Ensure users_profile table has proper policies
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user creation during signup" ON public.users_profile;
DROP POLICY IF EXISTS "Allow user access during signup" ON public.users_profile;
DROP POLICY IF EXISTS "Allow service role full access" ON public.users_profile;
DROP POLICY IF EXISTS "Allow auth admin full access" ON public.users_profile;

CREATE POLICY "Allow user creation during signup" ON public.users_profile 
FOR INSERT TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow user access during signup" ON public.users_profile 
FOR SELECT TO anon, authenticated 
USING (true);

CREATE POLICY "Allow service role full access" ON public.users_profile 
FOR ALL TO service_role 
USING (true) WITH CHECK (true);

CREATE POLICY "Allow auth admin full access" ON public.users_profile 
FOR ALL TO supabase_auth_admin 
USING (true) WITH CHECK (true);
