'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { WorkoutPlan, User, ExperienceLevel } from '@/types';
import ProgressWidget from '@/components/ProgressWidget';
import WorkoutDayCard from '@/components/WorkoutDayCard';
import PlanGeneratorButton from '@/components/PlanGeneratorButton';

const EXPERIENCE_LEVELS: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [planOptions, setPlanOptions] = useState({
    training_frequency: 3,
    goals: 'general_fitness',
  });

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel>('Beginner');
  const [updatingLevel, setUpdatingLevel] = useState(false);
  const [levelError, setLevelError] = useState('');

  const [progressStats, setProgressStats] = useState({
    weeklyWorkouts: 0,
    currentStreak: 0,
    totalWorkouts: 0,
    weeklyGoal: 4,
  });

  const router = useRouter();

  const loadProgressStats = async () => {
    try {
      const res = await fetch('/api/complete-workout');
      const result = await res.json();
      if (result.success && result.data) {
        // Calculate total exercises from current plan if available
        const totalExercises = currentPlan?.workout_days?.reduce((total: number, day: any) => {
          return total + (day.workout_exercises?.length || 0);
        }, 0) || 0;
        
        setProgressStats({
          weeklyWorkouts: result.data.weekly_workouts || 0,
          currentStreak: result.data.current_streak || 0,
          totalWorkouts: totalExercises,
          weeklyGoal: totalExercises,
        });
      }
    } catch (error) {
      console.error('Error loading progress stats:', error);
    }
  };

  const mapPlan = (plan: any): WorkoutPlan => ({
    ...plan,
    workout_days: plan.workout_days?.map((day: any) => ({
      ...day,
      workout_exercises: day.workout_exercises?.map((we: any) => ({
        ...we,
        exercise: we.exercises || we.exercise,
      })),
    })),
  });

  useEffect(() => {
    let initialCheckDone = false;

    const loadPlan = async (currentUser: any) => {
      try {
        const res = await fetch('/api/generate-plan');
        const result = await res.json();
        if (result.success && result.data?.length > 0) {
          setCurrentPlan(mapPlan(result.data[0]));
        }
      } catch (error) {
        console.error('Error loading plan:', error);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth]', event, session ? 'has session' : 'no session');

        if (!session) {
          if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
            console.log('[Auth] No session, redirecting to login');
            router.replace('/login');
          }
          return;
        }

        // Only process if we haven't done the initial check or this is a new sign-in
        if (!initialCheckDone || event === 'SIGNED_IN') {
          initialCheckDone = true;
          const currentUser = session.user;
          const level = (currentUser.user_metadata?.experience_level as ExperienceLevel) || 'Beginner';

          setUser({
            id: currentUser.id,
            email: currentUser.email ?? '',
            experience_level: level,
            created_at: currentUser.created_at,
          });

          setSelectedLevel(level);
          
          // Small delay to ensure session is fully established
          await new Promise(resolve => setTimeout(resolve, 100));
          await loadPlan(currentUser);
          await loadProgressStats();
          
          // Calculate total exercises from the plan
          if (currentPlan) {
            const totalExercises = currentPlan.workout_days?.reduce((total: number, day: any) => {
              return total + (day.workout_exercises?.length || 0);
            }, 0) || 0;
            
            setProgressStats(prev => ({
              ...prev,
              totalWorkouts: totalExercises,
              weeklyGoal: totalExercises
            }));
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setModalError('');
    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experience_level: user?.experience_level || 'Beginner',
          training_frequency: planOptions.training_frequency,
          preferences: { goals: planOptions.goals },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate plan');
      }

      const newPlan = mapPlan(result.data);
      setCurrentPlan(newPlan);
      
      // Clear previous progress data from database
      try {
        const clearResponse = await fetch('/api/complete-workout', { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const clearResult = await clearResponse.json();
        console.log('Progress cleared:', clearResult);
      } catch (error) {
        console.error('Error clearing previous progress:', error);
      }
      
      // Small delay to ensure database operation completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update total exercises count and reset progress
      const totalExercises = newPlan.workout_days?.reduce((total: number, day: any) => {
        return total + (day.workout_exercises?.length || 0);
      }, 0) || 0;
      
      setProgressStats({
        weeklyWorkouts: 0,
        currentStreak: 0,
        totalWorkouts: totalExercises,
        weeklyGoal: totalExercises,
      });
      
      setShowModal(false);
    } catch (error: any) {
      console.error('Error generating plan:', error);
      setModalError(error.message || 'Failed to generate workout plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleUpdateLevel = async () => {
    if (!selectedLevel) return;
    setUpdatingLevel(true);
    setLevelError('');
    try {
      const response = await fetch('/api/update-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experience_level: selectedLevel }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update level');
      }

      setUser((prev) => prev ? { ...prev, experience_level: selectedLevel } : prev);
      setShowLevelModal(false);
    } catch (error: any) {
      console.error('Error updating experience level:', error);
      setLevelError(error.message || 'Failed to update experience level. Please try again.');
    } finally {
      setUpdatingLevel(false);
    }
  };

  const handleSignOut = async () => {
    console.log('Sign out clicked');
    try {
      console.log('Calling /api/signout...');
      const res = await fetch('/api/signout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('Response status:', res.status);
      if (res.ok) {
        window.location.replace('/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.replace('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 nebula-bg opacity-10"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Generate Plan Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card p-8 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold mb-2 text-gradient">Generate Workout Plan</h2>
              <p className="text-gray-400 text-sm mb-6">Customize your AI-generated calisthenics plan</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Training Days per Week
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      onClick={() => setPlanOptions((p) => ({ ...p, training_frequency: days }))}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        planOptions.training_frequency === days
                          ? 'nebula-bg text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {days}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Primary Goal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'general_fitness', label: '💪 General Fitness' },
                    { value: 'strength', label: '🏋️ Build Strength' },
                    { value: 'weight_loss', label: '🔥 Weight Loss' },
                    { value: 'flexibility', label: '🧘 Flexibility' },
                    { value: 'endurance', label: '🏃 Endurance' },
                    { value: 'muscle_gain', label: '📈 Muscle Gain' },
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      onClick={() => setPlanOptions((p) => ({ ...p, goals: goal.value }))}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-all text-left ${
                        planOptions.goals === goal.value
                          ? 'nebula-bg text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                  {modalError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowModal(false); setModalError(''); }}
                  className="flex-1 btn-secondary"
                  disabled={generatingPlan}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGeneratePlan}
                  disabled={generatingPlan}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {generatingPlan ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    '⚡ Generate Plan'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Level Modal */}
      <AnimatePresence>
        {showLevelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card p-8 w-full max-w-sm"
            >
              <h2 className="text-2xl font-bold mb-2 text-gradient">Update Experience Level</h2>
              <p className="text-gray-400 text-sm mb-6">Select your current fitness experience level</p>

              <div className="flex flex-col gap-2 mb-8">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold transition-all text-left ${
                      selectedLevel === level
                        ? 'nebula-bg text-white'
                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>

              {levelError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">
                  {levelError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowLevelModal(false); setLevelError(''); }}
                  className="flex-1 btn-secondary"
                  disabled={updatingLevel}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLevel}
                  disabled={updatingLevel}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {updatingLevel ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <nav className="flex justify-between items-center p-8">
          <div className="text-2xl font-bold text-gradient">AI Calisthenics</div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">Welcome, {user?.email}</div>
            <button onClick={handleSignOut} className="btn-secondary text-sm">
              Sign Out
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
            <p className="text-gray-400">Track your progress and manage your workout plans</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {currentPlan ? (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="glass-card p-6 mb-6">
                    <h2 className="text-2xl font-bold mb-4 text-gradient">{currentPlan.title}</h2>
                    <p className="text-gray-400 mb-6">
                      Generated on {new Date(currentPlan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {currentPlan.workout_days?.map((day) => (
                    <WorkoutDayCard 
                      key={day.id} 
                      workoutDay={day} 
                      showCompleteButtons={true}
                      onCompleteExercise={async (exerciseId: string) => {
                        console.log('Exercise state changed:', exerciseId);
                        // Refresh progress stats after completion/uncompletion
                        await loadProgressStats();
                      }}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="glass-card p-8 text-center"
                >
                  <div className="mb-6">
                    <div className="w-16 h-16 nebula-bg rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Workout Plan Yet</h3>
                    <p className="text-gray-400 mb-6">
                      Generate your first personalized AI workout plan to get started
                    </p>
                  </div>
                  <PlanGeneratorButton onClick={() => setShowModal(true)} loading={generatingPlan} />
                </motion.div>
              )}

              {currentPlan && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mt-6"
                >
                  <PlanGeneratorButton onClick={() => setShowModal(true)} loading={generatingPlan} />
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <ProgressWidget
                  weeklyWorkouts={progressStats.weeklyWorkouts}
                  currentStreak={progressStats.currentStreak}
                  totalWorkouts={progressStats.totalWorkouts}
                  weeklyGoal={progressStats.weeklyGoal}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-card p-6"
              >
                <h3 className="text-xl font-bold mb-4 text-gradient">Experience Level</h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {user?.experience_level || 'Beginner'}
                  </div>
                  <button
                    className="btn-secondary text-sm"
                    onClick={() => {
                      setSelectedLevel(user?.experience_level || 'Beginner');
                      setLevelError('');
                      setShowLevelModal(true);
                    }}
                  >
                    Update Level
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}