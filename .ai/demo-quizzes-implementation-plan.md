# Demo Quizzes Implementation Plan

## Overview

Add 3 demo/showcase quizzes to the landing page that allow unauthenticated users to experience the quiz-taking functionality without creating an account. This provides immediate value and encourages sign-ups.

## Goals

1. Showcase the quiz-taking experience to visitors
2. Allow non-logged users to take demo quizzes without saving attempts
3. Encourage user registration by showing the value proposition
4. Simplify the MVP by removing complex public quiz discovery

## User Story

**As a** visitor to the landing page
**I want to** try taking a quiz without signing up
**So that** I can understand the value of the platform before committing to registration

**Acceptance Criteria:**
- 3 demo quizzes are visible on the landing page
- Users can click and take any demo quiz without authentication
- Quiz attempts are NOT saved to the database for unauthenticated users
- Users see a prominent CTA to sign up after/during quiz to save results
- Logged-in users can also take demo quizzes (attempts saved normally)

## Implementation Plan

### Phase 1: Create Demo Quiz Data

#### 1.1 Define Demo Quizzes
**File**: `src/data/demoQuizzes.ts`

Create 3 showcase quizzes covering different topics:

1. **JavaScript Fundamentals**
   - 5 questions about basic JS concepts
   - Topics: variables, functions, arrays, objects, closures

2. **React Essentials**
   - 5 questions about React basics
   - Topics: components, props, state, hooks, JSX

3. **TypeScript Basics**
   - 5 questions about TypeScript fundamentals
   - Topics: types, interfaces, generics, type guards

**Structure:**
```typescript
export interface DemoQuiz {
  id: string; // Use special IDs like 'demo-js', 'demo-react', 'demo-ts'
  title: string;
  description: string;
  category: string;
  estimatedTime: string; // e.g., "5 minutes"
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: DemoQuestion[];
}

export interface DemoQuestion {
  id: string;
  question: string;
  options: DemoOption[];
}

export interface DemoOption {
  id: string;
  text: string;
  isCorrect: boolean;
}
```

#### 1.2 Create Demo Quiz Content
- Write high-quality, educational questions
- Ensure proper difficulty distribution
- Add explanations for correct answers (optional enhancement)

---

### Phase 2: Update Landing Page UI

#### 2.1 Add "Try Demo Quizzes" Section
**File**: `src/pages/index.astro`

**Location**: Between "How It Works" and footer

**Components needed:**
- Section heading: "Try It Out - No Sign Up Required"
- Grid of 3 quiz cards
- Each card shows:
  - Quiz icon/badge
  - Title
  - Description (truncated)
  - Difficulty badge
  - Estimated time
  - "Start Quiz" button
  - Tag: "Demo"

**Design considerations:**
- Responsive grid (1 column mobile, 2 tablet, 3 desktop)
- Use semantic Tailwind tokens
- Consistent with existing landing page design
- Clear visual hierarchy

#### 2.2 Create DemoQuizCard Component
**File**: `src/components/DemoQuizCard.astro` or `src/components/DemoQuizCard.tsx`

Reusable card component for displaying demo quizzes.

**Props:**
- quiz: DemoQuiz
- showDemoBadge: boolean

---

### Phase 3: Update Quiz Taking Flow

#### 3.1 Modify Quiz Taking Route
**File**: `src/pages/quizzes/[id]/take.astro`

**Changes:**
1. Check if quiz ID is a demo quiz (starts with 'demo-')
2. If demo quiz:
   - Load quiz data from `demoQuizzes.ts`
   - Pass `isDemo: true` flag to component
3. If regular quiz:
   - Load from database (existing behavior)

**Pseudo-code:**
```typescript
const { id } = Astro.params;
const isDemo = id.startsWith('demo-');

let quizData;
if (isDemo) {
  quizData = getDemoQuizById(id);
  if (!quizData) return Astro.redirect('/404');
} else {
  // Existing database fetch logic
}
```

#### 3.2 Update QuizTakingContainer Component
**File**: `src/components/QuizTakingContainer.tsx`

**New Props:**
- `isDemo: boolean` - Indicates if this is a demo quiz
- `isDemoMode: boolean` - Indicates if user is taking demo without auth

**Changes:**

1. **Disable attempt saving for demo mode:**
   ```typescript
   const isDemoMode = isDemo && !user;

   const handleSubmit = async () => {
     if (isDemoMode) {
       // Show results locally, don't save to database
       calculateScoreLocally();
       showDemoCompletionModal();
     } else {
       // Existing save logic
     }
   };
   ```

2. **Add informational banner:**
   - Show at top of quiz for unauthenticated users
   - Message: "You're taking a demo quiz. Sign up to save your progress and create your own quizzes!"
   - Include "Sign Up" CTA button

3. **Add demo completion modal:**
   - Show score/results
   - Highlight what they could do with an account:
     - Save quiz history
     - Track progress over time
     - Create custom quizzes
     - Use AI quiz generation
   - Primary CTA: "Sign Up to Save Your Results"
   - Secondary CTA: "Try Another Demo" or "Return to Home"

#### 3.3 Create Demo Banner Component
**File**: `src/components/DemoBanner.tsx`

Reusable banner to inform users they're in demo mode.

**Features:**
- Dismissible (stores in sessionStorage)
- Prominent but not intrusive
- Clear CTA to sign up

#### 3.4 Create Demo Completion Modal
**File**: `src/components/DemoCompletionModal.tsx`

Modal shown after completing a demo quiz without authentication.

**Content:**
- Congratulations message
- Score display
- Feature highlights (what they get with an account)
- Sign up CTA
- Option to try another demo quiz

---

### Phase 4: Update Routing & Middleware

#### 4.1 Update Middleware
**File**: `src/middleware/index.ts`

**Changes:**
- Allow `/quizzes/demo-*/take` routes without authentication
- All other quiz routes require auth

```typescript
const isDemoQuizRoute = url.pathname.match(/\/quizzes\/demo-[^/]+\/take$/);

if (isDemoQuizRoute) {
  // Allow without auth
  return next();
}
```

---

### Phase 5: Add Analytics & Tracking (Optional)

#### 5.1 Track Demo Quiz Usage
**File**: `src/lib/analytics.ts` (create if doesn't exist)

Track events:
- Demo quiz started
- Demo quiz completed
- Sign up CTA clicked from demo
- Which demo quiz is most popular

**Purpose**: Understand conversion funnel and optimize demos

---

### Phase 6: Update Database Logic

#### 6.1 Prevent Demo Quiz Attempts from Being Saved
**File**: `src/pages/api/quizzes/[id]/attempts.ts`

**Changes:**
```typescript
// In POST handler
const { id } = Astro.params;

if (id.startsWith('demo-')) {
  return new Response(
    JSON.stringify({
      error: 'Cannot save attempts for demo quizzes'
    }),
    { status: 400 }
  );
}
```

---

## File Structure

New files to create:
```
src/
├── data/
│   └── demoQuizzes.ts              # Demo quiz data
├── components/
│   ├── DemoQuizCard.tsx            # Quiz card for landing page
│   ├── DemoBanner.tsx              # Info banner for demo mode
│   └── DemoCompletionModal.tsx     # Modal after quiz completion
├── lib/
│   └── analytics.ts                # (Optional) Analytics tracking
```

Modified files:
```
src/
├── pages/
│   ├── index.astro                 # Add demo quiz section
│   └── quizzes/
│       └── [id]/
│           └── take.astro          # Handle demo quizzes
├── components/
│   └── QuizTakingContainer.tsx     # Add demo mode support
├── middleware/
│   └── index.ts                    # Allow demo routes
```

---

## UX Considerations

### 1. Clear Communication
- Always inform users when they're in demo mode
- Explain what they're missing without an account
- Make CTAs prominent but not annoying

### 2. Seamless Experience
- Demo quizzes should feel identical to real quizzes
- Only difference is no save functionality
- Smooth transition from demo to sign-up

### 3. Value Proposition
- Show users exactly what they get with an account
- Use demo completion as conversion opportunity
- Highlight key features (AI generation, custom quizzes, progress tracking)

### 4. Accessibility
- All demo components follow ARIA guidelines
- Keyboard navigation support
- Screen reader friendly
- Semantic HTML

---

## Testing Checklist

### Functional Testing
- [ ] Demo quizzes display correctly on landing page
- [ ] Unauthenticated users can take demo quizzes
- [ ] Demo quiz attempts are NOT saved to database
- [ ] Demo banner appears for unauthenticated users
- [ ] Demo completion modal shows after finishing quiz
- [ ] Sign up CTAs work correctly
- [ ] Logged-in users can take demo quizzes (attempts saved)
- [ ] Navigation between demo quizzes works
- [ ] Mobile responsive design

### Edge Cases
- [ ] Invalid demo quiz ID shows 404
- [ ] Cannot create attempt via API for demo quiz
- [ ] Session storage for dismissed banner works
- [ ] Modal can be closed and reopened
- [ ] Browser back button works correctly

### Accessibility Testing
- [ ] Keyboard navigation through demo quiz cards
- [ ] Screen reader announces demo mode
- [ ] Focus management in modal
- [ ] Color contrast meets WCAG AA standards

---

## Success Metrics

### Primary Metrics
- **Conversion Rate**: % of demo users who sign up
- **Demo Completion Rate**: % of users who finish a demo quiz
- **Time to Sign Up**: Average time from demo to registration

### Secondary Metrics
- **Most Popular Demo**: Which demo quiz gets taken most
- **Bounce Rate**: Do demos reduce bounce rate on landing page
- **Engagement**: Average number of demos taken before sign-up

---

## Future Enhancements

### Phase 2 Features (Not in MVP)
1. **Demo Quiz Explanations**
   - Show why answers are correct/incorrect
   - Educational value for users

2. **Demo Quiz Categories**
   - Add more demo quizzes over time
   - Categorize by topic/difficulty

3. **Progress Indicator**
   - Show how far through demo quiz
   - Encourage completion

4. **Social Proof**
   - "Join 1,000+ users who started with this demo"
   - Testimonials near demo section

5. **Demo Quiz Customization**
   - Allow users to preview different question types
   - Showcase AI generation with demo

---

## Implementation Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Create demo quiz data | 2-3 hours |
| Phase 2 | Update landing page UI | 2-3 hours |
| Phase 3 | Update quiz taking flow | 3-4 hours |
| Phase 4 | Update routing/middleware | 1 hour |
| Phase 5 | Analytics (optional) | 1-2 hours |
| Phase 6 | Database logic | 1 hour |
| Testing | All testing checklist items | 2-3 hours |

**Total Estimated Time**: 12-17 hours

---

## Technical Decisions

### Why not use real quizzes from database?
- **Simplicity**: No need for seeding/migration
- **Control**: We control content quality
- **Performance**: No database queries for demos
- **Reliability**: Always available, no data integrity issues

### Why static demo data in TypeScript?
- **Type safety**: Fully typed demo quiz structure
- **Version control**: Demo content versioned with code
- **Easy updates**: Simple to modify demo content
- **No runtime dependencies**: Works even if database is down

### Why separate demo completion modal?
- **Conversion focus**: Optimized specifically for sign-up conversion
- **A/B testing**: Easy to test different messaging
- **Contextual**: Different message than regular quiz completion

---

## Security Considerations

1. **No sensitive data**: Demo quizzes contain only educational content
2. **No database writes**: Unauthenticated users cannot create database records
3. **Rate limiting**: Consider rate limiting demo quiz access (future)
4. **Input validation**: Even though no saves, validate all inputs

---

## Accessibility Guidelines

All components must follow WCAG 2.1 AA standards:

- **Semantic HTML**: Use proper heading hierarchy
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Readers**: Proper ARIA labels and announcements
- **Color Contrast**: Minimum 4.5:1 for normal text
- **Focus Indicators**: Clear focus states for all interactive elements
- **Responsive**: Works on all device sizes
- **Alternative Text**: All images have descriptive alt text

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Demo quiz content reviewed for quality
- [ ] Analytics tracking implemented (if desired)
- [ ] Performance tested (Lighthouse score)
- [ ] Accessibility audit completed
- [ ] Mobile testing on real devices
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Error handling verified
- [ ] Monitoring/logging configured
- [ ] Feature flag ready (optional - for gradual rollout)

---

## Questions to Resolve

1. **Demo Quiz Topics**: Are JavaScript, React, and TypeScript the right topics?
2. **Number of Questions**: 5 questions per demo, or should we vary?
3. **Difficulty**: Should all be beginner, or mix difficulties?
4. **Explanations**: Should demo quizzes include answer explanations?
5. **Branding**: Should demos have special visual treatment?
6. **Analytics**: Which events are most important to track?

---

## Dependencies

- Tailwind CSS 4 (existing)
- React 19 (existing)
- Astro 5 (existing)
- Shadcn/ui components (existing)
- No new external dependencies required

---

## Rollback Plan

If issues arise after deployment:

1. **Quick rollback**: Remove demo section from landing page
2. **Middleware revert**: Remove demo route allowances
3. **Feature flag**: Disable demo quizzes without code change
4. **Database**: No schema changes, so no migration rollback needed

---

## Notes

- This approach prioritizes MVP simplicity over full public quiz discovery
- Focuses on conversion: getting visitors to sign up
- Demo quizzes serve as both product showcase and value demonstration
- Can be expanded to full public quiz system later if needed
