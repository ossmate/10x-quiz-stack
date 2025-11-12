-- ============================================================================
-- Update Atomic Quiz Functions to Use Explanation Column
-- ============================================================================
-- Purpose: Update create_quiz_atomic and update_quiz_atomic functions to store
--          explanations in questions.explanation instead of answers.ai_generation_metadata
-- Dependencies: Requires 20251112143000_add_explanation_to_questions.sql
-- Date: 2025-11-12
-- ============================================================================

-- Drop existing functions
drop function if exists create_quiz_atomic(uuid, jsonb);
drop function if exists update_quiz_atomic(uuid, uuid, jsonb);

-- ============================================================================
-- Recreate create_quiz_atomic with explanation support
-- ============================================================================
create or replace function create_quiz_atomic(
  p_user_id uuid,
  p_quiz_input jsonb
) returns jsonb as $$
declare
  v_quiz_id uuid;
  v_question_id uuid;
  v_quiz_metadata jsonb;
  v_question jsonb;
  v_option jsonb;
  v_question_index integer;
  v_option_index integer;
  v_result jsonb;
begin
  -- Validate user exists (for non-service-role calls)
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'User does not exist: %', p_user_id;
  end if;

  -- Validate required fields
  if p_quiz_input->>'title' is null or trim(p_quiz_input->>'title') = '' then
    raise exception 'Quiz title is required';
  end if;

  if jsonb_array_length(p_quiz_input->'questions') < 1 then
    raise exception 'Quiz must have at least one question';
  end if;

  -- Step 1: Prepare quiz metadata
  v_quiz_metadata := jsonb_build_object(
    'description', coalesce(p_quiz_input->>'description', ''),
    'visibility', coalesce(p_quiz_input->>'visibility', 'private'),
    'source', coalesce(p_quiz_input->>'source', 'manual'),
    'ai_model', p_quiz_input->>'ai_model',
    'ai_prompt', p_quiz_input->>'ai_prompt',
    'ai_temperature', (p_quiz_input->>'ai_temperature')::numeric
  );

  -- Step 2: Insert quiz record
  insert into quizzes (user_id, title, metadata, status)
  values (
    p_user_id,
    p_quiz_input->>'title',
    v_quiz_metadata,
    'draft'
  )
  returning id into v_quiz_id;

  -- Step 3: Insert questions and options
  v_question_index := 0;
  for v_question in select * from jsonb_array_elements(p_quiz_input->'questions')
  loop
    -- Validate question
    if v_question->>'content' is null or trim(v_question->>'content') = '' then
      raise exception 'Question content is required at index %', v_question_index;
    end if;

    if jsonb_array_length(v_question->'options') < 2 then
      raise exception 'Question at index % must have at least 2 options', v_question_index;
    end if;

    -- Check if at least one option is correct
    if not exists (
      select 1 from jsonb_array_elements(v_question->'options') as opt
      where (opt->>'is_correct')::boolean = true
    ) then
      raise exception 'Question at index % must have at least one correct option', v_question_index;
    end if;

    -- Insert question with explanation
    insert into questions (quiz_id, content, explanation, order_index)
    values (
      v_quiz_id,
      v_question->>'content',
      v_question->>'explanation',
      (v_question->>'position')::integer - 1
    )
    returning id into v_question_id;

    -- Insert options for this question
    v_option_index := 0;
    for v_option in select * from jsonb_array_elements(v_question->'options')
    loop
      -- Validate option
      if v_option->>'content' is null or trim(v_option->>'content') = '' then
        raise exception 'Option content is required at question %, option %', v_question_index, v_option_index;
      end if;

      insert into answers (
        question_id,
        content,
        is_correct,
        order_index,
        generated_by_ai,
        ai_generation_metadata
      )
      values (
        v_question_id,
        v_option->>'content',
        (v_option->>'is_correct')::boolean,
        (v_option->>'position')::integer - 1,
        (v_quiz_metadata->>'source') = 'ai_generated',
        null
      );

      v_option_index := v_option_index + 1;
    end loop;

    v_question_index := v_question_index + 1;
  end loop;

  -- Step 4: Build and return complete quiz structure
  select jsonb_build_object(
    'id', q.id,
    'user_id', q.user_id,
    'title', q.title,
    'description', q.metadata->>'description',
    'visibility', q.metadata->>'visibility',
    'status', q.status,
    'source', q.metadata->>'source',
    'ai_model', q.metadata->>'ai_model',
    'ai_prompt', q.metadata->>'ai_prompt',
    'ai_temperature', (q.metadata->>'ai_temperature')::numeric,
    'created_at', q.created_at,
    'updated_at', q.updated_at,
    'questions', (
      select jsonb_agg(
        jsonb_build_object(
          'id', qs.id,
          'quiz_id', qs.quiz_id,
          'content', qs.content,
          'explanation', qs.explanation,
          'position', qs.order_index + 1,
          'status', 'active',
          'created_at', qs.created_at,
          'updated_at', qs.updated_at,
          'options', (
            select jsonb_agg(
              jsonb_build_object(
                'id', ans.id,
                'question_id', ans.question_id,
                'content', ans.content,
                'is_correct', ans.is_correct,
                'position', ans.order_index + 1,
                'created_at', ans.created_at
              )
              order by ans.order_index
            )
            from answers ans
            where ans.question_id = qs.id
          )
        )
        order by qs.order_index
      )
      from questions qs
      where qs.quiz_id = q.id
    )
  )
  into v_result
  from quizzes q
  where q.id = v_quiz_id;

  return v_result;

exception
  when others then
    -- Re-raise the exception to trigger rollback
    raise exception 'Failed to create quiz atomically: %', sqlerrm;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- Recreate update_quiz_atomic with explanation support
-- ============================================================================
create or replace function update_quiz_atomic(
  p_quiz_id uuid,
  p_user_id uuid,
  p_quiz_input jsonb
) returns jsonb as $$
declare
  v_question_id uuid;
  v_quiz_metadata jsonb;
  v_question jsonb;
  v_option jsonb;
  v_question_index integer;
  v_option_index integer;
  v_result jsonb;
begin
  -- Step 1: Validate ownership
  if not exists (
    select 1 from quizzes
    where id = p_quiz_id
      and user_id = p_user_id
      and deleted_at is null
  ) then
    raise exception 'Quiz not found or access denied';
  end if;

  -- Validate required fields
  if p_quiz_input->>'title' is null or trim(p_quiz_input->>'title') = '' then
    raise exception 'Quiz title is required';
  end if;

  if jsonb_array_length(p_quiz_input->'questions') < 1 then
    raise exception 'Quiz must have at least one question';
  end if;

  -- Step 2: Delete existing questions (cascade will handle answers)
  delete from questions where quiz_id = p_quiz_id;

  -- Step 3: Update quiz metadata
  v_quiz_metadata := jsonb_build_object(
    'description', coalesce(p_quiz_input->>'description', ''),
    'visibility', coalesce(p_quiz_input->>'visibility', 'private'),
    'source', coalesce(p_quiz_input->>'source', 'manual'),
    'ai_model', p_quiz_input->>'ai_model',
    'ai_prompt', p_quiz_input->>'ai_prompt',
    'ai_temperature', (p_quiz_input->>'ai_temperature')::numeric
  );

  update quizzes
  set
    title = p_quiz_input->>'title',
    metadata = v_quiz_metadata,
    updated_at = now()
  where id = p_quiz_id;

  -- Step 4: Insert new questions and options
  v_question_index := 0;
  for v_question in select * from jsonb_array_elements(p_quiz_input->'questions')
  loop
    -- Validate question
    if v_question->>'content' is null or trim(v_question->>'content') = '' then
      raise exception 'Question content is required at index %', v_question_index;
    end if;

    if jsonb_array_length(v_question->'options') < 2 then
      raise exception 'Question at index % must have at least 2 options', v_question_index;
    end if;

    -- Check if at least one option is correct
    if not exists (
      select 1 from jsonb_array_elements(v_question->'options') as opt
      where (opt->>'is_correct')::boolean = true
    ) then
      raise exception 'Question at index % must have at least one correct option', v_question_index;
    end if;

    -- Insert question with explanation
    insert into questions (quiz_id, content, explanation, order_index)
    values (
      p_quiz_id,
      v_question->>'content',
      v_question->>'explanation',
      (v_question->>'position')::integer - 1
    )
    returning id into v_question_id;

    -- Insert options for this question
    v_option_index := 0;
    for v_option in select * from jsonb_array_elements(v_question->'options')
    loop
      -- Validate option
      if v_option->>'content' is null or trim(v_option->>'content') = '' then
        raise exception 'Option content is required at question %, option %', v_question_index, v_option_index;
      end if;

      insert into answers (
        question_id,
        content,
        is_correct,
        order_index,
        generated_by_ai,
        ai_generation_metadata
      )
      values (
        v_question_id,
        v_option->>'content',
        (v_option->>'is_correct')::boolean,
        (v_option->>'position')::integer - 1,
        (v_quiz_metadata->>'source') = 'ai_generated',
        null
      );

      v_option_index := v_option_index + 1;
    end loop;

    v_question_index := v_question_index + 1;
  end loop;

  -- Step 5: Build and return complete quiz structure
  select jsonb_build_object(
    'id', q.id,
    'user_id', q.user_id,
    'title', q.title,
    'description', q.metadata->>'description',
    'visibility', q.metadata->>'visibility',
    'status', q.status,
    'source', q.metadata->>'source',
    'ai_model', q.metadata->>'ai_model',
    'ai_prompt', q.metadata->>'ai_prompt',
    'ai_temperature', (q.metadata->>'ai_temperature')::numeric,
    'created_at', q.created_at,
    'updated_at', q.updated_at,
    'questions', (
      select jsonb_agg(
        jsonb_build_object(
          'id', qs.id,
          'quiz_id', qs.quiz_id,
          'content', qs.content,
          'explanation', qs.explanation,
          'position', qs.order_index + 1,
          'status', 'active',
          'created_at', qs.created_at,
          'updated_at', qs.updated_at,
          'options', (
            select jsonb_agg(
              jsonb_build_object(
                'id', ans.id,
                'question_id', ans.question_id,
                'content', ans.content,
                'is_correct', ans.is_correct,
                'position', ans.order_index + 1,
                'created_at', ans.created_at
              )
              order by ans.order_index
            )
            from answers ans
            where ans.question_id = qs.id
          )
        )
        order by qs.order_index
      )
      from questions qs
      where qs.quiz_id = q.id
    )
  )
  into v_result
  from quizzes q
  where q.id = p_quiz_id;

  return v_result;

exception
  when others then
    -- Re-raise the exception to trigger rollback
    raise exception 'Failed to update quiz atomically: %', sqlerrm;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
