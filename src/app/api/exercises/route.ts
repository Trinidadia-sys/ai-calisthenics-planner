import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { ExerciseQueryService } from '@/rag/queryExercises';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '20');

    let exercises = [];

    if (search) {
      // Search exercises
      const queryService = new ExerciseQueryService(process.env.OPENAI_API_KEY!);
      exercises = await queryService.searchExercises(search, limit);
    } else if (difficulty) {
      // Get exercises by difficulty
      const { data, error } = await supabaseAdmin
        .from('exercises')
        .select('*')
        .eq('difficulty', difficulty)
        .limit(limit);

      if (error) {
        console.error('Error fetching exercises by difficulty:', error);
        return NextResponse.json(
          { error: 'Failed to fetch exercises' },
          { status: 500 }
        );
      }

      exercises = data || [];
    } else {
      // Get all exercises with limit
      const { data, error } = await supabaseAdmin
        .from('exercises')
        .select('*')
        .limit(limit);

      if (error) {
        console.error('Error fetching exercises:', error);
        return NextResponse.json(
          { error: 'Failed to fetch exercises' },
          { status: 500 }
        );
      }

      exercises = data || [];
    }

    return NextResponse.json({
      success: true,
      data: exercises
    });

  } catch (error: any) {
    console.error('Error in exercises API:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch exercises',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields: name, difficulty' },
        { status: 400 }
      );
    }

    // Create new exercise
    const { data, error } = await supabaseAdmin
      .from('exercises')
      .insert({
        name: body.name,
        difficulty: body.difficulty,
        description: body.description || null,
        video_url: body.video_url || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating exercise:', error);
      return NextResponse.json(
        { error: 'Failed to create exercise' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Error creating exercise:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create exercise',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
