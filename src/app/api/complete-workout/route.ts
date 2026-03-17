import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabaseServer';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workout_exercise_id = searchParams.get('workout_exercise_id');

    if (workout_exercise_id) {
      // Check specific exercise completion
      const { data, error } = await supabaseAdmin
        .from('exercise_completions')
        .select('*')
        .eq('user_id', user.id)
        .eq('workout_exercise_id', workout_exercise_id);

      if (error) {
        console.error('Error checking exercise completion:', error);
        return NextResponse.json({ error: 'Failed to check completion' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        data: data,
        completed: data.length > 0 
      });
    } else {
      // Get all user completions and calculate stats
      const { data: completions, error } = await supabaseAdmin
        .from('exercise_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching completions:', error);
        return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 });
      }

      // Calculate weekly workouts (exercises completed this week)
      const now = new Date();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      const weeklyWorkouts = completions?.filter(c => 
        new Date(c.completed_at) >= weekStart
      ).length || 0;

      // Calculate current streak based on consecutive days with 4+ exercises
      let currentStreak = 0;
      const dailyExercises = new Map();
      
      // Group completions by date
      completions?.forEach(completion => {
        const date = new Date(completion.completed_at).toDateString();
        const count = dailyExercises.get(date) || 0;
        dailyExercises.set(date, count + 1);
      });

      console.log('Daily exercises map:', Object.fromEntries(dailyExercises));

      // Calculate streak by counting all days with 4+ exercises
      const dates = Array.from(dailyExercises.keys()).sort((a, b) => 
        new Date(a).getTime() - new Date(b).getTime()
      );
      
      console.log('Sorted dates:', dates);
      
      let consecutiveDays = 0;
      let lastDate: Date | null = null;
      
      for (const dateStr of dates) {
        const exercisesCount = dailyExercises.get(dateStr) || 0;
        console.log(`Date: ${dateStr}, Exercises: ${exercisesCount}`);
        
        if (exercisesCount >= 4) {
          console.log(`4+ exercises found for ${dateStr}`);
          if (lastDate === null) {
            // First day with 4+ exercises
            consecutiveDays = 1;
            console.log('Starting new streak: 1');
          } else {
            // Check if this date is exactly 1 day after the last date
            const currentDate = new Date(dateStr);
            const dayDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            
            console.log(`Day difference: ${dayDiff}`);
            
            if (dayDiff === 1) {
              // Consecutive day
              consecutiveDays++;
              console.log(`Consecutive day, streak now: ${consecutiveDays}`);
            } else if (dayDiff > 1) {
              // Gap detected, start new streak
              consecutiveDays = 1;
              console.log(`Gap detected, new streak: 1`);
            }
            // dayDiff === 0 shouldn't happen, dayDiff < 0 means dates are out of order
          }
          lastDate = new Date(dateStr);
          currentStreak = Math.max(currentStreak, consecutiveDays);
          console.log(`Current max streak: ${currentStreak}`);
        }
      }
      
      console.log(`Final streak calculated: ${currentStreak}`);

      const stats = {
        weekly_workouts: weeklyWorkouts,
        current_streak: currentStreak,
        total_workouts: completions?.length || 0,
        weekly_goal: 4,
      };

      return NextResponse.json({ success: true, data: stats });
    }

  } catch (error: any) {
    console.error('Error in GET /api/complete-workout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch workout completions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workout_exercise_id } = body;

    if (!workout_exercise_id) {
      return NextResponse.json({ error: 'workout_exercise_id is required' }, { status: 400 });
    }

    // Check if already completed using a more robust approach
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('exercise_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_exercise_id', workout_exercise_id);

    if (checkError) {
      console.error('Error checking existing completion:', checkError);
      return NextResponse.json({ error: 'Failed to check completion' }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      console.log('Exercise already completed, returning success');
      return NextResponse.json({ success: true, data: existing[0] });
    }

    // Use supabaseAdmin to bypass RLS issues temporarily
    const { data, error } = await supabaseAdmin
      .from('exercise_completions')
      .insert({ 
        user_id: user.id, 
        workout_exercise_id 
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to complete exercise' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to complete exercise' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workout_exercise_id } = body;

    // Use supabaseAdmin to bypass RLS issues temporarily
    if (workout_exercise_id) {
      // Delete specific exercise completion
      const { error } = await supabaseAdmin
        .from('exercise_completions')
        .delete()
        .eq('user_id', user.id)
        .eq('workout_exercise_id', workout_exercise_id);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to uncomplete exercise' }, { status: 500 });
      }
    } else {
      // Delete all user completions (for new plan generation)
      const { error } = await supabaseAdmin
        .from('exercise_completions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Failed to clear progress' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to uncomplete exercise' },
      { status: 500 }
    );
  }
}