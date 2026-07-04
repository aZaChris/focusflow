import type { Session } from '@supabase/supabase-js';

// FR-006/FR-013: no non-auth screen for a signed-out or unverified session — pulled out
// of app/_layout.tsx as a pure function so the redirect decision is unit-testable without
// rendering the navigation tree.
export function shouldRedirectToLogin(session: Session | null, segments: string[]): boolean {
  const inAuthGroup = segments[0] === '(auth)';
  const isVerified = !!session?.user.email_confirmed_at;
  return (!session || !isVerified) && !inAuthGroup;
}
