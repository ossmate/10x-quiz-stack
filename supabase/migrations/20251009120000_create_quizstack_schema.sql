-- ============================================================================
-- QuizStack Database Schema Migration
-- ============================================================================
-- Purpose: Create the complete database schema for QuizStack quiz platform
-- Tables: profiles, quizzes, questions, options, quiz_attempts, quiz_responses
-- Features: RLS policies, indexes, enums, triggers, constraints
-- Author: Database Migration System
-- Date: 2025-10-09
-- ============================================================================

-- Create custom enum types for type safety and data integrity
-- These enums ensure consistent values across the application

create type quiz_visibility as enum ('public', 'private');
create type quiz_status as enum ('active', 'archived', 'deleted');
create type quiz_source as enum ('manual', 'ai_generated');
create type question_status as enum ('active', 'deleted');
create type attempt_status as enum ('in_progress', 'completed', 'abandoned');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Extends Supabase auth.users with additional user information
-- Links to auth.users via foreign key for user management

create table profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique not null,
    display_name text,
    avatar_url text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,

    -- Data integrity constraints
    constraint username_length check (char_length(username) >= 3 and char_length(username) <= 50),
    constraint display_name_length check (char_length(display_name) <= 100)
);

-- Enable row level security for profiles table
alter table profiles enable row level security;

-- RLS Policy: Users can view their own profile
create policy "Users can view own profile" on profiles
    for select using (auth.uid() = id);

-- RLS Policy: Users can update their own profile
create policy "Users can update own profile" on profiles
    for update using (auth.uid() = id);

-- RLS Policy: Users can insert their own profile
create policy "Users can insert own profile" on profiles
    for insert with check (auth.uid() = id);

-- ============================================================================
-- QUIZZES TABLE
-- ============================================================================
-- Core entity for quiz management with visibility, status tracking, and AI metadata
-- Supports both manually created and AI-generated quizzes

create table quizzes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    title text not null,
    description text,
    visibility quiz_visibility default 'private' not null,
    status quiz_status default 'active' not null,
    source quiz_source default 'manual' not null,
    ai_model text,
    ai_prompt text,
    ai_temperature decimal(3,2),
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,

    -- Data integrity constraints
    constraint title_length check (char_length(title) >= 1 and char_length(title) <= 200),
    constraint description_length check (char_length(description) <= 1000),
    constraint ai_temperature_range check (ai_temperature >= 0.0 and ai_temperature <= 2.0)
);

-- Enable row level security for quizzes table
alter table quizzes enable row level security;

-- RLS Policy: Users can view their own quizzes
create policy "Users can view own quizzes" on quizzes
    for select using (auth.uid() = user_id);

-- RLS Policy: Authenticated users can view public active quizzes
create policy "Authenticated users can view public quizzes" on quizzes
    for select using (
        auth.role() = 'authenticated' 
        and visibility = 'public' 
        and status = 'active'
    );

-- RLS Policy: Anonymous users can view public active quizzes
create policy "Anonymous users can view public quizzes" on quizzes
    for select using (
        auth.role() = 'anon' 
        and visibility = 'public' 
        and status = 'active'
    );

-- RLS Policy: Users can insert their own quizzes
create policy "Users can insert own quizzes" on quizzes
    for insert with check (auth.uid() = user_id);

-- RLS Policy: Users can update their own quizzes
create policy "Users can update own quizzes" on quizzes
    for update using (auth.uid() = user_id);

-- RLS Policy: Users can delete their own quizzes
create policy "Users can delete own quizzes" on quizzes
    for delete using (auth.uid() = user_id);

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================
-- Questions belonging to quizzes with position tracking and soft deletion
-- Position field maintains question order within each quiz

create table questions (
    id uuid default gen_random_uuid() primary key,
    quiz_id uuid references quizzes(id) on delete cascade not null,
    content text not null,
    explanation text,
    position integer not null,
    status question_status default 'active' not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,

    -- Data integrity constraints
    constraint content_length check (char_length(content) >= 1 and char_length(content) <= 1000),
    constraint explanation_length check (char_length(explanation) <= 2000),
    constraint position_positive check (position > 0),
    
    -- Each quiz can have only one question at each position
    unique(quiz_id, position)
);

-- Enable row level security for questions table
alter table questions enable row level security;

-- RLS Policy: Users can view questions from their own quizzes
create policy "Users can view questions from own quizzes" on questions
    for select using (
        exists (
            select 1 from quizzes q
            where q.id = quiz_id and q.user_id = auth.uid()
        )
    );

-- RLS Policy: Authenticated users can view questions from public active quizzes
create policy "Authenticated users can view questions from public quizzes" on questions
    for select using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from quizzes q
            where q.id = quiz_id 
            and q.visibility = 'public' 
            and q.status = 'active'
        )
    );

-- RLS Policy: Anonymous users can view questions from public active quizzes
create policy "Anonymous users can view questions from public quizzes" on questions
    for select using (
        auth.role() = 'anon' and
        exists (
            select 1 from quizzes q
            where q.id = quiz_id 
            and q.visibility = 'public' 
            and q.status = 'active'
        )
    );

-- RLS Policy: Users can insert questions into their own quizzes
create policy "Users can insert questions into own quizzes" on questions
    for insert with check (
        exists (
            select 1 from quizzes q
            where q.id = quiz_id and q.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can update questions in their own quizzes
create policy "Users can update questions in own quizzes" on questions
    for update using (
        exists (
            select 1 from quizzes q
            where q.id = quiz_id and q.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete questions from their own quizzes
create policy "Users can delete questions from own quizzes" on questions
    for delete using (
        exists (
            select 1 from quizzes q
            where q.id = quiz_id and q.user_id = auth.uid()
        )
    );

-- ============================================================================
-- OPTIONS TABLE
-- ============================================================================
-- Answer options for questions with correctness tracking and position ordering
-- Supports both single-answer and multiple-answer questions via is_correct flag

create table options (
    id uuid default gen_random_uuid() primary key,
    question_id uuid references questions(id) on delete cascade not null,
    content text not null,
    is_correct boolean default false not null,
    position integer not null,
    created_at timestamptz default now() not null,

    -- Data integrity constraints
    constraint content_length check (char_length(content) >= 1 and char_length(content) <= 500),
    constraint position_positive check (position > 0),
    
    -- Each question can have only one option at each position
    unique(question_id, position)
);

-- Enable row level security for options table
alter table options enable row level security;

-- RLS Policy: Users can view options from questions in their own quizzes
create policy "Users can view options from own questions" on options
    for select using (
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id and qz.user_id = auth.uid()
        )
    );

-- RLS Policy: Authenticated users can view options from public active quizzes
create policy "Authenticated users can view options from public questions" on options
    for select using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id
            and qz.visibility = 'public' 
            and qz.status = 'active'
        )
    );

-- RLS Policy: Anonymous users can view options from public active quizzes
create policy "Anonymous users can view options from public questions" on options
    for select using (
        auth.role() = 'anon' and
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id
            and qz.visibility = 'public' 
            and qz.status = 'active'
        )
    );

-- RLS Policy: Users can insert options into questions in their own quizzes
create policy "Users can insert options into own questions" on options
    for insert with check (
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id and qz.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can update options in questions in their own quizzes
create policy "Users can update options in own questions" on options
    for update using (
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id and qz.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete options from questions in their own quizzes
create policy "Users can delete options from own questions" on options
    for delete using (
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id and qz.user_id = auth.uid()
        )
    );

-- ============================================================================
-- QUIZ_ATTEMPTS TABLE
-- ============================================================================
-- Records of users taking quizzes with scoring and completion tracking
-- Tracks both in-progress and completed quiz sessions

create table quiz_attempts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    quiz_id uuid references quizzes(id) on delete cascade not null,
    status attempt_status default 'in_progress' not null,
    score integer,
    total_questions integer,
    started_at timestamptz default now() not null,
    completed_at timestamptz,

    -- Data integrity constraints
    constraint score_range check (score >= 0 and score <= total_questions),
    constraint total_questions_positive check (total_questions > 0),
    constraint completed_at_after_started check (completed_at is null or completed_at >= started_at)
);

-- Enable row level security for quiz_attempts table
alter table quiz_attempts enable row level security;

-- RLS Policy: Users can view their own quiz attempts
create policy "Users can view own quiz attempts" on quiz_attempts
    for select using (auth.uid() = user_id);

-- RLS Policy: Users can insert their own quiz attempts
create policy "Users can insert own quiz attempts" on quiz_attempts
    for insert with check (auth.uid() = user_id);

-- RLS Policy: Users can update their own quiz attempts
create policy "Users can update own quiz attempts" on quiz_attempts
    for update using (auth.uid() = user_id);

-- ============================================================================
-- QUIZ_RESPONSES TABLE
-- ============================================================================
-- Individual question responses within quiz attempts
-- Uses UUID array to support multiple-choice questions with multiple correct answers

create table quiz_responses (
    id uuid default gen_random_uuid() primary key,
    attempt_id uuid references quiz_attempts(id) on delete cascade not null,
    question_id uuid references questions(id) on delete cascade not null,
    selected_options uuid[] not null default '{}',
    is_correct boolean,
    answered_at timestamptz default now() not null,

    -- Data integrity constraints
    constraint selected_options_not_empty check (array_length(selected_options, 1) > 0),
    
    -- Each attempt can have only one response per question
    unique(attempt_id, question_id)
);

-- Enable row level security for quiz_responses table
alter table quiz_responses enable row level security;

-- RLS Policy: Users can view responses from their own quiz attempts
create policy "Users can view own quiz responses" on quiz_responses
    for select using (
        exists (
            select 1 from quiz_attempts qa
            where qa.id = attempt_id and qa.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can insert responses into their own quiz attempts
create policy "Users can insert own quiz responses" on quiz_responses
    for insert with check (
        exists (
            select 1 from quiz_attempts qa
            where qa.id = attempt_id and qa.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can update responses in their own quiz attempts
create policy "Users can update own quiz responses" on quiz_responses
    for update using (
        exists (
            select 1 from quiz_attempts qa
            where qa.id = attempt_id and qa.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can delete responses from their own quiz attempts
create policy "Users can delete own quiz responses" on quiz_responses
    for delete using (
        exists (
            select 1 from quiz_attempts qa
            where qa.id = attempt_id and qa.user_id = auth.uid()
        )
    );

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
-- Comprehensive index strategy for optimal query performance
-- Includes foreign key, filtering, sorting, and full-text search indexes

-- Foreign key indexes for efficient joins between related tables
create index idx_quizzes_user_id on quizzes(user_id);
create index idx_questions_quiz_id on questions(quiz_id);
create index idx_options_question_id on options(question_id);
create index idx_quiz_attempts_user_id on quiz_attempts(user_id);
create index idx_quiz_attempts_quiz_id on quiz_attempts(quiz_id);
create index idx_quiz_responses_attempt_id on quiz_responses(attempt_id);
create index idx_quiz_responses_question_id on quiz_responses(question_id);

-- Filtering and sorting indexes for common query patterns
create index idx_quizzes_visibility_status on quizzes(visibility, status);
create index idx_quizzes_created_at on quizzes(created_at desc);
create index idx_questions_quiz_position on questions(quiz_id, position);
create index idx_options_question_position on options(question_id, position);
create index idx_quiz_attempts_status on quiz_attempts(status);
create index idx_quiz_attempts_completed_at on quiz_attempts(completed_at desc);

-- Full-text search indexes using PostgreSQL's GIN indexes
-- These enable efficient text search across quiz content
create index idx_quizzes_title_search on quizzes using gin(to_tsvector('english', title));
create index idx_quizzes_description_search on quizzes using gin(to_tsvector('english', description));
create index idx_questions_content_search on questions using gin(to_tsvector('english', content));

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
-- Automatic timestamp update triggers for audit trails
-- Ensures updated_at fields are automatically maintained

-- Function to update the updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Apply update triggers to tables with updated_at columns
create trigger update_profiles_updated_at
    before update on profiles
    for each row
    execute function update_updated_at_column();

create trigger update_quizzes_updated_at
    before update on quizzes
    for each row
    execute function update_updated_at_column();

create trigger update_questions_updated_at
    before update on questions
    for each row
    execute function update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Schema creation completed successfully
-- All tables, indexes, policies, and triggers are now in place
-- The database is ready for QuizStack application deployment