import { createClient } from '@supabase/supabase-js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} — copy .env.example to .env and fill it in`);
  return value;
}

export const API_URL = required('EXPO_PUBLIC_SUPABASE_URL');
export const ANON_KEY = required('EXPO_PUBLIC_SUPABASE_ANON_KEY');
export const SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY');

export function adminClient() {
  return createClient(API_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
