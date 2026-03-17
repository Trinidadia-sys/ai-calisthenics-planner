'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WorkoutExercise } from '@/types';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  onComplete?: () => void;
  showCompleteButton?: boolean;
}

export default function ExerciseCard({ exercise, onComplete, showCompleteButton = false }: ExerciseCardProps) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if exercise is already completed on mount
  useEffect(() => {
    const checkCompletion = async () => {
      try {
        const response = await fetch(`/api/complete-workout?workout_exercise_id=${exercise.exercise_id}`);
        const result = await response.json();
        
        if (result.success) {
          // Use the completed flag from the API response
          const isCompleted = result.completed || false;
          setCompleted(isCompleted);
          console.log(`Exercise ${exercise.exercise_id} completion status:`, isCompleted);
        }
      } catch (error) {
        console.error('Error checking exercise completion:', error);
      }
    };
    
    if (showCompleteButton && exercise.exercise_id) {
      checkCompletion();
    }
  }, [exercise.exercise_id, showCompleteButton]);

  const handleComplete = async () => {
    setLoading(true);
    try {
      console.log('Exercise data:', exercise);
      console.log('Exercise ID:', exercise.exercise_id);
      
      if (!exercise.exercise_id) {
        console.error('Exercise ID is missing:', exercise);
        return;
      }
      
      // Don't try to complete if already completed
      if (completed) {
        console.log('Exercise already completed, skipping API call');
        return;
      }
      
      const response = await fetch('/api/complete-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout_exercise_id: exercise.exercise_id }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('Failed to complete exercise:', result.error);
        // If it says already completed, update UI state
        if (result.error === 'Exercise already completed') {
          setCompleted(true);
        }
        return;
      }
      setCompleted(true);
      onComplete?.();
    } catch (error) {
      console.error('Error completing exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUncomplete = async () => {
    setLoading(true);
    try {
      console.log('Uncompleting exercise ID:', exercise.exercise_id);
      
      if (!exercise.exercise_id) {
        console.error('Exercise ID is missing for uncomplete:', exercise);
        return;
      }
      
      const response = await fetch('/api/complete-workout', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workout_exercise_id: exercise.exercise_id }),
      });
      const result = await response.json();
      if (!response.ok) {
        console.error('Failed to uncomplete exercise:', result.error);
        return;
      }
      setCompleted(false);
      // Notify parent of uncompletion to refresh stats
      onComplete?.();
    } catch (error) {
      console.error('Error uncompleting exercise:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card p-6 mb-4 transition-all ${completed ? 'opacity-60 border border-green-500/50' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{exercise.exercise?.name}</h3>
            {completed && <span className="text-green-400 text-sm">✓ Done</span>}
          </div>
          <p className="text-gray-400 text-sm mb-3">{exercise.exercise?.description}</p>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 nebula-bg rounded-full flex items-center justify-center text-white font-bold text-xs">
                {exercise.sets}
              </div>
              <span className="text-gray-300">sets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 nebula-bg rounded-full flex items-center justify-center text-white font-bold text-xs">
                {exercise.reps}
              </div>
              <span className="text-gray-300">reps</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/50 rounded text-purple-300 text-xs">
                {exercise.exercise?.difficulty}
              </span>
            </div>
          </div>
        </div>
        {exercise.exercise?.video_url && (
          <div className="ml-4">
            <a href={exercise.exercise.video_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm px-3 py-2">
              Watch Video
            </a>
          </div>
        )}
      </div>
      {showCompleteButton && (
        <div className="flex gap-3 mt-4">
          {!completed ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Marking Complete...' : 'Mark Complete'}
            </button>
          ) : (
            <button
              onClick={handleUncomplete}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : '✓ Completed — Click to Undo'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}