'use client';

import { motion } from 'framer-motion';
import { ExperienceLevel } from '@/types';

interface PlanGeneratorButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function PlanGeneratorButton({ onClick, loading = false, disabled = false }: PlanGeneratorButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: loading || disabled ? 1 : 1.05 }}
      whileTap={{ scale: loading || disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={loading || disabled}
      className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Generating Your Plan...
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate New Workout Plan
        </div>
      )}
      
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 nebula-bg opacity-0"
        animate={{ opacity: loading ? 0.3 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}
