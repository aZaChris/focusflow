import { API_URL, ANON_KEY, adminClient } from '../helpers/env';

// Real network round-trips (several sequential calls in the lockout test) — longer than
// the default 5s per-test budget.
jest.setTimeout(30000);

// contracts/auth-contracts.md — auth-signin Edge Function: success / invalid_credentials
// / locked (mfa_required is out of scope until Phase 8/User Story 6 adds MFA enrollment).
const FUNCTIONS_URL = `${API_URL}/functions/v1/auth-signin`;

const admin = adminClient();

async function callSignIn(email: string, password: string) {
  const res = await fetch(FUNCTIONS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, body: await res.json() };
}

describe('auth-signin contract', () => {
  it('returns 200 status "ok" with a session for correct credentials', async () => {
    const email = `signin-ok-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    await admin.auth.admin.createUser({ email, password, email_confirm: true });

    const { status, body } = await callSignIn(email, password);
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.session.access_token).toEqual(expect.any(String));
    expect(body.session.refresh_token).toEqual(expect.any(String));
  });

  it('returns 401 status "invalid_credentials" for a wrong password', async () => {
    const email = `signin-wrong-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    await admin.auth.admin.createUser({ email, password, email_confirm: true });

    const { status, body } = await callSignIn(email, 'WrongPass1');
    expect(status).toBe(401);
    expect(body).toEqual({ status: 'invalid_credentials' });
  });

  it('returns the identical 401 shape for a never-registered email (FR-012)', async () => {
    const { status, body } = await callSignIn(`no-such-user-${Date.now()}@example.test`, 'Whatever1');
    expect(status).toBe(401);
    expect(body).toEqual({ status: 'invalid_credentials' });
  });

  it('returns 429 status "locked" after 5 failed attempts within 15 minutes (FR-011)', async () => {
    const email = `signin-lockout-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    await admin.auth.admin.createUser({ email, password, email_confirm: true });

    for (let i = 0; i < 4; i++) {
      const { status } = await callSignIn(email, 'WrongPass1');
      expect(status).toBe(401);
    }

    const { status, body } = await callSignIn(email, 'WrongPass1');
    expect(status).toBe(429);
    expect(body).toEqual({ status: 'locked', retry_after_seconds: 900 });
  });
});
