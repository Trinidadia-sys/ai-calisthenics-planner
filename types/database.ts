export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          experience_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          experience_level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          created_at?: string;
        };
      };
      workout_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
        };
      };
      workout_days: {
        Row: {
          id: string;
          plan_id: string;
          day_name: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          plan_id: string;
          day_name: string;
          order_index: number;
        };
        Update: {
          id?: string;
          plan_id?: string;
          day_name?: string;
          order_index?: number;
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          description: string | null;
          video_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          description?: string | null;
          video_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
          description?: string | null;
          video_url?: string | null;
          created_at?: string;
        };
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_day_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          order_index: number;
        };
        Insert: {
          id?: string;
          workout_day_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          order_index: number;
        };
        Update: {
          id?: string;
          workout_day_id?: string;
          exercise_id?: string;
          sets?: number;
          reps?: number;
          order_index?: number;
        };
      };
      workout_completions: {
        Row: {
          id: string;
          user_id: string;
          workout_day_id: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_day_id: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_day_id?: string;
          completed_at?: string;
        };
      };
      exercise_completions: {
        Row: {
          id: string;
          user_id: string;
          workout_exercise_id: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_exercise_id: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_exercise_id?: string;
          completed_at?: string;
        };
      };
      youtube_videos: {
        Row: {
          id: string;
          title: string;
          url: string;
          channel: string;
          transcript: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          url: string;
          channel: string;
          transcript?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          url?: string;
          channel?: string;
          transcript?: string | null;
          created_at?: string;
        };
      };
      exercise_embeddings: {
        Row: {
          id: string;
          exercise_id: string;
          embedding: number[];
          created_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          embedding: number[];
          created_at?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          embedding?: number[];
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
