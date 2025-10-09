-- ============================================================================
-- QuizStack Database Schema Migration
-- ============================================================================
-- Purpose: Create the complete database schema for QuizStack quiz platform
-- Tables: profiles, quizzes, questions, answers, quiz_attempts, attempt_answers, ai_usage_logs
-- Features: RLS policies, indexes, enums, triggers, constraints
-- Author: Database Migration System
-- Date: 2025-10-09
-- ============================================================================

-- Create custom enum types for type safety and data integrity
create type quiz_status as enum ('draft', 'private', 'public', 'archived');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
create table profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    username text unique not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,

    constraint username_length check (char_length(username) >= 3 and char_length(username) <= 50)
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles
    for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
    for update using (auth.uid() = id);

create policy "Users can insert own profile" on profiles
    for insert with check (auth.uid() = id);

-- ============================================================================
-- QUIZZES TABLE
-- ============================================================================
create table quizzes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    title text not null,
    metadata jsonb default '{}'::jsonb not null,
    status quiz_status default 'draft' not null,
    parent_quiz_id uuid references quizzes(id) on delete set null,
    version_number integer default 1 not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    deleted_at timestamptz,

    constraint title_length check (char_length(title) >= 1 and char_length(title) <= 200),
    constraint version_number_positive check (version_number > 0)
);

alter table quizzes enable row level security;

create policy "Users can view own quizzes" on quizzes
    for select using (auth.uid() = user_id);

create policy "Authenticated users can view public quizzes" on quizzes
    for select using (
        auth.role() = 'authenticated'
        and (status = 'public' or status = 'private')
        and deleted_at is null
    );

create policy "Anonymous users can view public quizzes" on quizzes
    for select using (
        auth.role() = 'anon'
        and status = 'public'
        and deleted_at is null
    );

create policy "Users can insert own quizzes" on quizzes
    for insert with check (auth.uid() = user_id);

create policy "Users can update own quizzes" on quizzes
    for update using (auth.uid() = user_id);

create policy "Users can delete own quizzes" on quizzes
    for delete using (auth.uid() = user_id);

-- ============================================================================
-- QUESTIONS TABLE
-- ============================================================================
create table questions (
    id uuid default gen_random_uuid() primary key,
    quiz_id uuid references quizzes(id) on delete cascade not null,
    content text not null,
    order_index integer not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    deleted_at timestamptz,

    constraint content_length check (char_length(content) >= 1 and char_length(content) <= 1000),
    constraint order_index_positive check (order_index >= 0),

    unique(quiz_id, order_index)
);

alter table questions enable row level security;

create policy "Users can view questions from own quizzes" on questions
    for select using (
        exists (
            select 1 from quizzes q
            where q.id = quiz_id and q.user_id = auth.uid()
        )
    );

create policy "Authenticated users can view questions from public quizzes" on questions
    for select using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from quizzes q
            where q.id = quiz_id
            and (q.status = 'public' or q.status = 'private')
            and q.deleted_at is null
        )
    );

create policy "Anonymous users can view questions from public quizzes" on questions
    for select using (
        auth.role() = 'anon' and
        exists (
            select 1 from quizzes q
            where q.id = quiz_id
            and q.status = 'public'
            and q.deleted_at is null
        )
    );

create policy "Users can insert questions into own quizzes" on questions
    for insert with check (
        exists (
            select 1 from quizzes q
            where q.id = quiz_id and q.user_id = auth.uid()
        )
    );

create policy "Users can update questions in own quizzes" on questions
    for update using (
        exists (
            select 1 from quizzes q
            where q.id = quiz_id and q.user_id = auth.uid()
        )
    );

create policy "Users can delete questions from own quizzes" on questions
    for delete using (
        exists (
            select 1 from quizzes q
            where q.id = quiz_id and q.user_id = auth.uid()
        )
    );

-- ============================================================================
-- ANSWERS TABLE
-- ============================================================================
create table answers (
    id uuid default gen_random_uuid() primary key,
    question_id uuid references questions(id) on delete cascade not null,
    content text not null,
    is_correct boolean default false not null,
    order_index integer not null,
    generated_by_ai boolean default false not null,
    ai_generation_metadata jsonb,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    deleted_at timestamptz,

    constraint content_length check (char_length(content) >= 1 and char_length(content) <= 500),
    constraint order_index_positive check (order_index >= 0),

    unique(question_id, order_index)
);

alter table answers enable row level security;

create policy "Users can view answers from own questions" on answers
    for select using (
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id and qz.user_id = auth.uid()
        )
    );

create policy "Authenticated users can view answers from public questions" on answers
    for select using (
        auth.role() = 'authenticated' and
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id
            and (qz.status = 'public' or qz.status = 'private')
            and qz.deleted_at is null
        )
    );

create policy "Anonymous users can view answers from public questions" on answers
    for select using (
        auth.role() = 'anon' and
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id
            and qz.status = 'public'
            and qz.deleted_at is null
        )
    );

create policy "Users can insert answers into own questions" on answers
    for insert with check (
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id and qz.user_id = auth.uid()
        )
    );

create policy "Users can update answers in own questions" on answers
    for update using (
        exists (
            select 1 from questions q
            join quizzes qz on qz.id = q.quiz_id
            where q.id = question_id and qz.user_id = auth.uid()
        )
    );

create policy "Users can delete answers from own questions" on answers
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
create table quiz_attempts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    quiz_id uuid references quizzes(id) on delete cascade not null,
    score integer not null,
    total_questions integer not null,
    time_spent integer,
    created_at timestamptz default now() not null,
    completed_at timestamptz default now() not null,

    constraint score_range check (score >= 0 and score <= total_questions),
    constraint total_questions_positive check (total_questions > 0),
    constraint time_spent_positive check (time_spent is null or time_spent >= 0)
);

alter table quiz_attempts enable row level security;

create policy "Users can view own quiz attempts" on quiz_attempts
    for select using (auth.uid() = user_id);

create policy "Users can insert own quiz attempts" on quiz_attempts
    for insert with check (auth.uid() = user_id);

create policy "Users can update own quiz attempts" on quiz_attempts
    for update using (auth.uid() = user_id);

-- ============================================================================
-- ATTEMPT_ANSWERS TABLE
-- ============================================================================
create table attempt_answers (
    id uuid default gen_random_uuid() primary key,
    quiz_attempt_id uuid references quiz_attempts(id) on delete cascade not null,
    question_id uuid references questions(id) on delete cascade not null,
    selected_answer_id uuid references answers(id) on delete cascade not null,
    created_at timestamptz default now() not null,

    unique(quiz_attempt_id, question_id)
);

alter table attempt_answers enable row level security;

create policy "Users can view own attempt answers" on attempt_answers
    for select using (
        exists (
            select 1 from quiz_attempts qa
            where qa.id = quiz_attempt_id and qa.user_id = auth.uid()
        )
    );

create policy "Users can insert own attempt answers" on attempt_answers
    for insert with check (
        exists (
            select 1 from quiz_attempts qa
            where qa.id = quiz_attempt_id and qa.user_id = auth.uid()
        )
    );

create policy "Users can update own attempt answers" on attempt_answers
    for update using (
        exists (
            select 1 from quiz_attempts qa
            where qa.id = quiz_attempt_id and qa.user_id = auth.uid()
        )
    );

create policy "Users can delete own attempt answers" on attempt_answers
    for delete using (
        exists (
            select 1 from quiz_attempts qa
            where qa.id = quiz_attempt_id and qa.user_id = auth.uid()
        )
    );

-- ============================================================================
-- AI_USAGE_LOGS TABLE
-- ============================================================================
create table ai_usage_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    model_used text not null,
    tokens_used integer not null,
    requested_at timestamptz default now() not null,
    created_at timestamptz default now() not null,

    constraint tokens_used_positive check (tokens_used > 0)
);

alter table ai_usage_logs enable row level security;

create policy "Users can view own ai usage logs" on ai_usage_logs
    for select using (auth.uid() = user_id);

create policy "Users can insert own ai usage logs" on ai_usage_logs
    for insert with check (auth.uid() = user_id);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
create index idx_quizzes_user_id on quizzes(user_id);
create index idx_quizzes_status on quizzes(status);
create index idx_quizzes_created_at on quizzes(created_at desc);
create index idx_quizzes_deleted_at on quizzes(deleted_at) where deleted_at is null;

create index idx_questions_quiz_id on questions(quiz_id);
create index idx_questions_quiz_order on questions(quiz_id, order_index);
create index idx_questions_deleted_at on questions(deleted_at) where deleted_at is null;

create index idx_answers_question_id on answers(question_id);
create index idx_answers_question_order on answers(question_id, order_index);
create index idx_answers_deleted_at on answers(deleted_at) where deleted_at is null;

create index idx_quiz_attempts_user_id on quiz_attempts(user_id);
create index idx_quiz_attempts_quiz_id on quiz_attempts(quiz_id);
create index idx_quiz_attempts_created_at on quiz_attempts(created_at desc);

create index idx_attempt_answers_attempt_id on attempt_answers(quiz_attempt_id);
create index idx_attempt_answers_question_id on attempt_answers(question_id);

create index idx_ai_usage_logs_user_id on ai_usage_logs(user_id);
create index idx_ai_usage_logs_requested_at on ai_usage_logs(requested_at desc);

-- Full-text search indexes
create index idx_quizzes_title_search on quizzes using gin(to_tsvector('english', title));
create index idx_questions_content_search on questions using gin(to_tsvector('english', content));

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

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

create trigger update_answers_updated_at
    before update on answers
    for each row
    execute function update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
