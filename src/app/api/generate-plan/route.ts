import { NextRequest, NextResponse } from 'next/server';
import { WorkoutPlanGenerator } from '@/ai/generateWorkoutPlan';
import { createSupabaseServerClient } from '../../../../lib/supabaseServer';
import { WorkoutPlanRequest } from '@/types';

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Auth session missing!' }, { status: 401 });
    }

    const body: WorkoutPlanRequest = await request.json();

    if (!body.experience_level || !body.training_frequency) {
      return NextResponse.json(
        { error: 'Missing required fields: experience_level, training_frequency' },
        { status: 400 }
      );
    }

    if (body.training_frequency < 1 || body.training_frequency > 7) {
      return NextResponse.json(
        { error: 'Training frequency must be between 1 and 7 days' },
        { status: 400 }
      );
    }

    const generator = new WorkoutPlanGenerator();
    const workoutPlan = await generator.generateWorkoutPlan(user.id, body);

    return NextResponse.json({ success: true, data: workoutPlan });

  } catch (error: any) {
    console.error('Error generating workout plan:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate workout plan',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Auth session missing!' }, { status: 401 });
    }

    const generator = new WorkoutPlanGenerator();
    const plans = await generator.getUserWorkoutPlans(user.id);

    return NextResponse.json({ success: true, data: plans });

  } catch (error: any) {
    console.error('Error fetching workout plans:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch workout plans',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Auth session missing!' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    const generator = new WorkoutPlanGenerator();
    await generator.deleteWorkoutPlan(planId, user.id);

    return NextResponse.json({ success: true, message: 'Workout plan deleted successfully' });

  } catch (error: any) {
    console.error('Error deleting workout plan:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to delete workout plan',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
