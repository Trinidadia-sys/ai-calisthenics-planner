'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 nebula-bg opacity-20"></div>
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        <nav className="flex justify-between items-center p-8">
          <div className="text-2xl font-bold text-gradient">AI Calisthenics</div>
          <div className="flex gap-4">
            <Link href="/login" className="btn-secondary">Login</Link>
            <Link href="/signup" className="btn-primary">Sign Up</Link>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">AI-Powered</span>
              <br />
              Calisthenics Plans
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Generate personalized workout plans using AI that analyzes popular YouTube calisthenics routines.
              Get custom programs tailored to your experience level.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup" className="btn-primary text-lg px-8 py-4">
                Generate My Workout Plan
              </Link>
              <Link href="#features" className="btn-secondary text-lg px-8 py-4">
                Learn More
              </Link>
            </div>
          </motion.div>

          <motion.div
            id="features"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 nebula-bg rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Generated Plans</h3>
              <p className="text-gray-400">Advanced AI analyzes your experience level and creates personalized workout programs</p>
            </div>

            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 nebula-bg rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">YouTube Integration</h3>
              <p className="text-gray-400">Exercises sourced from popular calisthenics YouTube channels with video references</p>
            </div>

            <div className="glass-card p-8 text-center">
              <div className="w-16 h-16 nebula-bg rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-gray-400">Monitor your workout completion, track streaks, and visualize your fitness journey</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-12 text-gradient">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Sign Up', desc: 'Create your account and select your experience level' },
                { step: '2', title: 'Generate Plan', desc: 'AI creates a personalized workout program for you' },
                { step: '3', title: 'Customize', desc: 'Adjust exercises, sets, and reps to your preference' },
                { step: '4', title: 'Track Progress', desc: 'Complete workouts and monitor your fitness journey' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="relative">
                  <div className="w-12 h-12 nebula-bg rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold">
                    {step}
                  </div>
                  <h4 className="font-semibold mb-2">{title}</h4>
                  <p className="text-gray-400 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}