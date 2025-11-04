# Documentation Updates - RLS Enforcement

## Overview
Updated architecture documentation to reflect the RLS enforcement refactor completed on November 4, 2025.

## Files Updated

### 1. `.ai/prd.md`
**Status:** ✅ No changes needed
- PRD focuses on user-facing features and doesn't contain implementation details about RLS
- All user stories remain valid and unchanged

### 2. `.ai/auth-architecture.md`
**Status:** ✅ Updated

#### Changes Made:

1. **Added Security Notice** (Line 17)
   - Added prominent notice about RLS enforcement
   - References the RLS-ENFORCEMENT-REFACTOR.md document

2. **Updated Implementation Notes** (Line 626-629)
   - **Before:** "Use service role key to create profile (bypasses RLS)"
   - **After:** "Profile creation handled by database trigger or authenticated user context"
   - Added note about RLS policies requirement

3. **Completely Rewrote Middleware Section** (Lines 942-1030)
   - **Before:** Showed service-role key bypass for API routes
   - **After:** Shows current implementation with RLS enforcement
   - Removed all service-role key usage
   - Updated to use `createSupabaseServerInstance`
   - Added security change notes

4. **Updated RLS Policies Section** (Lines 1356-1379)
   - **Before:** "Service role can insert profiles" policy
   - **After:** "Users can insert own profile" policy
   - Changed policy to allow authenticated users to create their own profile
   - Added explanatory notes

5. **Updated Service Layer Code** (Line 1114-1115)
   - **Before:** "Create profile (using service role key to bypass RLS)"
   - **After:** "Create profile - RLS policy allows INSERT for authenticated user"
   - Added note about RLS policy requirement

6. **Updated API Pattern Examples** (Lines 1663-1683)
   - **Before:** Showed `createSupabaseServerInstance` in API routes
   - **After:** Shows `locals.supabase` usage
   - Added warning to NEVER use `createSupabaseServerInstance` in API routes

7. **Added Security Section Notice** (Line 1413)
   - Added RLS enforcement notice at start of Security Considerations
   - Links to implementation details document

## Key Changes Summary

### What Was Removed:
- ❌ All references to service-role key usage in HTTP routes
- ❌ Instructions to bypass RLS in API handlers
- ❌ `createClient` with service-role key in middleware
- ❌ Direct `createSupabaseServerInstance` in API routes

### What Was Added:
- ✅ RLS enforcement notices in multiple sections
- ✅ Current middleware implementation
- ✅ Updated RLS policy examples
- ✅ Best practice patterns using `locals.supabase`
- ✅ Security warnings and reminders
- ✅ Links to implementation details

## Documentation Consistency

All documentation now accurately reflects:
1. ✅ **Current Implementation** - Middleware provides RLS-enforced client
2. ✅ **Security First** - No service-role bypass in HTTP routes
3. ✅ **Best Practices** - Use `locals.supabase` everywhere
4. ✅ **RLS Policies** - Must be properly configured on all tables

## Related Documents

- **RLS-ENFORCEMENT-REFACTOR.md** - Complete implementation details
- **src/test/security/rls-enforcement.test.ts** - Security unit tests
- **tests/e2e/rls-security.spec.ts** - Integration tests

## Verification

To verify documentation accuracy:
1. Compare middleware section with `src/middleware/index.ts`
2. Check API pattern examples against actual route implementations
3. Review RLS policies against database schema
4. Run security tests: `npm run test -- src/test/security`

## Notes for Future Maintainers

- Always maintain RLS enforcement in HTTP routes
- Service-role key usage limited to internal jobs/scripts only
- Update documentation immediately if security patterns change
- Keep RLS policy examples synchronized with database migrations
