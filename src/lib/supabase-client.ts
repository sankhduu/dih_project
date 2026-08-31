import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://irirruitftauycezkofr.supabase.co';

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyaXJydWl0ZnRhdXljZXprb2ZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDQwNjMsImV4cCI6MjEwMzY4MDA2M30.snp0o-TyGBRBuV6bIdqRoYp6QSATAcO_mjMY2ZVgwto';

// Browser-safe Supabase client singleton
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserProfileRole = 'APPLICANT' | 'LMO' | 'GATC' | 'ADMIN';

export interface ProfileRecord {
  id: string; // Auth UUID
  full_name: string;
  aadhaar_number: string;
  role: UserProfileRole | string;
  email?: string;
  created_at?: string;
}

/**
 * Inserts or updates the user profile record in the Supabase 'profiles' table.
 */
export async function syncUserProfileToSupabase(profile: ProfileRecord) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: profile.id,
          full_name: profile.full_name,
          aadhaar_number: profile.aadhaar_number,
          role: profile.role,
          email: profile.email || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Note on Supabase profiles table upsert:', error.message);
    }
    return { data, error };
  } catch (err) {
    console.warn('Error syncing user profile:', err);
    return { data: null, error: err };
  }
}
