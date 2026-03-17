import { WorkoutPlanAgent } from '../agents/workoutPlanAgent';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { WorkoutPlanRequest, GeneratedWorkoutPlan, WorkoutPlan, WorkoutDay, Exercise, ExperienceLevel, WorkoutGoal, GOAL_LABEL_MAP } from '../types';

const LEVEL_ORDER: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export class WorkoutPlanGenerator {
  private workoutPlanAgent: WorkoutPlanAgent;

  constructor() {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    this.workoutPlanAgent = new WorkoutPlanAgent(openaiApiKey);
  }

  async generateWorkoutPlan(userId: string, request: WorkoutPlanRequest): Promise<WorkoutPlan> {
    try {
      console.log('Generating workout plan for user:', userId, 'with request:', request);

      const userLevelIndex = LEVEL_ORDER.indexOf(request.experience_level);
      const levelsToInclude = LEVEL_ORDER.slice(
        Math.max(0, userLevelIndex - 1),
        userLevelIndex + 1
      );

      // Resolve goal — handle both direct WorkoutGoal and legacy { goals: string } shape
      // from page.tsx which sends preferences: { goals: 'flexibility' }
      let resolvedGoal: WorkoutGoal | undefined;
      if (request.goal) {
        resolvedGoal = request.goal;
      } else if (request.preferences && !Array.isArray(request.preferences)) {
        // Legacy: preferences sent as an object { goals: 'flexibility' }
        const prefsObj = request.preferences as any;
        if (prefsObj.goals) {
          resolvedGoal = GOAL_LABEL_MAP[prefsObj.goals] ?? undefined;
        }
      } else if (Array.isArray(request.preferences) && request.preferences.length > 0) {
        resolvedGoal = GOAL_LABEL_MAP[request.preferences[0]] ?? undefined;
      }

      console.log(`Resolved goal: ${resolvedGoal ?? 'none — fetching all categories'}`);

      // Build query — filter by category if a goal was resolved, otherwise fetch all
      let query = supabaseAdmin
        .from('exercises')
        .select('*')
        .in('difficulty', levelsToInclude)
        .limit(100);

      if (resolvedGoal) {
        // Include exercises matching the goal AND general fitness exercises for variety
        query = supabaseAdmin
          .from('exercises')
          .select('*')
          .in('difficulty', levelsToInclude)
          .in('category', [resolvedGoal, 'General Fitness'])
          .limit(100);
      }

      const { data: rawExercises, error: exercisesError } = await query;

      console.log(
        `Found ${rawExercises?.length} exercises for levels [${levelsToInclude.join(', ')}]` +
        (resolvedGoal ? ` and goal "${resolvedGoal}"` : ''),
        exercisesError?.message ?? ''
      );

      if (exercisesError) {
        throw new Error(`Failed to fetch exercises: ${exercisesError.message}`);
      }

      if (!rawExercises || rawExercises.length === 0) {
        throw new Error('No exercises found for the specified criteria');
      }

      // Shuffle so every generation draws a different mix
      const exercises = [...rawExercises]
        .sort(() => Math.random() - 0.5)
        .slice(0, 50) as Exercise[];

      const generatedPlan = await this.workoutPlanAgent.generateWorkoutPlan(
        request.experience_level,
        request.training_frequency,
        exercises,
        resolvedGoal ? [resolvedGoal] : request.preferences,
      );

      console.log('Generated workout plan structure:', generatedPlan);

      const savedPlan = await this.saveWorkoutPlan(userId, generatedPlan, request, resolvedGoal);

      console.log('Saved workout plan with ID:', savedPlan.id);
      return savedPlan;

    } catch (error) {
      console.error('Error generating workout plan:', error);
      throw error;
    }
  }

  private async saveWorkoutPlan(
    userId: string,
    generatedPlan: GeneratedWorkoutPlan,
    request: WorkoutPlanRequest,
    resolvedGoal?: WorkoutGoal
  ): Promise<WorkoutPlan> {
    try {
      // Include goal in the plan title if one was selected
      const goalSuffix = resolvedGoal ? ` — ${resolvedGoal}` : '';
      const { data: plan, error: planError } = await (supabaseAdmin
        .from('workout_plans')
        .insert({
          user_id: userId,
          title: `${request.experience_level} Calisthenics Plan - ${request.training_frequency} days/week${goalSuffix}`,
        })
        .select()
        .single() as any);

      if (planError || !plan) {
        console.error('Error creating workout plan:', planError);
        throw planError || new Error('Failed to create workout plan');
      }

      const workoutDays: WorkoutDay[] = [];

      for (const dayPlan of generatedPlan.week_plan) {
        const { data: workoutDay, error: dayError } = await supabaseAdmin
          .from('workout_days')
          .insert({
            plan_id: plan.id,
            day_name: dayPlan.day,
            order_index: generatedPlan.week_plan.indexOf(dayPlan),
          })
          .select()
          .single();

        if (dayError || !workoutDay) {
          console.error('Error creating workout day:', dayError);
          throw dayError || new Error('Failed to create workout day');
        }

        const insertedExercises: any[] = [];

        for (const exercisePlan of dayPlan.exercises) {
          const exercise = await this.findOrCreateExercise(exercisePlan);

          const { data: workoutExercise, error: workoutExerciseError } = await supabaseAdmin
            .from('workout_exercises')
            .insert({
              workout_day_id: workoutDay.id,
              exercise_id: exercise.id,
              sets: exercisePlan.sets,
              reps: exercisePlan.reps,
              order_index: dayPlan.exercises.indexOf(exercisePlan),
            })
            .select()
            .single();

          if (workoutExerciseError || !workoutExercise) {
            console.error('Error creating workout exercise:', workoutExerciseError);
            throw workoutExerciseError;
          }

          insertedExercises.push({ workoutExercise, exercisePlan, exercise });
        }

        workoutDays.push({
          ...workoutDay,
          workout_exercises: insertedExercises.map(({ workoutExercise, exercisePlan, exercise }) => ({
            id: workoutExercise.id,
            workout_day_id: workoutDay.id,
            exercise_id: exercise.id,
            sets: exercisePlan.sets,
            reps: exercisePlan.reps,
            order_index: workoutExercise.order_index,
            exercise: {
              id: exercise.id,
              name: exercisePlan.name,
              difficulty: exercisePlan.difficulty,
              description: `${exercisePlan.name} - ${exercisePlan.sets} sets of ${exercisePlan.reps} reps`,
              video_url: exercisePlan.video || undefined,
            },
          })),
        });
      }

      return { ...plan, workout_days: workoutDays };

    } catch (error) {
      console.error('Error saving workout plan:', error);
      throw error;
    }
  }

  private async findOrCreateExercise(exercisePlan: any): Promise<any> {
    try {
      const { data: existingExercise, error: findError } = await supabaseAdmin
        .from('exercises')
        .select('*')
        .ilike('name', exercisePlan.name)
        .single();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding exercise:', findError);
        throw findError;
      }

      if (existingExercise) return existingExercise;

      const { data: newExercise, error: createError } = await supabaseAdmin
        .from('exercises')
        .insert({
          name: exercisePlan.name,
          difficulty: exercisePlan.difficulty,
          description: `${exercisePlan.name} - ${exercisePlan.sets} sets of ${exercisePlan.reps} reps`,
          video_url: exercisePlan.video || null,
        })
        .select()
        .single();

      if (createError || !newExercise) {
        console.error('Error creating exercise:', createError);
        throw createError || new Error('Failed to create exercise');
      }

      return newExercise;

    } catch (error) {
      console.error('Error in findOrCreateExercise:', error);
      throw error;
    }
  }

  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('workout_plans')
        .select(`
          *,
          workout_days (
            *,
            workout_exercises (
              *,
              exercises (*)
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user workout plans:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserWorkoutPlans:', error);
      throw error;
    }
  }

  async deleteWorkoutPlan(planId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('workout_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting workout plan:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteWorkoutPlan:', error);
      throw error;
    }
  }
}