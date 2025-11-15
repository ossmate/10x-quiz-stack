# QuizStack Database Schema

## Tables

### 1. profiles
Extends Supabase auth.users with additional user information.

```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 50),
    CONSTRAINT display_name_length CHECK (char_length(display_name) <= 100)
);
```

### 2. quizzes
Core entity for quiz management with visibility and status tracking.

```sql
CREATE TYPE quiz_visibility AS ENUM ('public', 'private');
CREATE TYPE quiz_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE quiz_source AS ENUM ('manual', 'ai_generated');

CREATE TABLE quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    visibility quiz_visibility DEFAULT 'private' NOT NULL,
    status quiz_status DEFAULT 'active' NOT NULL,
    source quiz_source DEFAULT 'manual' NOT NULL,
    ai_model TEXT,
    ai_prompt TEXT,
    ai_temperature DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
    CONSTRAINT description_length CHECK (char_length(description) <= 1000),
    CONSTRAINT ai_temperature_range CHECK (ai_temperature >= 0.0 AND ai_temperature <= 2.0)
);
```

### 3. questions
Questions belonging to quizzes with position tracking.

```sql
CREATE TYPE question_status AS ENUM ('active', 'deleted');

CREATE TABLE questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    explanation TEXT,
    position INTEGER NOT NULL,
    status question_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 1000),
    CONSTRAINT explanation_length CHECK (char_length(explanation) <= 2000),
    CONSTRAINT position_positive CHECK (position > 0),
    UNIQUE(quiz_id, position)
);
```

### 4. options
Answer options for questions with correctness tracking.

```sql
CREATE TABLE options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 500),
    CONSTRAINT position_positive CHECK (position > 0),
    UNIQUE(question_id, position)
);
```

### 5. quiz_attempts
Records of users taking quizzes with scoring.

```sql
CREATE TYPE attempt_status AS ENUM ('in_progress', 'completed', 'abandoned');

CREATE TABLE quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    status attempt_status DEFAULT 'in_progress' NOT NULL,
    score INTEGER,
    total_questions INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,

    CONSTRAINT score_range CHECK (score >= 0 AND score <= total_questions),
    CONSTRAINT total_questions_positive CHECK (total_questions > 0),
    CONSTRAINT completed_at_after_started CHECK (completed_at IS NULL OR completed_at >= started_at)
);
```

### 6. quiz_responses
Individual question responses within quiz attempts.

```sql
CREATE TABLE quiz_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
    selected_options UUID[] NOT NULL DEFAULT '{}',
    is_correct BOOLEAN,
    answered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT selected_options_not_empty CHECK (array_length(selected_options, 1) > 0),
    UNIQUE(attempt_id, question_id)
);
```

## Relationships

### One-to-Many Relationships
- **profiles → quizzes**: One user can create many quizzes
- **quizzes → questions**: One quiz can have many questions
- **questions → options**: One question can have many answer options
- **profiles → quiz_attempts**: One user can have many quiz attempts
- **quizzes → quiz_attempts**: One quiz can have many attempts

### Many-to-Many Relationships
- **quiz_attempts ↔ questions**: Through quiz_responses table
- **quiz_responses ↔ options**: Through selected_options array

## Indexes

### Performance Indexes
```sql
-- Foreign key indexes for efficient joins
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_options_question_id ON options(question_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_responses_attempt_id ON quiz_responses(attempt_id);
CREATE INDEX idx_quiz_responses_question_id ON quiz_responses(question_id);

-- Filtering and sorting indexes
CREATE INDEX idx_quizzes_visibility_status ON quizzes(visibility, status);
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at DESC);
CREATE INDEX idx_questions_quiz_position ON questions(quiz_id, position);
CREATE INDEX idx_options_question_position ON options(question_id, position);
CREATE INDEX idx_quiz_attempts_status ON quiz_attempts(status);
CREATE INDEX idx_quiz_attempts_completed_at ON quiz_attempts(completed_at DESC);

-- Text search indexes
CREATE INDEX idx_quizzes_title_search ON quizzes USING gin(to_tsvector('english', title));
CREATE INDEX idx_quizzes_description_search ON quizzes USING gin(to_tsvector('english', description));
CREATE INDEX idx_questions_content_search ON questions USING gin(to_tsvector('english', content));
```

## PostgreSQL Row-Level Security (RLS) Policies

### profiles table
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
```

### quizzes table
```sql
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Users can see their own quizzes and public quizzes from others
CREATE POLICY "Users can view own quizzes" ON quizzes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public quizzes" ON quizzes
    FOR SELECT USING (visibility = 'public' AND status = 'active');

-- Users can only modify their own quizzes
CREATE POLICY "Users can insert own quizzes" ON quizzes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes" ON quizzes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes" ON quizzes
    FOR DELETE USING (auth.uid() = user_id);
```

### questions table
```sql
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Users can access questions from quizzes they own or public quizzes
CREATE POLICY "Users can view questions from accessible quizzes" ON questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            WHERE q.id = quiz_id
            AND (q.user_id = auth.uid() OR (q.visibility = 'public' AND q.status = 'active'))
        )
    );

-- Users can only modify questions from their own quizzes
CREATE POLICY "Users can modify questions from own quizzes" ON questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM quizzes q
            WHERE q.id = quiz_id AND q.user_id = auth.uid()
        )
    );
```

### options table
```sql
ALTER TABLE options ENABLE ROW LEVEL SECURITY;

-- Users can access options from questions in accessible quizzes
CREATE POLICY "Users can view options from accessible questions" ON options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM questions q
            JOIN quizzes qz ON qz.id = q.quiz_id
            WHERE q.id = question_id
            AND (qz.user_id = auth.uid() OR (qz.visibility = 'public' AND qz.status = 'active'))
        )
    );

-- Users can only modify options from their own quizzes
CREATE POLICY "Users can modify options from own questions" ON options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM questions q
            JOIN quizzes qz ON qz.id = q.quiz_id
            WHERE q.id = question_id AND qz.user_id = auth.uid()
        )
    );
```

### quiz_attempts table
```sql
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own quiz attempts
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only create and modify their own quiz attempts
CREATE POLICY "Users can insert own quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz attempts" ON quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id);
```

### quiz_responses table
```sql
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

-- Users can only see responses from their own quiz attempts
CREATE POLICY "Users can view own quiz responses" ON quiz_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts qa
            WHERE qa.id = attempt_id AND qa.user_id = auth.uid()
        )
    );

-- Users can only create and modify responses from their own quiz attempts
CREATE POLICY "Users can modify own quiz responses" ON quiz_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts qa
            WHERE qa.id = attempt_id AND qa.user_id = auth.uid()
        )
    );
```

## Additional Notes

### Design Decisions

1. **Soft Deletion**: Using status enums instead of hard deletion to preserve historical data and maintain referential integrity.

2. **Flexible Answer Types**: The options table with boolean `is_correct` flags supports both single-answer and multiple-answer questions.

3. **AI Integration**: Quiz source tracking with optional AI metadata fields (model, prompt, temperature) to support AI-generated content.

4. **Position Tracking**: Questions and options have position fields with unique constraints to maintain order.

5. **Comprehensive Timestamps**: All entities include creation and update timestamps for audit trails and analytics.

6. **Array Storage**: Selected options in quiz_responses use UUID arrays for efficient storage of multiple selections.

7. **Text Search**: GIN indexes on text fields enable efficient full-text search capabilities.

### Performance Considerations

- Foreign key indexes ensure efficient joins between related tables
- Composite indexes on frequently filtered combinations (visibility, status)
- Text search indexes using PostgreSQL's full-text search capabilities
- Proper normalization to 3NF while maintaining query efficiency

### Security Features

- Row-Level Security policies restrict data access based on ownership and visibility
- Check constraints prevent data integrity issues
- Proper cascade deletion rules maintain referential integrity
- UUID primary keys prevent enumeration attacks