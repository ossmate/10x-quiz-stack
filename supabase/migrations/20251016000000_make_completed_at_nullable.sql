-- Migration: Make completed_at nullable in quiz_attempts table
-- Purpose: Allow quiz attempts to be created without a completion timestamp,
--          which should only be set when the quiz is actually submitted/completed.
-- Affected: quiz_attempts.completed_at column
-- Impact: This is a non-breaking change that enables proper quiz attempt lifecycle tracking.

-- Update existing records that have the default timestamp but haven't been completed
-- This cleans up any attempts that were created with the old schema where completed_at
-- was incorrectly set to now() by default.
update quiz_attempts
set completed_at = null
where score = 0 and completed_at is not null;

-- Remove the NOT NULL constraint and default value from completed_at column
-- This allows the column to be null for in-progress attempts
alter table quiz_attempts
  alter column completed_at drop not null,
  alter column completed_at drop default;

-- Document the field's purpose for future reference
comment on column quiz_attempts.completed_at is 'Timestamp when the quiz attempt was completed. NULL indicates an in-progress attempt.';
