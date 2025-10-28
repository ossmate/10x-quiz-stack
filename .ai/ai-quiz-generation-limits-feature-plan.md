# Feature Plan: AI Quiz Generation Limits

## 1. Overview

This feature implements usage limits for AI-generated quizzes to control costs and resource usage. Initially, users will be limited to generating a maximum of 2 AI quizzes. The system is designed for future extensibility to support role-based limits, credit systems, and subscription tiers.

## 2. Business Requirements

### Current Requirements
- **Default Limit:** All authenticated users can generate up to 2 AI quizzes
- **Counter Tracking:** System tracks the number of AI-generated quizzes per user
- **User Feedback:** Users can see their remaining quota before and during generation
- **Prevention:** System prevents quiz generation once limit is reached

### Future Extensibility
- **Role-Based Limits:** Different limits for different user roles (e.g., free, premium, admin)
- **Credit System:** Users can purchase additional generation credits
- **Subscription Tiers:** Monthly/yearly plans with higher limits
- **Limit Reset:** Periodic reset of generation counts (e.g., monthly)
- **Temporary Boosts:** Time-limited promotions or bonuses

## 3. Configuration Management

### Environment Variables Approach (Recommended)

Store limits as environment variables for easy configuration without code changes:

```env
# .env file
AI_QUIZ_GENERATION_LIMIT_DEFAULT=2
AI_QUIZ_GENERATION_LIMIT_PREMIUM=10
AI_QUIZ_GENERATION_LIMIT_ADMIN=unlimited
```

**Advantages:**
- Easy to change without redeploying
- Different values per environment (dev, staging, prod)
- Secure and external to codebase
- Industry standard practice

### Configuration File Alternative

Alternatively, use a configuration file for more complex rules:

```typescript
// src/config/ai-limits.ts
export const AI_GENERATION_LIMITS = {
  default: 2,
  roles: {
    free: 2,
    premium: 10,
    admin: -1, // unlimited
  },
  features: {
    enableCreditSystem: false,
    enableMonthlyReset: false,
  },
} as const;
```

**Recommended Approach:** Use environment variables for MVP, with configuration file ready for future complex logic.

## 4. Database Schema Changes

### Option A: Add Column to Profiles Table

Add a counter column to track AI-generated quizzes:

```sql
-- Migration: Add AI quiz generation tracking
ALTER TABLE profiles
ADD COLUMN ai_quiz_generated_count INTEGER DEFAULT 0 NOT NULL;

-- Add index for performance
CREATE INDEX idx_profiles_ai_quiz_count ON profiles(ai_quiz_generated_count);
```

**Advantages:**
- Simple and performant
- Direct relationship to user
- Easy to query and update

**Disadvantages:**
- Difficult to implement periodic resets
- No historical tracking
- Limited extensibility for credits

### Option B: Create Dedicated Usage Tracking Table (Recommended for Future)

For better extensibility and historical tracking:

```sql
-- Migration: Create usage limits table
CREATE TABLE user_ai_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quota_type VARCHAR(50) NOT NULL DEFAULT 'ai_quiz_generation',
  used_count INTEGER DEFAULT 0 NOT NULL,
  total_limit INTEGER DEFAULT 2 NOT NULL,
  period_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  period_end TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, quota_type)
);

-- Add index for performance
CREATE INDEX idx_user_ai_quotas_user_id ON user_ai_quotas(user_id);
CREATE INDEX idx_user_ai_quotas_user_quota ON user_ai_quotas(user_id, quota_type);

-- Add RLS policies
ALTER TABLE user_ai_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotas"
  ON user_ai_quotas FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger to auto-create quota record for new users
CREATE OR REPLACE FUNCTION create_default_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_ai_quotas (user_id, quota_type, used_count, total_limit)
  VALUES (NEW.id, 'ai_quiz_generation', 0, 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_create_quota
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_quota();
```

**Advantages:**
- Supports multiple quota types
- Easy to implement periodic resets
- Historical tracking possible
- Supports different limits per user
- Future-proof for credits and subscriptions

**Disadvantages:**
- More complex to implement initially
- Requires additional queries

**Recommended for MVP:** Start with Option A (simple column), migrate to Option B when adding role-based or credit features.

## 5. Backend Changes

### 5.1 Database Service Layer

Create a dedicated service for quota management:

```typescript
// src/lib/services/ai-quota-service.ts
import { SupabaseClient } from '@supabase/supabase-js';

export interface UserQuota {
  used: number;
  limit: number;
  remaining: number;
  hasReachedLimit: boolean;
}

export class AIQuotaService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user's current AI quiz generation quota
   */
  async getUserQuota(userId: string): Promise<UserQuota> {
    const limit = this.getQuotaLimit();

    // Count AI-generated quizzes
    const { count, error } = await this.supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source', 'ai_generated');

    if (error) throw error;

    const used = count ?? 0;
    const remaining = Math.max(0, limit - used);
    const hasReachedLimit = used >= limit;

    return { used, limit, remaining, hasReachedLimit };
  }

  /**
   * Check if user can generate more quizzes
   */
  async canGenerateQuiz(userId: string): Promise<boolean> {
    const quota = await this.getUserQuota(userId);
    return !quota.hasReachedLimit;
  }

  /**
   * Increment quota after successful generation
   * Note: This happens automatically when quiz is saved with source='ai_generated'
   */
  async recordGeneration(userId: string): Promise<void> {
    // In simple implementation, this is a no-op since we count from quizzes table
    // In future with dedicated quota table, this would increment the counter
  }

  /**
   * Get quota limit from environment or config
   */
  private getQuotaLimit(): number {
    const envLimit = process.env.AI_QUIZ_GENERATION_LIMIT_DEFAULT;
    return envLimit ? parseInt(envLimit, 10) : 2;
  }

  /**
   * Admin function to reset user quota (future feature)
   */
  async resetUserQuota(userId: string): Promise<void> {
    // Future implementation for monthly resets or admin overrides
    throw new Error('Not implemented - requires dedicated quota table');
  }

  /**
   * Admin function to set custom limit (future feature)
   */
  async setUserLimit(userId: string, newLimit: number): Promise<void> {
    // Future implementation for role-based or purchased limits
    throw new Error('Not implemented - requires dedicated quota table');
  }
}
```

### 5.2 API Endpoint Updates

Update the AI generation endpoint to check quotas:

```typescript
// src/pages/api/quizzes/ai/generate.ts
import { AIQuotaService } from '@/lib/services/ai-quota-service';

export async function POST({ request, locals }) {
  const supabase = locals.supabase;
  const user = locals.user;

  // Authentication check
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  // CHECK QUOTA BEFORE GENERATION
  const quotaService = new AIQuotaService(supabase);
  const canGenerate = await quotaService.canGenerateQuiz(user.id);

  if (!canGenerate) {
    const quota = await quotaService.getUserQuota(user.id);
    return new Response(
      JSON.stringify({
        error: 'Quiz generation limit reached',
        message: `You have reached your limit of ${quota.limit} AI-generated quizzes.`,
        quota: quota,
      }),
      {
        status: 429, // Too Many Requests
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Continue with existing generation logic...
  const { prompt } = await request.json();
  // ... generate quiz ...

  return new Response(JSON.stringify(generatedQuiz), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 5.3 Get Quota Endpoint

Create a new endpoint for fetching quota information:

```typescript
// src/pages/api/user/ai-quota.ts
import { AIQuotaService } from '@/lib/services/ai-quota-service';

export async function GET({ locals }) {
  const supabase = locals.supabase;
  const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const quotaService = new AIQuotaService(supabase);
    const quota = await quotaService.getUserQuota(user.id);

    return new Response(JSON.stringify(quota), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch quota' }),
      { status: 500 }
    );
  }
}
```

## 6. Frontend Changes

### 6.1 Quota Display Component

Create a reusable component to show quota status:

```typescript
// src/components/ai/AIQuotaDisplay.tsx
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { InfoIcon } from 'lucide-react';

interface UserQuota {
  used: number;
  limit: number;
  remaining: number;
  hasReachedLimit: boolean;
}

export function AIQuotaDisplay() {
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/user/ai-quota');
      if (response.ok) {
        const data = await response.json();
        setQuota(data);
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !quota) {
    return null;
  }

  const percentage = (quota.used / quota.limit) * 100;

  return (
    <Alert variant={quota.hasReachedLimit ? 'destructive' : 'default'}>
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>AI Quiz Generation Quota</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>
            {quota.remaining} of {quota.limit} generations remaining
          </p>
          <Progress value={percentage} className="h-2" />
          {quota.hasReachedLimit && (
            <p className="text-sm text-destructive">
              You've reached your generation limit. Delete existing AI-generated
              quizzes or upgrade your account for more.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

### 6.2 Update AI Quiz Generation Page

Integrate quota checking into the generation workflow:

```typescript
// src/pages/quizzes/ai/generate.astro (or associated React component)

// Add quota check before showing form
const quota = await fetchUserQuota();

if (quota.hasReachedLimit) {
  // Show limit reached message with options
  // - View existing quizzes
  // - Delete old quizzes to free up quota
  // - Upgrade account (future feature)
}
```

### 6.3 Error Handling in Generation Hook

Update the generation hook to handle quota errors:

```typescript
// In useAIQuizGeneration hook
const generateQuiz = async (prompt: string) => {
  setState({ ...state, status: 'generating' });

  try {
    const response = await fetch('/api/quizzes/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (response.status === 429) {
      // Quota exceeded
      const data = await response.json();
      setState({
        ...state,
        status: 'error',
        error: data.message || 'Generation limit reached',
      });
      return;
    }

    // ... rest of generation logic
  } catch (error) {
    // ... error handling
  }
};
```

## 7. User Experience Flow

### 7.1 Before Generation
1. User navigates to `/quizzes/ai/generate`
2. Page displays quota information prominently:
   - "You have 2 of 2 AI quiz generations remaining"
   - Progress bar showing usage
3. Generation form is enabled if quota available

### 7.2 At Limit
1. User sees alert: "Generation Limit Reached"
2. Display options:
   - View existing AI-generated quizzes
   - Button to navigate to quiz list with filter
   - Information about future upgrade options
3. Generation form is disabled

### 7.3 After Generation
1. Quiz generated successfully
2. Quota display updates: "You have 1 of 2 generations remaining"
3. User can proceed to edit/publish

### 7.4 Error State
1. If generation fails due to quota error
2. Clear error message with explanation
3. Quota display refreshed to show accurate count

## 8. Implementation Steps

### Phase 1: Database Setup
1. ✓ **Implemented:** No migration needed - uses dynamic counting from existing `quizzes` table
2. ✓ Counts quizzes where `metadata->>'source' = 'ai_generated'`
3. ✓ Leverages existing database indexes on quizzes table
4. ✓ Uses existing RLS policies on quizzes table

### Phase 2: Backend Implementation
1. ✓ **Implemented:** `AIQuotaService` class in `src/lib/services/ai-quota.service.ts`
2. ✓ Methods: `getUserQuota()`, `canGenerateQuiz()`, `getQuotaLimit()`
3. ✓ Environment variable: `AI_QUIZ_GENERATION_LIMIT_DEFAULT=2`
4. ✓ Updated `POST /api/quizzes/ai/generate` with quota check before generation
5. ✓ Created `GET /api/user/ai-quota` endpoint using SSR authentication
6. ✓ Returns 429 status code with quota details when limit reached

### Phase 3: Frontend Components
1. ✓ **Implemented:** `AIQuotaDisplay` component in `src/components/quizzes/AIQuotaDisplay.tsx`
2. ✓ Shows "X / Y AI quiz generations used" with progress bar
3. ✓ Different alert variants for available vs limit reached states
4. ✓ `GenerationForm` accepts `isDisabled` and `quotaMessage` props
5. ✓ Form automatically disables textarea, button, and shows warning when limit reached

### Phase 4: Integration
1. ✓ **Implemented:** Quota display integrated into `/quizzes/ai/generate` page
2. ✓ `AIQuizGenerator` fetches quota on mount and passes to form
3. ✓ `AIQuizClientService` handles 429 errors with detailed messages
4. ✓ Form prevents submission when quota limit is reached (no dashboard integration yet)

### Phase 5: Testing
1. ✓ **Verified:** Quota enforcement working with authenticated users
2. ✓ UI correctly shows all states (available, limit reached)
3. ✓ Server-side enforcement prevents generation when limit reached
4. ✓ Error messages are clear and actionable

### Phase 6: Documentation
1. ✓ **Updated:** Feature plan with implementation details
2. ✓ Environment variable documented in `.env.example`
3. ✓ API endpoints documented in code comments
4. ⏳ User-facing help/FAQ (future enhancement)

## 9. Future Enhancements

### 9.1 Role-Based Limits
```typescript
// Example implementation
interface RoleQuotaConfig {
  free: number;
  premium: number;
  admin: number;
}

const ROLE_LIMITS: RoleQuotaConfig = {
  free: 2,
  premium: 10,
  admin: -1, // unlimited
};

async getUserQuotaLimit(userId: string): Promise<number> {
  const { data: profile } = await this.supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return ROLE_LIMITS[profile.role] || ROLE_LIMITS.free;
}
```

### 9.2 Credit System
```sql
-- Add credits table
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type VARCHAR(50) NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add credit transactions for history
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### 9.3 Monthly Reset
```typescript
async resetMonthlyQuotas(): Promise<void> {
  // Reset quotas for all users at start of month
  await this.supabase
    .from('user_ai_quotas')
    .update({
      used_count: 0,
      period_start: new Date(),
    })
    .lt('period_start', getStartOfCurrentMonth());
}
```

### 9.4 Admin Override
```typescript
async setCustomUserLimit(
  adminUserId: string,
  targetUserId: string,
  newLimit: number
): Promise<void> {
  // Verify admin permissions
  await this.verifyAdminAccess(adminUserId);

  // Update user's limit
  await this.supabase
    .from('user_ai_quotas')
    .update({ total_limit: newLimit })
    .eq('user_id', targetUserId)
    .eq('quota_type', 'ai_quiz_generation');
}
```

## 10. Configuration Reference

### Environment Variables

```env
# AI Quiz Generation Limits
AI_QUIZ_GENERATION_LIMIT_DEFAULT=2
AI_QUIZ_GENERATION_LIMIT_PREMIUM=10
AI_QUIZ_GENERATION_LIMIT_ADMIN=unlimited

# Feature Flags
ENABLE_AI_QUOTA_CREDITS=false
ENABLE_AI_QUOTA_MONTHLY_RESET=false
```

### Supabase Configuration

No additional Supabase configuration required beyond migration scripts.

## 11. Testing Checklist

- [ ] User can see quota before generating quiz
- [ ] User cannot generate quiz when limit reached
- [ ] Quota count updates after successful generation
- [ ] Proper error message shown when limit exceeded
- [ ] API returns 429 status when quota exceeded
- [ ] Environment variable configuration works correctly
- [ ] Quota persists across sessions
- [ ] Concurrent generation attempts handled correctly
- [ ] Admin can view user quotas (future)
- [ ] Quota reset functionality works (future)

## 12. Security Considerations

- **Server-Side Enforcement:** Always check quota on server, never trust client
- **Rate Limiting:** Consider adding rate limiting in addition to quota
- **Audit Logging:** Log quota changes for fraud detection
- **User Verification:** Ensure user can only view their own quota
- **RLS Policies:** Properly configure Row Level Security for quota tables

## 13. Performance Considerations

- **Caching:** Consider caching quota counts with short TTL (30-60 seconds)
- **Database Indexes:** Ensure proper indexes on user_id and source columns
- **Query Optimization:** Use `count` with `head: true` for efficient counting
- **Batch Updates:** For monthly resets, use batch operations

## 14. Monitoring and Analytics

- Track quota usage patterns
- Monitor users reaching limits
- Alert on unexpected quota consumption
- Track conversion rates for upgrade prompts (future)
- Monitor API 429 response rates

## 15. Implementation Notes

### Key Decisions Made

1. **No Database Migration Required**
   - Instead of adding a counter column or separate quota table, we count AI-generated quizzes dynamically
   - Query: `WHERE metadata->>'source' = 'ai_generated' AND deleted_at IS NULL`
   - Simpler approach for MVP, can migrate to dedicated table later if needed

2. **SSR Authentication for Session Access**
   - Used `createSupabaseServerInstance({ cookies, headers })` instead of service role client
   - Critical for reading user sessions from browser cookies
   - Ensures quota checks run for the correct authenticated user

3. **Proactive Form Disabling**
   - Form disables when quota limit is reached (better UX)
   - User cannot waste time filling out form if they can't submit
   - Clear warning message explains the limit and next steps

4. **Query Syntax for JSONB**
   - Both `filter("metadata->>source", "eq", "ai_generated")` and `contains()` work
   - The `->` operator doesn't work with PostgREST
   - Used `->>` for text extraction from JSONB

### Bug Fixes During Implementation

1. **User ID Mismatch Issue**
   - Problem: Quota endpoints used `getDefaultUserId()`, but quiz creation used authenticated user
   - Fix: Updated both endpoints to use `createSupabaseServerInstance` for proper session access
   - Result: Quota now correctly tracks the authenticated user's quizzes

2. **Confusing Quota Display**
   - Problem: "0 of 2 generations remaining" was unclear
   - Fix: Changed to "2 / 2 AI quiz generations used" format
   - Result: Users immediately understand their usage

### Files Created

- `src/lib/services/ai-quota.service.ts` - Quota service with counting logic
- `src/pages/api/user/ai-quota.ts` - GET endpoint for quota info
- `src/components/quizzes/AIQuotaDisplay.tsx` - Quota display component
- `src/components/ui/progress.tsx` - Progress bar component (Radix UI)

### Files Modified

- `src/pages/api/quizzes/ai/generate.ts` - Added quota check before generation
- `src/pages/quizzes/ai/generate.astro` - Added quota display to page
- `src/components/quizzes/AIQuizGenerator.tsx` - Fetches quota and disables form
- `src/components/quizzes/GenerationForm.tsx` - Accepts disabled state
- `src/lib/services/ai-quiz-client.service.ts` - Handles 429 quota errors
- `.env.example` - Added `AI_QUIZ_GENERATION_LIMIT_DEFAULT=2`
- `package.json` - Added `@radix-ui/react-progress` dependency

## 16. Success Metrics

- **Technical:**
  - Zero quota bypass incidents
  - < 100ms quota check latency
  - 99.9% uptime for quota service

- **Business:**
  - < 5% user complaints about limits
  - Clear understanding of quota system (user feedback)
  - Ready for monetization features (future)

- **User Experience:**
  - Users understand their limits before generation
  - Clear path forward when limit reached
  - No confusion about quota counting
