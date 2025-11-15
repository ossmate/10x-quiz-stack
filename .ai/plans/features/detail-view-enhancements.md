# Feature Plan: Quiz Detail View Enhancements

## 1. Overview

This document outlines enhancements to the existing Quiz Detail View to improve user experience when reviewing quiz questions and answers. The enhancements include:

1. **Per-Question Correct Answers Toggle**: Each question has its own toggle control (when expanded) that allows users to show/hide correct answer indicators for that specific question only
2. **Accordion-based Question Display**: Converting the current always-visible question cards into an accordion pattern where questions are collapsed by default and can be expanded individually

These changes will provide a cleaner, more focused interface for reviewing quizzes and allow users to test themselves question-by-question before revealing answers.

## 2. User Stories

### US-ENHANCE-001: Toggle Correct Answers Visibility Per Question

**Title:** Show/Hide Correct Answers for Individual Questions

**Description:** As a quiz owner reviewing my quiz, I want to toggle the visibility of correct answer indicators for each question independently so that I can test myself on one question at a time before revealing the answer.

**Acceptance Criteria:**
- Each question (when expanded) has its own toggle control within the accordion content
- Toggle has two states: "Show Answer" and "Hide Answer"
- Default state is "Hide Answer" (correct answer indicators hidden when question is first expanded)
- When toggled to "Show Answer", correct answer indicators appear only for that specific question
- Toggle state is independent for each question (showing answers for Q1 doesn't affect Q2)
- Toggle state resets when question is collapsed and re-expanded (always starts hidden)
- Toggle is only visible to quiz owners (public viewers never see correct answers or the toggle)
- Toggle includes clear visual feedback (e.g., eye icon, button style change)
- Toggle is keyboard accessible (Space/Enter to activate)
- Toggle is positioned prominently within the question content area

### US-ENHANCE-002: Accordion-based Question Display

**Title:** Collapsible Question View

**Description:** As a user viewing a quiz, I want questions to be collapsed by default so that I can see an overview of all questions and expand only the ones I want to review in detail.

**Acceptance Criteria:**
- All questions are displayed in an accordion component
- By default, all questions are collapsed (closed state)
- Collapsed state shows: question number and question text only
- Expanded state shows: question text, all answer options, and optional explanation
- User can expand/collapse individual questions by clicking anywhere on the question header
- Visual indicator (chevron icon) shows whether question is expanded or collapsed
- Accordion supports multiple questions being open simultaneously
- Smooth expand/collapse animation for better UX
- Keyboard navigation supported (Tab to navigate, Space/Enter to toggle)
- Screen readers announce expand/collapse state changes
- Current expansion state does not persist across page reloads

## 3. Component Changes

### 3.1 Modified Component: QuizQuestions

**File:** `src/components/quiz-detail/QuizQuestions.tsx`

**Changes Required:**
1. Replace ordered list (`<ol>`) with Accordion component from shadcn/ui
2. Map questions to AccordionItem components
3. Pass `isOwner` prop to each QuestionCard
4. No global state needed (each question manages its own toggle state)

**Updated Props:**
```typescript
interface QuizQuestionsProps {
  questions: QuestionWithOptionsDTO[];
  isOwner: boolean; // NEW: passed down to QuestionCard for toggle visibility
  className?: string;
}
```

**Component Structure:**
```tsx
<div className="questions-container">
  <Accordion type="multiple" className="questions-accordion">
    {questions.map((question, index) => (
      <AccordionItem key={question.id} value={question.id}>
        <QuestionCard
          question={question}
          questionNumber={index + 1}
          isOwner={isOwner}
        />
      </AccordionItem>
    ))}
  </Accordion>
</div>
```

---

### 3.2 Modified Component: QuestionCard

**File:** `src/components/quiz-detail/QuestionCard.tsx`

**Changes Required:**
1. Remove Card wrapper (now handled by AccordionItem)
2. Split into two sections: AccordionTrigger (header) and AccordionContent (details)
3. Add local state: `const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)`
4. AccordionTrigger shows question number and text only
5. AccordionContent shows toggle button (if owner), options list, and optional explanation
6. Toggle button allows user to show/hide correct answers for this question only
7. Remove internal expand/collapse for explanation (now part of main accordion)

**Updated Props:**
```typescript
interface QuestionCardProps {
  question: QuestionWithOptionsDTO;
  questionNumber: number;
  isOwner: boolean; // NEW: determines if toggle button is visible
  className?: string;
}
```

**New State:**
```typescript
const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
```

**Component Structure:**
```tsx
<>
  <AccordionTrigger className="question-header">
    <div className="flex items-start gap-3 text-left w-full">
      <span className="question-number">Q{questionNumber}</span>
      <span className="question-text">{question.content}</span>
    </div>
  </AccordionTrigger>

  <AccordionContent className="question-details">
    {isOwner && (
      <div className="answer-toggle-container">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
          className="mb-4"
        >
          {showCorrectAnswers ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Hide Answer
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Show Answer
            </>
          )}
        </Button>
      </div>
    )}

    <OptionsList
      options={question.options}
      showCorrectAnswers={showCorrectAnswers}
    />

    {question.explanation && (
      <div className="explanation-section">
        <h4>Explanation</h4>
        <p>{question.explanation}</p>
      </div>
    )}
  </AccordionContent>
</>
```

**Visual Design (Collapsed):**
```
┌────────────────────────────────────────────────┐
│ Q1  What is the capital of France?         ▼  │
└────────────────────────────────────────────────┘
```

**Visual Design (Expanded - Answers Hidden):**
```
┌────────────────────────────────────────────────┐
│ Q1  What is the capital of France?         ▲  │
│                                                │
│  [ 👁️ Show Answer ]                           │
│                                                │
│  A. London                                     │
│  B. Paris                                      │
│  C. Berlin                                     │
│  D. Madrid                                     │
│                                                │
│  Explanation:                                  │
│  Paris is the capital and largest city of     │
│  France.                                       │
└────────────────────────────────────────────────┘
```

**Visual Design (Expanded - Answers Shown):**
```
┌────────────────────────────────────────────────┐
│ Q1  What is the capital of France?         ▲  │
│                                                │
│  [ 🚫 Hide Answer ]                            │
│                                                │
│  A. London                                     │
│  B. Paris                              ✓       │
│  C. Berlin                                     │
│  D. Madrid                                     │
│                                                │
│  Explanation:                                  │
│  Paris is the capital and largest city of     │
│  France.                                       │
└────────────────────────────────────────────────┘
```

---

### 3.3 Modified Component: OptionsList

**File:** `src/components/quiz-detail/OptionsList.tsx`

**Changes Required:**
- No structural changes needed
- Already receives `showCorrectAnswers` prop
- Ensure proper spacing within accordion content

**Current Props (no changes):**
```typescript
interface OptionsListProps {
  options: OptionDTO[];
  showCorrectAnswers: boolean;
}
```

---

### 3.4 Modified Component: OptionItem

**File:** `src/components/quiz-detail/OptionItem.tsx`

**Changes Required:**
- No structural changes needed
- Already handles conditional rendering of correct indicator based on `showCorrectAnswers`
- Ensure styling works within accordion context

**Current Props (no changes):**
```typescript
interface OptionItemProps {
  option: OptionDTO;
  showCorrectAnswers: boolean;
  optionLetter: string;
}
```

## 4. State Management

### 4.1 Per-Question State: showCorrectAnswers

**Location:** QuestionCard component (local state for each question instance)

**Type:** `boolean`

**Default Value:** `false` (answers hidden by default when question is expanded)

**Scope:** Component instance-level state (each question has its own independent state)

**State Behavior:**
- Each QuestionCard maintains its own `showCorrectAnswers` state
- State is initialized to `false` when component mounts
- State persists only while question remains expanded
- When question is collapsed and re-expanded, state resets to `false` (answers hidden again)
- Changing state in one question does not affect other questions

**State Flow:**
1. User expands question → QuestionCard mounts with `showCorrectAnswers = false`
2. User sees "Show Answer" button (if owner)
3. User clicks button → `setShowCorrectAnswers(true)`
4. Correct answer indicators become visible for this question only
5. User clicks button again → `setShowCorrectAnswers(false)`
6. Indicators hidden again
7. User collapses question → Component unmounts, state is lost
8. User re-expands same question → New component instance, `showCorrectAnswers = false` again

### 4.2 Accordion State

**Location:** Managed by shadcn/ui Accordion component

**Type:** `string[]` (array of open accordion item IDs when `type="multiple"`)

**Default Value:** `[]` (all questions collapsed)

**Behavior:**
- `type="multiple"` allows multiple questions to be open simultaneously
- User can expand/collapse questions independently
- State managed internally by Accordion component
- No persistence required

## 5. User Interactions

### 5.1 Expand Question

**User Action:** User clicks on a collapsed question header

**Expected Outcome:**
1. Chevron icon rotates from down (▼) to up (▲)
2. Question smoothly expands with animation (200-300ms)
3. Toggle button appears at top (if user is owner)
4. Answer options become visible (without correct answer indicators - default hidden)
5. If explanation exists, it's also visible

**Accessibility:**
- AccordionTrigger has `aria-expanded="false"` changing to `aria-expanded="true"`
- Screen reader announces: "Question 1, What is the capital of France?, button, collapsed" → "expanded"
- Focus remains on trigger after activation
- Keyboard navigation: Tab moves focus, Space/Enter toggles expansion

---

### 5.2 Toggle Correct Answer for Individual Question

**User Action:** User (owner) clicks the "Show Answer" button within an expanded question

**Expected Outcome:**
1. Button text changes from "Show Answer" to "Hide Answer"
2. Icon changes from Eye to EyeOff
3. Correct answer indicators (✓) appear next to correct option(s) for this question only
4. Other questions remain unaffected (if expanded, their answer visibility stays the same)
5. Visual feedback: smooth fade-in animation for checkmark icons

**Accessibility:**
- Button announced to screen readers: "Show Answer, button" / "Hide Answer, button"
- Keyboard activation via Space or Enter key
- Focus visible on button
- State change announced: "Correct answer visible" / "Correct answer hidden"
- Button has proper aria-label describing its current state

---

### 5.3 Collapse Question

**User Action:** User clicks on an expanded question header

**Expected Outcome:**
1. Chevron icon rotates from up (▲) to down (▼)
2. Question smoothly collapses with animation
3. Only question number and text remain visible
4. Answer options, toggle button, and explanation hidden
5. Question's `showCorrectAnswers` state is reset (next time it expands, answers will be hidden again)

**Accessibility:**
- `aria-expanded` changes to "false"
- Screen reader announces: "collapsed"
- Focus remains on trigger

---

### 5.4 Navigate Questions via Keyboard

**User Action:** User uses Tab/Shift+Tab to navigate between questions and toggle buttons

**Expected Outcome:**
1. Focus moves to next/previous interactive element (question trigger or toggle button)
2. Focused element has visible focus indicator
3. Space/Enter key activates the focused element (expands/collapses or toggles answer)
4. Tab from expanded question's toggle button moves to next question trigger

**Accessibility:**
- Proper focus management with visible focus rings
- Focus does not get trapped inside accordion content
- Screen reader announces element type and state when focused
- Logical tab order: question trigger → (if expanded: toggle button) → next question trigger

---

### 5.5 Self-Testing Workflow (Question-by-Question)

**User Action:** Owner opens quiz and wants to test themselves on each question before revealing answers

**Expected Outcome:**
1. User expands Question 1 → Answer hidden by default
2. User reads question and thinks of answer
3. User clicks "Show Answer" → Correct answer revealed for Q1 only
4. User verifies their mental answer
5. User expands Question 2 → Answer hidden by default (independent of Q1 state)
6. User repeats process for each question
7. User can choose to hide answer again and retry mentally

**Use Case:** Self-testing workflow supported by:
- Default hidden state for each question
- Per-question toggle (doesn't reveal all answers at once)
- State reset when collapsing/expanding (can retry same question later)

## 6. Visual Design Specifications

### 6.1 Show/Hide Answer Button (Per Question)

**Layout:**
- Position: Top of AccordionContent, before options list
- Display: Inline button (not full width)
- Size: Small (`size="sm"` from shadcn/ui Button)
- Margin bottom: `mb-4` for spacing from options

**Elements:**
- Left: Icon (Eye or EyeOff, 16x16px)
- Center: Button text ("Show Answer" or "Hide Answer")

**States:**
- **Default (Hidden)**: Eye icon, "Show Answer" text, `variant="outline"`
- **Active (Shown)**: EyeOff icon, "Hide Answer" text, `variant="outline"`
- **Hover**: Subtle background change
- **Focus**: Focus ring visible

**Colors:**
- Use semantic tokens only
- Outline variant: `border-input`, `bg-background`, `hover:bg-accent`
- Icon: `text-muted-foreground` (default), `text-foreground` (hover)
- Focus ring: `ring-ring`

**Visibility:**
- Only rendered when `isOwner === true`
- Not visible to public viewers

---

### 6.2 Accordion Question Header (Collapsed)

**Layout:**
- Full-width clickable area
- Flex layout: question number + text (left), chevron (right)
- Padding: `py-4 px-6`
- Border: bottom border `border-b`

**Elements:**
- Question number badge: `Q1`, `Q2`, etc. (bold, primary color)
- Question text: regular weight, full width
- Chevron icon: `▼` (down) when collapsed

**States:**
- **Default**: Normal background
- **Hover**: Subtle background change (`hover:bg-muted/50`)
- **Focus**: Focus ring visible
- **Active**: Slight press effect

**Colors:**
- Background: `bg-card`
- Text: `text-card-foreground`
- Border: `border-border`
- Chevron: `text-muted-foreground`

---

### 6.3 Accordion Question Content (Expanded)

**Layout:**
- Padding: `px-6 py-4`
- Background: slightly different from header (e.g., `bg-muted/30`)
- Smooth height animation on expand/collapse

**Elements:**
- Options list with proper spacing
- Each option on separate line
- Explanation section with top margin/border

**Animation:**
- Expand: Fade in + slide down (200-300ms, ease-out)
- Collapse: Fade out + slide up (200-300ms, ease-in)

---

### 6.4 Correct Answer Indicator

**Design:**
- Icon: Checkmark (✓) or check-circle icon
- Color: Success green (`text-success` or `text-green-600`)
- Position: Right-aligned on option row
- Size: 16x16px
- Only visible when `showCorrectAnswers === true`

**Animation:**
- Fade in when toggle is activated (150ms)
- Fade out when toggle is deactivated (150ms)

## 7. Accessibility Requirements

### 7.1 Keyboard Navigation

- **Tab/Shift+Tab**: Navigate between interactive elements (toggle, question triggers)
- **Space/Enter**: Activate toggle or expand/collapse question
- **Escape**: Close any expanded questions (optional enhancement)
- All interactive elements must have visible focus indicators

### 7.2 Screen Reader Support

**Show/Hide Answer Button:**
- Announced as: "Show Answer, button" or "Hide Answer, button"
- State changes announced when toggled
- Button has descriptive aria-label if needed

**Accordion Questions:**
- Each trigger announced with: "Question [number], [question text], button, collapsed/expanded"
- `aria-expanded` attribute reflects current state
- `aria-controls` links trigger to content panel

**Correct Answer Indicators:**
- Checkmark icon has `aria-label="Correct answer"`
- Screen readers announce: "Paris, correct answer" when focused

### 7.3 Color Contrast

- All text meets WCAG AA standards (4.5:1 for normal text)
- Correct answer indicators use semantic success color
- Focus indicators have sufficient contrast
- Don't rely solely on color for correct answer indication (use icon too)

### 7.4 Focus Management

- Focus remains on trigger after expanding/collapsing
- Focus does not get trapped inside accordion content
- Skip links available if many questions (optional)

## 8. Implementation Steps

### Step 1: Install/Verify Accordion Component

**Tasks:**
1. Check if Accordion component from shadcn/ui is installed
2. If not, run: `npx shadcn@latest add accordion`
3. Verify Accordion component works in isolation
4. Verify Button component is installed (for toggle button)

**Files:**
- `src/components/ui/accordion.tsx`
- `src/components/ui/button.tsx`

**Validation:**
- Create test page with Accordion component
- Verify expand/collapse functionality
- Check accessibility attributes

---

### Step 2: Modify QuizQuestions Component

**File:** `src/components/quiz-detail/QuizQuestions.tsx`

**Tasks:**
1. Add `isOwner` prop to component interface
2. Import Accordion components from shadcn/ui
3. Replace `<ol>` with Accordion wrapper
4. Map questions to AccordionItem components
5. Pass `isOwner` prop to each QuestionCard
6. Update styling for accordion container
7. Handle empty state (no questions)

**Validation:**
- Test with isOwner=true and isOwner=false
- Verify accordion expand/collapse works
- Test with multiple questions
- Verify empty state still works

---

### Step 3: Modify QuestionCard Component

**File:** `src/components/quiz-detail/QuestionCard.tsx`

**Tasks:**
1. Remove Card component wrapper
2. Update props interface: add `isOwner`, remove `showCorrectAnswers` (now internal state)
3. Add local state: `const [showCorrectAnswers, setShowCorrectAnswers] = useState(false)`
4. Import Button component and Eye/EyeOff icons from lucide-react
5. Split component into AccordionTrigger and AccordionContent sections
6. Move question number and text to trigger
7. In content: Add toggle button (conditional on isOwner) at top
8. Move options list to content (pass `showCorrectAnswers` state)
9. Move explanation to content
10. Add chevron icon to trigger (may be built into AccordionTrigger)
11. Update styling for accordion context
12. Add proper ARIA attributes

**Dependencies:**
- AccordionTrigger, AccordionContent from shadcn/ui
- Button from shadcn/ui
- Eye, EyeOff icons from lucide-react
- react (useState)

**Validation:**
- Test collapsed state (only header visible)
- Test expanded state (toggle button, options, explanation visible)
- Test toggle button interaction (show/hide answers)
- Test that state is independent per question
- Test expand/collapse animation
- Test keyboard interaction (tab to button, space/enter to toggle)
- Verify screen reader announcements

---

### Step 4: Update QuizDetailContent Component

**File:** `src/components/quiz-detail/QuizDetailContent.tsx`

**Tasks:**
1. Pass `isOwner` prop to QuizQuestions component
2. Verify prop drilling is correct
3. No other changes needed

**Validation:**
- Verify isOwner prop reaches QuizQuestions

---

### Step 5: Update Prop Interfaces

**Files:**
- `src/components/quiz-detail/QuizQuestions.tsx`
- `src/components/quiz-detail/QuestionCard.tsx`

**Tasks:**
1. Update TypeScript interfaces for new props
2. Update JSDoc comments if present
3. Ensure type safety across component tree

**Validation:**
- Run TypeScript compiler
- Check for type errors
- Verify prop types match usage

---

### Step 6: Add Styling

**Files:** All modified components

**Tasks:**
1. Use semantic Tailwind tokens (never hardcoded colors)
2. Ensure responsive design (mobile-first)
3. Add hover/focus states for toggle button
4. Add smooth animations for accordion expand/collapse
5. Ensure consistent spacing
6. Test dark mode compatibility (if applicable)

**Key Classes:**
- Toggle button: `variant="outline"`, `size="sm"`, `mb-4`
- Question trigger: `py-4`, `px-6`, `hover:bg-muted/50`
- Question content: `px-6`, `py-4`, `bg-muted/30`
- Correct indicator: `text-success` or custom success color
- Button icons: `mr-2`, `h-4`, `w-4`

**Validation:**
- Visual inspection at multiple breakpoints
- Test hover and focus states on toggle button
- Verify animations are smooth
- Check color contrast ratios
- Test button on mobile (touch target size)

---

### Step 7: Add Icons

**Tasks:**
1. Install lucide-react if not already installed: `npm install lucide-react`
2. Import required icons:
   - `Eye` and `EyeOff` for toggle
   - `Check` or `CheckCircle` for correct answers
   - `ChevronDown` for accordion (may be built into shadcn/ui)
3. Use consistent icon sizes (16x16 or 20x20)
4. Add proper aria-labels to icons

**Validation:**
- Icons render correctly
- Icons are accessible (hidden from screen readers or have labels)
- Icon colors match design spec

---

### Step 8: Add Unit Tests

**File:** `tests/unit/quiz-detail-enhancements.test.tsx`

**Tasks:**
1. Test QuizQuestions with accordion:
   - Accordion renders correctly
   - isOwner prop passed to children
   - Empty state works
2. Test QuestionCard component:
   - Renders collapsed by default
   - Expands on click
   - Toggle button visible only when isOwner=true
   - Toggle button changes state correctly
   - showCorrectAnswers state independent per question
   - Correct indicators show/hide based on toggle state
3. Test keyboard interactions:
   - Tab navigation between questions and toggle buttons
   - Space/Enter activates elements
4. Test state reset on collapse/expand

**Dependencies:**
- Vitest
- React Testing Library
- @testing-library/user-event

**Validation:**
- All tests pass
- Coverage includes new features
- Edge cases covered

---

### Step 9: Add Integration Tests

**File:** `tests/integration/quiz-detail-view.test.ts`

**Tasks:**
1. Test complete user flow:
   - Load quiz as owner
   - Expand question
   - Toggle correct answers on/off for that question
   - Expand another question, verify answers hidden by default
   - Toggle second question's answers independently
   - Collapse and re-expand question, verify answer state resets
2. Test as non-owner:
   - Verify toggle button not visible
   - Verify correct answers never shown
3. Test with multiple questions
4. Test with questions with/without explanations
5. Test self-testing workflow

**Validation:**
- Integration tests pass
- Real user scenarios covered
- No regression in existing functionality

---

### Step 10: Add Accessibility Tests

**File:** `tests/accessibility/quiz-detail-accessibility.test.ts`

**Tasks:**
1. Run axe-core automated tests
2. Test keyboard navigation flow
3. Test screen reader announcements (via testing-library)
4. Verify ARIA attributes correct
5. Test focus management
6. Verify color contrast

**Dependencies:**
- jest-axe or vitest-axe
- @testing-library/react

**Validation:**
- No accessibility violations
- Keyboard navigation works completely
- ARIA attributes present and correct

---

### Step 11: Add E2E Tests

**File:** `tests/e2e/quiz-detail-enhancements.spec.ts`

**Tasks:**
1. Test in real browser (Playwright)
2. Test per-question toggle button interaction
3. Test accordion expand/collapse
4. Test visual appearance of correct indicators
5. Test that answer visibility is independent per question
6. Test responsive design
7. Test across browsers (Chrome, Firefox, Safari)

**Dependencies:**
- Playwright

**Validation:**
- E2E tests pass in all browsers
- Visual regressions caught
- Real interaction flows work
- Per-question state management verified

---

### Step 12: Update Documentation

**File:** `docs/quiz-detail-view.md`

**Tasks:**
1. Document per-question toggle feature
2. Document accordion behavior
3. Update component architecture diagram
4. Add usage examples for self-testing workflow
5. Document accessibility features
6. Document state management (per-question, reset on collapse)
7. Update troubleshooting guide

**Validation:**
- Documentation accurate
- Examples clear
- All new features documented
- Per-question behavior explained

---

### Step 13: Manual Testing

**Tasks:**
1. Test as quiz owner:
   - Expand question, verify answer hidden by default
   - Toggle answer on/off for one question
   - Expand second question, verify answer hidden (independent state)
   - Toggle second question's answer
   - Collapse and re-expand, verify answer resets to hidden
   - Test with quiz with many questions (20+)
   - Test with quiz with few questions (1-3)
2. Test as non-owner (public viewer):
   - Verify toggle button not visible
   - Verify correct answers never shown
3. Test edge cases:
   - Quiz with no questions
   - Questions with no options
   - Questions with no explanation
   - Questions with multiple correct answers
4. Test accessibility:
   - Keyboard navigation only (Tab to toggle button, Space/Enter to activate)
   - Screen reader testing (NVDA/JAWS/VoiceOver)
   - Verify button state announced correctly
5. Test responsive design:
   - Mobile (320px-640px) - ensure button doesn't overflow
   - Tablet (641px-1024px)
   - Desktop (1025px+)
6. Cross-browser testing:
   - Chrome, Firefox, Safari, Edge

**Validation:**
- Checklist completed
- All scenarios work as expected
- Per-question state verified
- State reset verified
- No bugs found

---

### Step 14: Code Review and Refinement

**Tasks:**
1. Self-review code for quality
2. Check for hardcoded colors (use semantic tokens only)
3. Verify error handling
4. Check for performance issues
5. Ensure code follows project conventions
6. Request peer review

**Validation:**
- Code review approved
- No issues found
- Ready for deployment

---

**Implementation Complete** ✅

## 9. Benefits and User Impact

### 9.1 Improved User Experience

**Before:**
- All questions always visible (information overload)
- Correct answers always visible for owners (can't self-test)
- No quick overview of all questions

**After:**
- Clean, scannable question list
- Self-testing capability with toggle
- Progressive disclosure (expand only what you need)

### 9.2 Better Learning Experience

- Users can attempt to answer mentally before revealing answers (per-question control)
- Question-by-question reveal supports effective self-testing methodology
- Accordion allows focus on one question at a time
- State reset on collapse/expand allows retrying same question
- Less cognitive load with collapsed questions
- Natural learning flow: expand → read → think → reveal → verify

### 9.3 Accessibility Improvements

- Better keyboard navigation
- Clearer focus management
- Progressive disclosure helps screen reader users
- Reduced cognitive complexity

### 9.4 Mobile Experience

- Collapsed questions save vertical space
- Easier to scroll through long quizzes
- Touch targets properly sized

## 10. Future Enhancements (Out of Scope)

### 10.1 Persist Answer Visibility State

**Description:** Save each question's answer visibility state to localStorage/sessionStorage

**Benefits:** User can navigate away and return without losing which answers they've revealed

**Note:** Currently state resets on collapse/expand, which supports retrying but may frustrate users who want persistence

### 10.2 Global "Show All Answers" Option

**Description:** Add a global toggle at the top that reveals answers for all questions at once (in addition to per-question toggles)

**Benefits:** Faster for users who want to review all answers without clicking each question

**Note:** This would complement, not replace, the per-question toggles

### 10.3 Expand All / Collapse All

**Description:** Buttons to expand or collapse all questions at once

**Benefits:** Faster navigation for power users, especially with long quizzes

### 10.4 Keyboard Shortcuts

**Description:** Hotkeys for common actions (e.g., `Cmd+E` to expand all, `Cmd+Shift+A` to toggle current question's answer)

**Benefits:** Improved efficiency for keyboard users

### 10.5 Progress Indicator

**Description:** Show which questions user has expanded/reviewed or revealed answers for

**Benefits:** Track progress through quiz review session

### 10.6 Smooth Scroll to Question

**Description:** Clicking question in a table of contents scrolls smoothly to that question

**Benefits:** Better navigation in very long quizzes (20+ questions)

## 11. Technical Considerations

### 11.1 Performance

**Accordion Rendering:**
- Collapsed questions: Only trigger rendered, content not mounted (React optimization)
- Expected performance: Negligible impact even with 50+ questions
- Accordion component from shadcn/ui uses proper React patterns

**State Management:**
- Per-component local state only, no global state needed
- Each QuestionCard maintains its own `showCorrectAnswers` state
- Re-renders limited to individual QuestionCard when toggle clicked
- State naturally resets when component unmounts (accordion collapses)
- No performance concerns expected
- Scales well with large number of questions (only expanded questions hold state)

### 11.2 Bundle Size

**New Dependencies:**
- Accordion component: ~2-3KB (already in shadcn/ui)
- Button component: ~1KB (already in shadcn/ui)
- Icons (Eye, EyeOff, Check): ~1KB per icon (tree-shaken if using lucide-react)

**Total Impact:** ~4-5KB gzipped (negligible)

### 11.3 Browser Compatibility

**Required Features:**
- CSS animations (widely supported)
- Flexbox (widely supported)
- ARIA attributes (widely supported)

**Target Support:** All modern browsers (Chrome, Firefox, Safari, Edge)

**Testing:** Cross-browser testing required (see Step 14)

### 11.4 SEO Impact

**Considerations:**
- Accordion content is in DOM (not dynamically loaded)
- Search engines can crawl collapsed content
- No negative SEO impact expected

## 12. Success Metrics

**User Engagement:**
- % of quiz owners who interact with per-question toggle buttons
- % of users who expand questions
- Average number of questions expanded per visit
- Average number of answer reveals (toggle clicks) per quiz view

**Usability:**
- Reduced time to find specific question (via accordion)
- Increased engagement with quiz review
- Positive user feedback on per-question answer reveal
- Self-testing workflow adoption rate

**Learning Effectiveness:**
- Users spend more time thinking before revealing answers
- Increased question-by-question review (vs. seeing all answers at once)

**Accessibility:**
- Zero accessibility violations in automated tests
- Successful screen reader testing
- Successful keyboard-only navigation testing

**Performance:**
- No measurable performance degradation
- Lighthouse score maintained or improved

---

## 13. Appendix

### 13.1 Shadcn/ui Accordion API Reference

**Component:** `Accordion`

**Props:**
- `type`: `"single"` | `"multiple"` (use "multiple" for this feature)
- `collapsible`: boolean (for "single" type only)
- `defaultValue`: string | string[] (default open items)

**Component:** `AccordionItem`

**Props:**
- `value`: string (unique identifier for item)

**Component:** `AccordionTrigger`

**Description:** Clickable header that toggles accordion item

**Component:** `AccordionContent`

**Description:** Collapsible content panel

### 13.2 Shadcn/ui Button API Reference

**Component:** `Button`

**Props:**
- `variant`: `"default"` | `"outline"` | `"ghost"` | `"link"` | `"destructive"` | `"secondary"`
- `size`: `"default"` | `"sm"` | `"lg"` | `"icon"`
- `onClick`: () => void
- `disabled`: boolean
- `aria-label`: string (optional)

**Usage for Toggle Button:**
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowCorrectAnswers(!showCorrectAnswers)}
>
  {showCorrectAnswers ? (
    <><EyeOff className="mr-2 h-4 w-4" />Hide Answer</>
  ) : (
    <><Eye className="mr-2 h-4 w-4" />Show Answer</>
  )}
</Button>
```

### 13.3 Icon Reference

**lucide-react icons used:**
- `Eye`: Show answers state
- `EyeOff`: Hide answers state
- `Check` or `CheckCircle2`: Correct answer indicator
- `ChevronDown`: Accordion chevron (may be built-in)

**Usage:**
```tsx
import { Eye, EyeOff, Check, ChevronDown } from "lucide-react";
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-31
**Status:** Ready for Implementation
