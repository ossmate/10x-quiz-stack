-- Production Registration Diagnostics
-- Run these queries in Supabase SQL Editor to diagnose registration issues
-- =========================================================================

-- 1. CHECK RLS POLICIES ON PROFILES TABLE
-- Expected: 5 policies (Public username lookup, Users can update own profile,
--           Users can insert own profile, Users can delete own profile)
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected output:
-- - "Public username lookup" (SELECT)
-- - "Users can update own profile" (UPDATE)
-- - "Users can insert own profile" (INSERT)
-- - "Users can delete own profile" (DELETE)

-- 2. CHECK FOR DATABASE TRIGGER
-- Expected: on_auth_user_created trigger should exist
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Expected output: Trigger exists and is enabled ('O' = enabled)

-- 3. CHECK TRIGGER FUNCTION
-- Expected: handle_new_user function should exist
SELECT
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 4. CHECK FOR ORPHANED USERS (users without profiles)
-- Expected: 0 rows (all users should have profiles)
SELECT
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'username' AS metadata_username
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- If rows exist, these are orphaned users that need profile backfill

-- 5. CHECK FOR DUPLICATE USERNAMES
-- Expected: 0 rows (usernames should be unique)
SELECT
  username,
  COUNT(*) AS count
FROM public.profiles
GROUP BY username
HAVING COUNT(*) > 1;

-- 6. VERIFY PROFILES TABLE STRUCTURE
-- Expected: id (uuid, PK), username (text, unique, not null), created_at, updated_at
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. CHECK RECENT REGISTRATIONS
-- Expected: Recent users should have corresponding profiles
SELECT
  au.id,
  au.email,
  au.created_at AS user_created,
  p.username,
  p.created_at AS profile_created,
  EXTRACT(EPOCH FROM (p.created_at - au.created_at)) AS profile_delay_seconds
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC
LIMIT 10;

-- profile_delay_seconds should be < 1 second (near instantaneous via trigger)

-- 8. TEST EMAIL CONFIRMATION SETTING
-- Expected: confirm_email should be false for immediate login
SELECT
  raw_app_meta_data->>'provider' AS provider,
  COUNT(*) as user_count,
  COUNT(email_confirmed_at) AS confirmed_count,
  COUNT(*) - COUNT(email_confirmed_at) AS unconfirmed_count
FROM auth.users
GROUP BY raw_app_meta_data->>'provider';

-- 9. CHECK USERNAME UNIQUENESS CONSTRAINT
-- Expected: unique constraint exists on profiles.username
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'u'; -- unique constraints

-- 10. VERIFY RLS IS ENABLED ON PROFILES TABLE
-- Expected: true
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- =========================================================================
-- DIAGNOSTIC SUMMARY QUERY
-- Run this for a quick health check
-- =========================================================================
SELECT
  'Total Users' AS metric,
  COUNT(*)::text AS value
FROM auth.users
UNION ALL
SELECT
  'Total Profiles' AS metric,
  COUNT(*)::text AS value
FROM public.profiles
UNION ALL
SELECT
  'Orphaned Users' AS metric,
  COUNT(*)::text AS value
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
UNION ALL
SELECT
  'Trigger Exists' AS metric,
  CASE WHEN EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
    THEN 'YES' ELSE 'NO'
  END AS value
UNION ALL
SELECT
  'RLS Policies Count' AS metric,
  COUNT(*)::text AS value
FROM pg_policies
WHERE tablename = 'profiles'
UNION ALL
SELECT
  'Duplicate Usernames' AS metric,
  COUNT(*)::text AS value
FROM (
  SELECT username
  FROM public.profiles
  GROUP BY username
  HAVING COUNT(*) > 1
) duplicates;

-- Expected values:
-- - Total Users = Total Profiles (should match)
-- - Orphaned Users = 0
-- - Trigger Exists = YES
-- - RLS Policies Count = 5
-- - Duplicate Usernames = 0

-- =========================================================================
-- BACKFILL ORPHANED USERS (if found in query #4)
-- ONLY RUN THIS IF ORPHANED USERS EXIST
-- =========================================================================
-- UNCOMMENT BELOW TO EXECUTE:
/*
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
        RAISE NOTICE 'Skipping user % - username already exists', user_record.id;
        CONTINUE;
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to backfill profile for user %: %', user_record.id, SQLERRM;
        CONTINUE;
    END;
  END LOOP;

  RAISE NOTICE 'Backfilled % orphaned user profiles', affected_count;
END $$;
*/
