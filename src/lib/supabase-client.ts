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

export type UserProfileRole = 'APPLICANT' | 'LMO' | 'GATC' | 'ADMIN' | 'Trader' | 'LMO Officer';

export interface ProfileRecord {
  id: string; // Auth UUID
  full_name: string;
  aadhaar_number?: string;
  role: UserProfileRole | string;
  email?: string;
  created_at?: string;
}

/**
 * Normalizes any role representation to both internal store UserRole, display label, and target dashboard path.
 */
export function normalizeUserRole(rawRole?: string): {
  storeRole: 'APPLICANT' | 'LMO' | 'GATC' | 'ADMIN';
  displayRole: 'Trader' | 'LMO Officer' | 'GATC';
  redirectPath: string;
} {
  if (!rawRole) {
    return {
      storeRole: 'APPLICANT',
      displayRole: 'Trader',
      redirectPath: '/trader/dashboard',
    };
  }

  const normalized = rawRole.trim().toUpperCase();

  if (
    normalized === 'LMO' ||
    normalized === 'LMO OFFICER' ||
    normalized.includes('OFFICER') ||
    normalized === 'ADMIN'
  ) {
    return {
      storeRole: 'LMO',
      displayRole: 'LMO Officer',
      redirectPath: '/admin/traders',
    };
  }

  if (normalized === 'GATC' || normalized.includes('GATC')) {
    return {
      storeRole: 'GATC',
      displayRole: 'GATC',
      redirectPath: '/gatc/dashboard',
    };
  }

  if (
    normalized === 'TRADER' ||
    normalized === 'APPLICANT' ||
    normalized.includes('TRADER')
  ) {
    return {
      storeRole: 'APPLICANT',
      displayRole: 'Trader',
      redirectPath: '/trader/dashboard',
    };
  }

  return {
    storeRole: 'APPLICANT',
    displayRole: 'Trader',
    redirectPath: '/trader/dashboard',
  };
}

/**
 * Maps a user role string to the required target redirect path
 * - 'LMO Officer' / 'LMO' / 'ADMIN' -> /admin/traders
 * - 'Trader' / 'APPLICANT' -> /trader/dashboard
 * - 'GATC' -> /gatc/dashboard
 */
export function getRedirectPathForRole(role?: string): string {
  return normalizeUserRole(role).redirectPath;
}

/**
 * Fetches the user profile record from the Supabase 'profiles' table by Auth UUID.
 */
export async function fetchUserProfile(userId: string): Promise<ProfileRecord | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data as ProfileRecord;
    }
  } catch (err) {
    console.warn('Error fetching user profile:', err);
  }
  return null;
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
          aadhaar_number: profile.aadhaar_number || '123456789012',
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
