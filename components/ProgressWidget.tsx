'use client';

import { motion } from 'framer-motion';

interface ProgressWidgetProps {
  weeklyWorkouts: number;
  currentStreak: number;
  totalWorkouts: number;
  weeklyGoal: number;
}

export default function ProgressWidget({ 
  weeklyWorkouts, 
  currentStreak, 
  totalWorkouts, 
  weeklyGoal 
}: ProgressWidgetProps) {
  const weeklyProgress = (weeklyWorkouts / weeklyGoal) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-6"
    >
      <h3 className="text-xl font-bold mb-6 text-gradient">Your Progress</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{weeklyWorkouts}</div>
          <div className="text-xs text-gray-400">This Week</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{currentStreak}</div>
          <div className="text-xs text-gray-400">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-pink-400">{totalWorkouts}</div>
          <div className="text-xs text-gray-400">Total Workouts</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Weekly Goal</span>
          <span className="text-gray-300">{weeklyWorkouts}/{weeklyGoal}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(weeklyProgress, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-2 nebula-bg rounded-full"
          />
        </div>
      </div>

      {weeklyProgress >= 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-3 bg-green-500/20 border border-green-500/50 rounded-lg"
        >
          <div className="text-green-400 text-sm font-semibold">🎉 Weekly Goal Achieved!</div>
        </motion.div>
      )}
    </motion.div>
  );
}
