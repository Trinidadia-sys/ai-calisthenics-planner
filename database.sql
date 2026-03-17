-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout plans table
CREATE TABLE workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout days table
CREATE TABLE workout_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE,
  day_name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  UNIQUE(plan_id, order_index)
);

-- Exercises table
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  description TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout exercises (junction table)
CREATE TABLE workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL CHECK (sets > 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  order_index INTEGER NOT NULL,
  UNIQUE(workout_day_id, order_index)
);

-- Workout completions table
CREATE TABLE workout_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workout_day_id)
);

-- Exercise completions table for individual exercise tracking
CREATE TABLE exercise_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workout_exercise_id)
);

-- YouTube videos table
CREATE TABLE youtube_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  channel TEXT NOT NULL,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise embeddings table for RAG
CREATE TABLE exercise_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX idx_workout_days_plan_id ON workout_days(plan_id);
CREATE INDEX idx_workout_exercises_day_id ON workout_exercises(workout_day_id);
CREATE INDEX idx_workout_exercises_exercise_id ON workout_exercises(exercise_id);
CREATE INDEX idx_workout_completions_user_id ON workout_completions(user_id);
CREATE INDEX idx_exercise_embeddings_exercise_id ON exercise_embeddings(exercise_id);

-- Create vector index for exercise embeddings
CREATE INDEX idx_exercise_embeddings_vector ON exercise_embeddings USING ivfflat (embedding vector_cosine_ops);

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Workout plans policies
CREATE POLICY "Users can view own workout plans" ON workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workout plans" ON workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout plans" ON workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout plans" ON workout_plans FOR DELETE USING (auth.uid() = user_id);

-- Workout completions policies
CREATE POLICY "Users can view own completions" ON workout_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own completions" ON workout_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own completions" ON workout_completions FOR UPDATE USING (auth.uid() = user_id);

-- Exercise completions policies
CREATE POLICY "Users can view own exercise completions" ON exercise_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own exercise completions" ON exercise_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise completions" ON exercise_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercise completions" ON exercise_completions FOR DELETE USING (auth.uid() = user_id);
