'use client';

import { motion } from 'framer-motion';
import { WorkoutDay } from '@/types';
import ExerciseCard from './ExerciseCard';

interface WorkoutDayCardProps {
  workoutDay: WorkoutDay;
  onCompleteExercise?: (exerciseId: string) => void;
  showCompleteButtons?: boolean;
}

export default function WorkoutDayCard({ 
  workoutDay, 
  onCompleteExercise, 
  showCompleteButtons = false 
}: WorkoutDayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gradient">{workoutDay.day_name}</h2>
        <div className="text-sm text-gray-400">
          {workoutDay.workout_exercises?.length || 0} exercises
        </div>
      </div>

      <div className="space-y-4">
        {workoutDay.workout_exercises?.map((exercise, index) => {
          console.log(`WorkoutDayCard - Exercise ${index}:`, exercise);
          console.log(`WorkoutDayCard - Exercise ID:`, exercise.exercise_id);
          
          return (
            <ExerciseCard
              key={exercise.exercise_id || `exercise-${index}`}
              exercise={exercise}
              onComplete={() => {
                console.log('WorkoutDayCard - onComplete called with ID:', exercise.exercise_id);
                onCompleteExercise?.(exercise.exercise_id);
              }}
              showCompleteButton={showCompleteButtons}
            />
          );
        })}
        
        {(!workoutDay.workout_exercises || workoutDay.workout_exercises.length === 0) && (
          <div className="text-center py-8 text-gray-400">
            No exercises scheduled for this day
          </div>
        )}
      </div>
    </motion.div>
  );
}