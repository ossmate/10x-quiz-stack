# Feature Plan: Quiz Edit Accordion & Auto-Scroll

## 1. Overview

This feature enhances the quiz editing experience by implementing an accordion UI for questions, where each question is collapsed by default to reduce visual clutter. When adding a new question, the interface automatically scrolls to and opens the newly added question for immediate editing.

## 2. Business Requirements

### User Experience Goals
- **Reduced Clutter:** Questions are collapsed by default, showing only the question number and text in the header
- **Easy Navigation:** Users can expand/collapse individual questions by clicking headers
- **Smooth Onboarding:** Newly added questions automatically open and scroll into view
- **Focus Management:** Visual highlighting helps users identify the active question
- **Accessibility:** Full keyboard navigation support for accordion controls

### Benefits
- Improved editing experience for quizzes with many questions
- Reduced scrolling and cognitive load
- Faster question creation workflow
- Better visual organization of quiz content

## 3. Technical Implementation

### 3.1 Component Architecture

#### Accordion Integration
- Uses Radix UI's Accordion primitive via shadcn/ui
- Type: `"multiple"` - allows multiple questions to be open simultaneously
- Controlled component with `value` and `onValueChange` props

#### State Management
```typescript
// Tracks which question accordions are currently open
const [openIds, setOpenIds] = useState<string[]>([]);

// Tracks the newly added question for highlighting and scrolling
const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null);
```

#### Question References
```typescript
// Map to store DOM references for smooth scrolling
const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
```

### 3.2 Auto-Scroll Behavior

#### Scroll Effect Hook
```typescript
useEffect(() => {
  if (highlightedQuestionId) {
    // 1. Open accordion for that question first
    setOpenIds([highlightedQuestionId]);

    // 2. Wait for accordion animation before scrolling (150ms delay)
    const scrollTimer = setTimeout(() => {
      const el = questionRefs.current.get(highlightedQuestionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    // 3. Clear highlight after 2 seconds
    const highlightTimer = setTimeout(() => {
      setHighlightedQuestionId(null);
    }, 2000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(highlightTimer);
    };
  }
}, [highlightedQuestionId]);
```

#### Add Question Flow
```typescript
const addQuestion = () => {
  const newQuestionId = `new-question-${crypto.randomUUID()}`;

  // Create and add question to state...

  // Trigger highlight - useEffect will handle scrolling and accordion opening
  setHighlightedQuestionId(newQuestionId);
};
```

### 3.3 UI Components

#### Accordion Trigger (Header)
```tsx
<AccordionTrigger className="px-5 py-4">
  <div className="flex items-center gap-3 flex-1 min-w-0">
    <span className="bg-primary/10 text-primary font-semibold rounded-full w-8 h-8 flex items-center justify-center text-sm shrink-0">
      {questionIndex + 1}
    </span>
    <span className="text-base font-medium text-foreground truncate">
      {question.content || `Question ${questionIndex + 1}`}
    </span>
  </div>
</AccordionTrigger>
```

**Key Features:**
- Shows question number in a circular badge
- Displays truncated question content (prevents overflow)
- Chevron icon rotates when expanded (built into AccordionTrigger)
- Full keyboard accessibility (Enter/Space to toggle)

#### Accordion Content
```tsx
<AccordionContent className="px-5 pb-6">
  {/* Remove question button */}
  <div className="flex justify-end mb-4">
    <button onClick={() => removeQuestion(question.id)}>Remove</button>
  </div>

  {/* Question content textarea */}
  {/* Options list */}
  {/* Explanation textarea */}
</AccordionContent>
```

**Key Features:**
- Animated expand/collapse with Radix UI transitions
- All existing editing controls preserved
- Remove button moved inside accordion content
- Consistent padding and spacing

### 3.4 Visual Feedback

#### Highlighting
```tsx
className={`border rounded-lg transition-shadow ${
  isHighlighted ? "shadow-lg shadow-primary/20" : ""
}`}
```

- Newly added questions receive a subtle shadow glow
- Highlight persists for 2 seconds
- Provides visual confirmation of the action

#### Text Truncation
```css
/* Applied to question content in header */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- Prevents long question text from breaking layout
- Shows ellipsis (...) for truncated content
- Full text visible when accordion is expanded

## 4. Files Modified

### Primary Component
- **`src/components/quizzes/EditableQuizContent.tsx`**
  - Added Accordion imports from `@/components/ui/accordion`
  - Added `openIds` state for accordion control
  - Added scroll effect `useEffect` hook
  - Simplified `addQuestion()` to trigger highlight only
  - Wrapped questions list with `<Accordion>` component
  - Updated question rendering to use `AccordionItem`, `AccordionTrigger`, `AccordionContent`
  - Fixed HTML structure for proper div nesting
  - Added text truncation to question headers

### Existing UI Components (No Changes Required)
- **`src/components/ui/accordion.tsx`** - Already exists via shadcn/ui
  - Uses Radix UI Accordion primitive
  - Pre-configured with Tailwind classes
  - Supports keyboard navigation (Tab, Enter, Space, Arrow keys)

## 5. Implementation Details

### 5.1 Timing and Animation

| Event | Delay | Purpose |
|-------|-------|---------|
| Accordion open | 0ms | Immediate feedback |
| Scroll trigger | 150ms | Wait for accordion animation |
| Highlight clear | 2000ms | Remove visual emphasis |

### 5.2 Scroll Behavior

```javascript
el.scrollIntoView({
  behavior: "smooth",  // Animated scroll
  block: "center"      // Position in viewport center
})
```

- Smooth animated scrolling
- Centers the question in the viewport
- Non-blocking (doesn't prevent other interactions)

### 5.3 Accessibility Features

#### Keyboard Navigation
- **Tab:** Navigate between accordion triggers
- **Enter/Space:** Toggle accordion open/closed
- **Arrow Keys:** Navigate between accordion items (Radix behavior)

#### ARIA Attributes (Handled by Radix)
- `aria-expanded`: Indicates accordion state
- `aria-controls`: Links trigger to content
- `role="button"`: Semantic role for triggers

#### Screen Reader Support
- Question number and content announced
- Expanded/collapsed state communicated
- All form controls remain accessible

## 6. Edge Cases Handled

### Empty Questions
- Shows placeholder text: `Question ${questionIndex + 1}`
- Prevents empty accordion headers

### Long Question Text
- Truncated with ellipsis in header
- Full text visible when expanded
- No layout breaking

### Multiple Add Actions
- Each new question opens exclusively (previous closes)
- Smooth transition between highlights
- Timeout cleanup prevents memory leaks

### Rapid Clicking
- State updates batched by React
- Smooth scrolling queues properly
- No visual glitches

## 7. Browser Compatibility

### Tested & Supported
- Chrome/Edge (Chromium) - Full support
- Firefox - Full support
- Safari - Full support
- Mobile browsers - Touch-friendly accordion triggers

### Polyfills Not Required
- `scrollIntoView` with `behavior: "smooth"` is widely supported
- Radix UI handles browser inconsistencies
- Tailwind animations use standard CSS

## 8. Performance Considerations

### Optimizations
- **Ref Map:** Efficient O(1) lookup for DOM elements
- **Controlled Component:** Minimal re-renders
- **useCallback:** Memoized event handlers (existing)
- **Timeout Cleanup:** Prevents memory leaks

### Performance Impact
- Negligible overhead for accordion state
- Smooth animations via CSS (GPU-accelerated)
- No performance degradation for large quizzes

## 9. Future Enhancements

### Potential Improvements
- **Expand All/Collapse All:** Bulk controls for large quizzes
- **Search/Filter:** Find questions by content
- **Drag-and-Drop Reordering:** With accordion headers as handles
- **Keyboard Shortcuts:** Quick question navigation
- **Persistent State:** Remember open/closed state in localStorage
- **Question Preview:** Show first N characters in header dynamically

### Extensibility
- State structure supports multiple open questions
- Easy to add "expand all" functionality:
  ```typescript
  const expandAll = () => {
    const allIds = editableQuiz.questions.map(q => q.id);
    setOpenIds(allIds);
  };
  ```

## 10. Testing Checklist

### Manual Testing
- [x] Questions collapsed by default on page load
- [x] Clicking accordion header toggles open/closed
- [x] Multiple questions can be open simultaneously
- [x] Adding new question opens and scrolls to it
- [x] Highlight effect appears and disappears correctly
- [x] Long question text truncates in header
- [x] All form controls work when accordion is open
- [x] Remove question button accessible
- [x] Validation errors display correctly
- [x] Save functionality unchanged

### Keyboard Testing
- [x] Tab navigation works through accordion triggers
- [x] Enter/Space toggles accordion
- [x] Focus visible on accordion triggers
- [x] All inputs accessible via keyboard

### Accessibility Testing
- [x] Screen reader announces accordion state
- [x] ARIA attributes present and correct
- [x] Focus management appropriate
- [x] Color contrast sufficient

### Regression Testing
- [x] Quiz validation still works
- [x] Save/Cancel buttons functional
- [x] Add/Remove options works
- [x] Sticky footer behavior preserved
- [x] No linter errors introduced

## 11. Known Limitations

### Current Constraints
- Question text in header updates only on next render (acceptable behavior)
- Scroll animation may be interrupted by user scroll (expected browser behavior)
- Highlight effect timing is fixed (could be configurable)

### Non-Issues
- Accordion animations are CSS-based (no JS performance impact)
- Multiple accordions open simultaneously is intentional design
- Question refs are properly cleaned up on unmount

## 12. Code Quality

### Best Practices Applied
- **Separation of Concerns:** Scroll logic in useEffect, state updates in handlers
- **Clean Timeouts:** Proper cleanup in useEffect return
- **Semantic HTML:** Proper div nesting and structure
- **Type Safety:** Full TypeScript coverage
- **Accessibility:** Radix UI handles ARIA attributes
- **Responsive Design:** Works on all screen sizes

### Linting & Formatting
- No ESLint errors
- No TypeScript errors
- Proper indentation and spacing
- Consistent naming conventions

## 13. Documentation

### Code Comments
- Clear explanation of each state variable
- Documented timing values in useEffect
- Inline comments for complex logic

### User-Facing Documentation
- No additional user documentation required
- Behavior is intuitive and self-explanatory
- Follows common accordion UI patterns

## 14. Deployment Notes

### No Migration Required
- Pure UI enhancement
- No database changes
- No API changes
- No environment variables added

### Rollout Strategy
- Can be deployed immediately
- No breaking changes
- Backward compatible
- No feature flags needed

## 15. Success Metrics

### Technical Success
- Zero console errors in production
- No performance degradation
- All linter checks pass
- Full TypeScript type coverage

### User Experience Success
- Reduced scrolling required for quiz editing
- Faster question creation workflow
- Improved visual organization
- Positive user feedback on cleaner interface

## 16. Related Features

### Complementary Features
- **Sticky Footer** (already implemented) - Works seamlessly with accordion
- **Real-time Validation** (already implemented) - Validation errors visible in expanded accordions
- **Question Highlighting** (already implemented) - Enhanced with accordion behavior

### Dependencies
- `@radix-ui/react-accordion` - Already installed via shadcn/ui
- `lucide-react` - For ChevronDownIcon in accordion trigger
- No new dependencies added

## 17. Additional Enhancement: Empty Value Prevention

### 17.1 Problem Statement

Users could accidentally save quizzes with:
- Empty question content
- Empty answer options
- Questions with less than 2 valid answers after removing empty ones

This could cause validation errors at the API level and create a poor user experience.

### 17.2 Solution: Data Sanitization Before Save

#### Validation Enhancement
```typescript
// Count non-empty options (after trimming)
const nonEmptyOptions = question.options?.filter(
  (opt) => opt.content && opt.content.trim().length > 0
) || [];

// Validate non-empty option count
if (nonEmptyOptions.length < 2) {
  questionErrors.content = "Question must have at least 2 non-empty options";
}
```

#### Sanitization Function
```typescript
const sanitizeQuizForSave = (quiz: EditableQuizData): EditableQuizData => {
  return {
    ...quiz,
    questions: quiz.questions
      ?.filter((question) => question.content && question.content.trim().length > 0)
      .map((question) => ({
        ...question,
        // Filter out empty options
        options: question.options
          ?.filter((option) => option.content && option.content.trim().length > 0)
          .map((option, index) => ({
            ...option,
            position: index + 1, // Reindex positions after filtering
          })) || [],
      }))
      .map((question, index) => ({
        ...question,
        position: index + 1, // Reindex question positions
      })) || [],
  };
};
```

### 17.3 Implementation Points

#### EditableQuizContent Component
- **Validation:** Enhanced to check for non-empty options count
- **Sanitization:** Applied before save in `handleSave()`
- **Reindexing:** Positions updated after filtering empty items
- **Error Prevention:** Ensures API validation passes

#### AI Quiz Generation Hook
- **publishQuiz:** Added sanitization before API call
- **Trim Content:** All content trimmed (title, description, questions, options)
- **Filter Logic:** Removes empty questions and options
- **Position Reindexing:** Maintains correct ordering
- **Validation:** Ensures at least 1 valid question with 2+ options remains

### 17.4 Files Modified

1. **`src/components/quizzes/EditableQuizContent.tsx`**
   - Added `sanitizeQuizForSave()` function
   - Enhanced validation to count non-empty options
   - Applied sanitization in `handleSave()`

2. **`src/components/hooks/useAIQuizGeneration.ts`**
   - Added sanitization in `publishQuiz()`
   - Filters empty questions and options
   - Validates sanitized data before API call
   - Reindexes positions after filtering

### 17.5 Benefits

- **Prevents API Errors:** Invalid data filtered before submission
- **Better UX:** Clear validation messages guide users
- **Data Integrity:** Only valid content saved to database
- **Consistent Behavior:** Same sanitization for manual and AI quizzes
- **Automatic Cleanup:** Users don't need to manually remove empty items

### 17.6 Edge Cases Handled

1. **All Options Empty:** Validation error prevents save
2. **Some Options Empty:** Empty ones filtered, valid ones kept
3. **Question Empty:** Question filtered out, positions reindexed
4. **Multiple Empty Items:** All filtered simultaneously
5. **Whitespace Only:** Treated as empty via `.trim()`
6. **Placeholder Text:** Default placeholders rejected ("New question", "Option 1", "Option 2", "New option")

### 17.7 Placeholder Validation

To prevent users from saving questions/options with default placeholder text, the system validates against these patterns:

**Question Placeholders:**
- `"New question"` - Default text for newly added questions

**Option Placeholders:**
- `"Option 1"`, `"Option 2"`, etc. - Initial default options
- `"New option"` - Text for additionally added options

**Validation Messages:**
- Question: "Please edit the question text (default placeholder is not allowed)"
- Option: "Please edit the option text (default placeholder is not allowed)"

**Sanitization:**
- Placeholder text is filtered out during save along with empty content
- Regex pattern: `/^(Option \d+|New option)$/i` (case-insensitive)

## 18. Conclusion

This feature successfully implements:
1. **Accordion UI** for quiz question editing with automatic scrolling to newly added questions
2. **Empty Value Prevention** with data sanitization before saving

The implementation is clean, performant, accessible, and maintains all existing functionality while significantly improving:
- User experience for editing quizzes with multiple questions
- Data quality by preventing empty content from being saved
- API reliability by ensuring valid data is always submitted

The solution is production-ready with no known issues or regressions.
