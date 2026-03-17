-- Vector search function for finding similar exercises
CREATE OR REPLACE FUNCTION find_similar_exercises(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  difficulty text,
  description text,
  video_url text,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT
    exercises.id,
    exercises.name,
    exercises.difficulty,
    exercises.description,
    exercises.video_url,
    exercises.created_at,
    1 - (exercise_embeddings.embedding <=> query_embedding) as similarity
  FROM exercise_embeddings
  JOIN exercises ON exercise_embeddings.exercise_id = exercises.id
  WHERE 1 - (exercise_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;

-- Function to get user workout statistics
CREATE OR REPLACE FUNCTION get_user_workout_stats(user_uuid uuid)
RETURNS TABLE(
  weekly_workouts bigint,
  current_streak bigint,
  total_workouts bigint,
  weekly_goal int
)
LANGUAGE sql
AS $$
  WITH 
  -- Get workouts completed this week
  weekly_workouts AS (
    SELECT COUNT(*) as count
    FROM workout_completions wc
    WHERE wc.user_id = user_uuid
    AND wc.completed_at >= date_trunc('week', CURRENT_DATE)
  ),
  -- Get current streak (consecutive days with workouts)
  streak_days AS (
    SELECT 
      DATE(completed_at) as workout_date,
      ROW_NUMBER() OVER (ORDER BY DATE(completed_at) DESC) as rn
    FROM workout_completions wc
    WHERE wc.user_id = user_uuid
    GROUP BY DATE(completed_at)
    ORDER BY DATE(completed_at) DESC
  ),
  current_streak AS (
    SELECT COUNT(*) as streak
    FROM streak_days sd
    WHERE DATE(workout_date) = CURRENT_DATE - INTERVAL '1 day' * (rn - 1)
    AND DATE(workout_date) >= CURRENT_DATE - INTERVAL '1 day' * (rn - 1) + INTERVAL '1 day'
  ),
  -- Get total workouts
  total_workouts AS (
    SELECT COUNT(*) as count
    FROM workout_completions wc
    WHERE wc.user_id = user_uuid
  )
  SELECT 
    (SELECT count FROM weekly_workouts) as weekly_workouts,
    COALESCE((SELECT streak FROM current_streak LIMIT 1), 0) as current_streak,
    (SELECT count FROM total_workouts) as total_workouts,
    4 as weekly_goal -- Default weekly goal, could be stored in user profile
$$;

-- Function to update exercise embeddings
CREATE OR REPLACE FUNCTION update_exercise_embedding(exercise_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete existing embedding
  DELETE FROM exercise_embeddings WHERE exercise_id = exercise_uuid;
  
  -- This would typically be called from application code
  -- where you generate the embedding and insert it
  NULL;
END;
$$;

-- Trigger to automatically create embeddings for new exercises
CREATE OR REPLACE FUNCTION trigger_create_exercise_embedding()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- This trigger would call the embedding service
  -- For now, we'll just log that a new exercise was created
  RAISE NOTICE 'New exercise created: %', NEW.name;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_exercise_insert ON exercises;
CREATE TRIGGER on_exercise_insert
  AFTER INSERT ON exercises
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_exercise_embedding();
