import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '../../../../lib/supabaseServer';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // scope: 'global' invalidates the session on Supabase's server
  // so the middleware can't refresh it on subsequent requests
  await supabase.auth.signOut({ scope: 'global' });

  const response = NextResponse.json({ success: true });

  // Clear all Supabase auth cookies
  request.cookies.getAll().forEach(cookie => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
    }
  });

  return response;
}