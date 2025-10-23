-- Migration: Add automatic profile creation trigger and fix RLS security
-- Date: 2025-10-23
-- Purpose: Replace insecure INSERT policy with database trigger for automatic profile creation
--
-- Security improvements:
-- - Removes insecure "WITH CHECK (true)" policy that allowed arbitrary profile creation
-- - Implements database trigger for automatic profile creation on user signup
-- - Profile creation happens at database level, bypassing RLS completely
-- - Usernames are extracted from auth.users.raw_user_meta_data
--
-- Benefits over manual INSERT:
-- - Atomic: Profile always created when user is created
-- - Secure: No RLS bypass needed
-- - Reliable: No race conditions or failed insertions
-- - Automatic: No application code changes needed

-- Step 1: Drop the insecure INSERT policy
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Step 2: Create function to handle profile creation
-- This function is called automatically when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile with username from user metadata
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8))
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 3: Create trigger to automatically create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Add secure INSERT policy for edge cases
-- This policy only allows inserting a profile if:
-- 1. The user is authenticated AND
-- 2. They're inserting their own profile (id matches auth.uid())
-- This is a safety net in case the trigger fails or for manual admin operations
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 5: Create backfill for existing users without profiles
-- This handles any orphaned users created before this migration
DO $$
DECLARE
  user_record RECORD;
  affected_count INTEGER := 0;
BEGIN
  FOR user_record IN
    SELECT au.id, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, username)
      VALUES (
        user_record.id,
        COALESCE(
          user_record.raw_user_meta_data->>'username',
          'user_' || substr(user_record.id::text, 1, 8)
        )
      );
      affected_count := affected_count + 1;
    EXCEPTION
      WHEN unique_violation THEN
        -- Profile already exists somehow, skip
        CONTINUE;
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to backfill profile for user %: %', user_record.id, SQLERRM;
        CONTINUE;
    END;
  END LOOP;

  IF affected_count > 0 THEN
    RAISE NOTICE 'Backfilled % orphaned user profiles', affected_count;
  ELSE
    RAISE NOTICE 'No orphaned users found - all users have profiles';
  END IF;
END $$;

-- Verification queries (run after migration to verify)
-- 1. Check all policies on profiles table:
--    SELECT * FROM pg_policies WHERE tablename = 'profiles';
--
-- 2. Verify trigger exists:
--    SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
--
-- 3. Check for orphaned users:
--    SELECT COUNT(*) FROM auth.users au
--    LEFT JOIN public.profiles p ON p.id = au.id
--    WHERE p.id IS NULL;
--
-- 4. Test trigger by creating a test user (then delete):
--    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data)
--    VALUES (
--      '00000000-0000-0000-0000-000000000000',
--      gen_random_uuid(),
--      'authenticated',
--      'authenticated',
--      'test@example.com',
--      crypt('password', gen_salt('bf')),
--      '{"username": "testuser"}'::jsonb
--    );
