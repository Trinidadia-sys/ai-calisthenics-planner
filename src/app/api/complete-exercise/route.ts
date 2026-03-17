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
      return NextResponse.json({ completed: false });
    }

    const { searchParams } = new URL(request.url);
    const workout_exercise_id = searchParams.get('workout_exercise_id');

    if (!workout_exercise_id) {
      return NextResponse.json({ completed: false });
    }

    const { data, error } = await supabaseAdmin
      .from('exercise_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_exercise_id', workout_exercise_id)
      .single();

    return NextResponse.json({ completed: !!data && !error });

  } catch (error: any) {
    return NextResponse.json({ completed: false });
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

    const { data: existing, error: checkError } = await supabaseAdmin
      .from('exercise_completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('workout_exercise_id', workout_exercise_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check completion' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ error: 'Exercise already completed' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('exercise_completions')
      .insert({ user_id: user.id, workout_exercise_id })
      .select()
      .single();

    if (error) {
      console.error('Error completing exercise:', error);
      return NextResponse.json({ error: 'Failed to complete exercise' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to complete exercise' }, { status: 500 });
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

    if (!workout_exercise_id) {
      return NextResponse.json({ error: 'workout_exercise_id is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('exercise_completions')
      .delete()
      .eq('user_id', user.id)
      .eq('workout_exercise_id', workout_exercise_id);

    if (error) {
      return NextResponse.json({ error: 'Failed to uncomplete exercise' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to uncomplete exercise' }, { status: 500 });
  }
}