export interface User {
  id: string;
  email: string;
  experience_level: ExperienceLevel;
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  workout_days?: WorkoutDay[];
}

export interface WorkoutDay {
  id: string;
  plan_id: string;
  day_name: string;
  order_index: number;
  workout_exercises?: WorkoutExercise[];
}

export interface Exercise {
  id: string;
  name: string;
  difficulty: ExperienceLevel;
  description: string;
  video_url?: string;
  category?: WorkoutGoal; // Added: maps to the category column in the DB
}

export interface WorkoutExercise {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  sets: number;
  reps: number;
  order_index: number;
  exercise?: Exercise;
}

export interface WorkoutCompletion {
  id: string;
  user_id: string;
  workout_day_id: string;
  completed_at: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  url: string;
  channel: string;
  transcript: string;
}

export interface ExerciseEmbedding {
  id: string;
  exercise_id: string;
  embedding: number[];
}

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

// Added: matches the category values in the DB and the modal goal options
export type WorkoutGoal =
  | 'General Fitness'
  | 'Build Strength'
  | 'Weight Loss'
  | 'Flexibility'
  | 'Endurance'
  | 'Muscle Gain';

// Map from the modal's goal value keys to the DB category strings
export const GOAL_LABEL_MAP: Record<string, WorkoutGoal> = {
  general_fitness: 'General Fitness',
  strength: 'Build Strength',
  weight_loss: 'Weight Loss',
  flexibility: 'Flexibility',
  endurance: 'Endurance',
  muscle_gain: 'Muscle Gain',
};

export interface WorkoutPlanRequest {
  experience_level: ExperienceLevel;
  training_frequency: number;
  preferences?: string[];
  goal?: WorkoutGoal; // Added: the user's selected primary goal
}

export interface GeneratedWorkoutPlan {
  week_plan: WorkoutDayPlan[];
}

export interface WorkoutDayPlan {
  day: string;
  exercises: ExercisePlan[];
}

export interface ExercisePlan {
  name: string;
  sets: number;
  reps: number;
  video?: string;
  difficulty: ExperienceLevel;
}
