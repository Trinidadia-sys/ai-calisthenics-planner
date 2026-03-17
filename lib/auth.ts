import { supabase } from './supabaseClient';
import { User } from '../types';

export async function signUp(email: string, password: string, experienceLevel: User['experience_level']) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        experience_level: experienceLevel
      }
    }
  });

  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function getCurrentUser() {
  // Try up to 3 times with a short delay — the session may not be
  // written to storage immediately after login on first render
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    }

    // Wait 300ms before retrying
    if (attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  return null;
}

export async function createUserProfile(user: any, experienceLevel: User['experience_level']) {
  try {
    const { data, error } = await (supabase as any)
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        experience_level: experienceLevel
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

export async function updateUserProfile(updates: { experience_level?: User['experience_level'] }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('No authenticated user found');
  }

  const { data, error } = await (supabase as any)
    .from('users')
    .upsert({
      id: currentUser.id,
      email: currentUser.email!,
      ...updates
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}