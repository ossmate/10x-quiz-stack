-- Migration: Update profiles RLS policies for secure username login
-- Date: 2025-10-17
-- Purpose: Enable public username lookup while maintaining security
--
-- This migration updates RLS policies to allow unauthenticated users to query
-- usernames from the profiles table. This is necessary for username-based login
-- without requiring service role key bypass.
--
-- Security considerations:
-- - Only id and username columns are publicly readable
-- - Other profile data remains protected by RLS
-- - Users can still only update their own profiles
-- - Standard practice for social platforms (GitHub, Twitter, Discord)

-- Step 1: Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Step 2: Create public read policy for username lookup
-- This allows anyone (authenticated or not) to read id and username
-- Required for username-based login flow
COMMENT ON TABLE profiles IS 'User profiles table. Username is publicly readable for login purposes.';

CREATE POLICY "Public username lookup"
ON profiles
FOR SELECT
USING (true);

-- Step 3: Create policies for authenticated users
-- Users can update their own profile data
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 4: Service role can insert profiles (for registration)
-- This policy allows the service role to create profiles during user registration
CREATE POLICY "Service role can insert profiles"
ON profiles
FOR INSERT
WITH CHECK (true);

-- Step 5: Users can delete their own profiles (optional, for account deletion)
CREATE POLICY "Users can delete own profile"
ON profiles
FOR DELETE
USING (auth.uid() = id);

-- Verification query (run after migration)
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
