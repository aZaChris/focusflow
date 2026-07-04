import type { Session } from '@supabase/supabase-js';
import { shouldRedirectToLogin } from '@/features/auth/routeGuard';

function fakeSession(emailConfirmed: boolean): Session {
  return { user: { email_confirmed_at: emailConfirmed ? '2026-01-01' : null } } as Session;
}

describe('shouldRedirectToLogin (FR-006/FR-013)', () => {
  it('redirects a signed-out user away from a non-auth screen', () => {
    expect(shouldRedirectToLogin(null, ['(tabs)', 'settings'])).toBe(true);
  });

  it('redirects an unverified session away from a non-auth screen', () => {
    expect(shouldRedirectToLogin(fakeSession(false), ['(tabs)', 'settings'])).toBe(true);
  });

  it('does not redirect a verified, signed-in user', () => {
    expect(shouldRedirectToLogin(fakeSession(true), ['(tabs)', 'settings'])).toBe(false);
  });

  it('does not redirect while already on an auth screen (avoids a redirect loop)', () => {
    expect(shouldRedirectToLogin(null, ['(auth)', 'login'])).toBe(false);
  });
});
