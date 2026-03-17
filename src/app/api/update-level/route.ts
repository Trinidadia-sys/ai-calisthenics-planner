import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabaseServer';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { ExperienceLevel } from '@/types';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { experience_level } = body;

    if (!experience_level) {
      return NextResponse.json({ error: 'experience_level is required' }, { status: 400 });
    }

    const validLevels: ExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
    if (!validLevels.includes(experience_level)) {
      return NextResponse.json({ error: 'Invalid experience level' }, { status: 400 });
    }

    // Update Supabase Auth metadata — this is the source of truth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: { experience_level } }
    );

    if (authError) {
      console.error('Error updating user metadata:', authError);
      return NextResponse.json({ error: 'Failed to update experience level' }, { status: 500 });
    }

    // Best-effort update of the users table — log failures but never block the response.
    // The auth metadata update above is the source of truth, so a DB sync failure
    // (e.g. RLS violation, row not found) should not fail the whole request.
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({ experience_level })
      .eq('id', user.id);

    if (dbError) {
      console.warn('Non-blocking: failed to sync experience_level to users table:', dbError.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        experience_level,
      },
    });

  } catch (error: any) {
    console.error('Error updating experience level:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update experience level' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        experience_level: user.user_metadata?.experience_level || 'Beginner',
      },
    });

  } catch (error: any) {
    console.error('Error fetching experience level:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch experience level' },
      { status: 500 }
    );
  }
}