-- ============================================================================
-- Add explanation column to questions table
-- ============================================================================
-- Purpose: Add optional explanation field to questions for learning context
-- Table: questions
-- Changes: Add explanation text column (nullable)
-- Date: 2025-11-12
-- ============================================================================

-- Add explanation column to questions table
-- This allows quiz creators to provide context/reasoning for correct answers
-- The explanation will be displayed to learners during quiz-taking (on demand)
-- and in results review to reinforce learning
alter table questions
add column explanation text;

-- Add constraint to limit explanation length (reasonable but generous)
-- Allows for detailed explanations without being excessive
alter table questions
add constraint explanation_length check (
    explanation is null or
    (char_length(explanation) >= 1 and char_length(explanation) <= 2000)
);

-- Add comment for documentation
comment on column questions.explanation is
'Optional explanation providing context or reasoning for the correct answer. Displayed to learners on demand during quiz-taking and in results review.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
