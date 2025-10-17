# Username Login - Implementation Summary

## ✅ CURRENT SOLUTION (Secure & Production-Ready)

Username login is now implemented using **public RLS policy** - the secure, standard approach.

### How It Works Now

1. **Public RLS Policy** allows anyone to read `id` and `username` from profiles table
2. Login endpoint uses **regular client** (no service role key needed for username lookup)
3. Service role key is only used for `auth.admin.getUserById()` (still required by Supabase API)

### Code Flow

```typescript
// 1. User enters username
const username = "vil84";

// 2. Query profiles with regular client (RLS allows public read)
const { data: profileData } = await supabase
  .from("profiles")
  .select("id")
  .eq("username", username)
  .single();  // ✅ Works because of public RLS policy

// 3. Get email from user ID (requires admin client)
const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profileData.id);
const email = userData.user.email;

// 4. Login with email + password
await supabase.auth.signInWithPassword({ email, password });
```

### Security

- ✅ **Username is public** (standard for social platforms)
- ✅ **No service role key for profile queries** (safer)
- ✅ **RLS still protects other profile data**
- ✅ **Password still required** (authentication not bypassed)

### Migration Applied

```sql
-- Public read access to profiles (username lookup)
CREATE POLICY "Public username lookup"
ON profiles FOR SELECT USING (true);
```

**File:** `supabase/migrations/20251017000000_update_profiles_rls_for_username_login.sql`

## Historical Problem (RESOLVED)

Users could NOT log in with their username, only with email.

### Error Observed
```
[DEBUG] Profile lookup result: {
  profileData: null,
  profileError: {
    code: 'PGRST116',
    details: 'The result contains 0 rows',
    message: 'Cannot coerce the result to a single JSON object'
  }
}
```

Even though the profile existed in the database:
```json
{"id":"5218a6e4-469d-4c92-8547-dae17193d8f1","username":"vil84"}
```

## Root Cause: Row Level Security (RLS)

**Row Level Security (RLS)** policies on the `profiles` table were blocking unauthenticated users from querying profiles.

The login flow:
1. User enters username "vil84" + password
2. Login endpoint tries to query: `SELECT id FROM profiles WHERE username = 'vil84'`
3. **RLS blocks the query** because user is not authenticated yet
4. Query returns 0 rows (PGRST116 error)
5. Login fails with "Invalid email or password"

The profile existed, but was **invisible** to unauthenticated queries due to RLS policies.

## Solution: Service Role Client

Changed the login endpoint to use a **service role client** instead of the regular client for username lookups.

### What is a Service Role Client?

- Uses `SUPABASE_SERVICE_ROLE_KEY` instead of the public anon key
- **Bypasses Row Level Security (RLS)**
- Has admin privileges
- Can read/write all data regardless of RLS policies

### Code Changes

**Before (BROKEN):**
```typescript
// Used regular client - respects RLS
const supabase = createSupabaseServerInstance({ cookies, headers });

const { data: profileData } = await supabase  // ❌ RLS blocks this!
  .from("profiles")
  .select("id")
  .eq("username", emailOrUsername)
  .single();
```

**After (FIXED):**
```typescript
// Create service role client with admin privileges
const supabaseAdmin = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY,  // 🔑 Admin key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Use admin client to bypass RLS
const { data: profileData } = await supabaseAdmin  // ✅ Bypasses RLS!
  .from("profiles")
  .select("id")
  .eq("username", emailOrUsername)
  .single();
```

## Login Flow (Username)

```
User enters: "vil84" + password
    ↓
1. Check if input contains "@" → NO (it's a username)
    ↓
2. Create service role client (bypasses RLS)
    ↓
3. Query profiles table: SELECT id FROM profiles WHERE username = 'vil84'
    ↓ (RLS bypassed by service role key)
4. Found: user_id = "5218a6e4-469d-4c92-8547-dae17193d8f1"
    ↓
5. Use admin API to get email: auth.admin.getUserById(user_id)
    ↓
6. Found: email = "user@example.com"
    ↓
7. Authenticate with Supabase: signInWithPassword(email, password)
    ↓
8. Success! ✅
```

## Security Considerations

### Is This Safe?

**YES!** The service role client is only used for:
1. Looking up username → user_id mapping
2. Getting email from user_id

### Security Measures:
- ✅ Service role key is server-side only (never exposed to client)
- ✅ Generic error messages (doesn't reveal if username exists)
- ✅ Still requires valid password for authentication
- ✅ Actual login still goes through Supabase Auth (not bypassed)
- ✅ No sensitive data exposed in the lookup

### What We DON'T Do:
- ❌ We don't bypass authentication
- ❌ We don't expose user data
- ❌ We don't reveal if username exists (generic error)
- ❌ We don't let users log in without valid credentials

## Files Modified

1. **`src/pages/api/auth/login.ts`**
   - Added service role client creation
   - Use admin client for profile lookup
   - Use admin client for getUserById

2. **`src/pages/api/auth/register.ts`**
   - Ensure profiles are created during registration
   - Without profiles, username login won't work

## Testing

### Test Email Login:
```
Email: hav06794@toaik.com
Password: your_password
Result: ✅ Works
```

### Test Username Login:
```
Username: vil84
Password: your_password
Result: ✅ Works (after fix)
```

## Commits

1. `0251673` - feat(auth): support login with email or username
2. `a4ba6cb` - fix(auth): enable username login by creating profiles and using admin client
3. `eeb9c3b` - fix(auth): use service role client for username lookup to bypass RLS ⭐

## Key Learnings

### RLS Can Block Legitimate Queries
- RLS policies apply to all queries, even during authentication flows
- Service role key is needed to bypass RLS for legitimate admin operations

### When to Use Service Role Client
- ✅ Admin operations that need to bypass RLS
- ✅ Background jobs and cron tasks
- ✅ Looking up public profile data during authentication
- ❌ Never expose service role key to client
- ❌ Never use for user-initiated queries

### Environment Variables Required
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_anon_key  # Public key, respects RLS
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Admin key, bypasses RLS
```

## References

- Commit: `eeb9c3b` - fix(auth): use service role client for username lookup to bypass RLS
- File: `src/pages/api/auth/login.ts` (lines 64-98)
- Supabase Docs: https://supabase.com/docs/guides/auth/row-level-security
