import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../../helpers/env';

// Real network round-trips (several sequential calls in the lockout test) — longer than
// the default 5s per-test budget.
jest.setTimeout(30000);

// quickstart.md Scenario 2 — sign-in, persistent session across an app "restart", and
// 5-attempt lockout / non-enumeration, against the Supabase project in .env.
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

// Stand-in for expo-secure-store: same on-disk-ish behavior (persists across client
// instances), enough to prove FR-005's "still signed in after restart" without a device.
function fakeSecureStore() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => Promise.resolve(store.get(key) ?? null),
    setItem: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  };
}

describe('sign-in and session persistence (Scenario 2)', () => {
  it('keeps the session readable by a fresh client instance sharing the same storage', async () => {
    const email = `signin-session-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    await admin.auth.admin.createUser({ email, password, email_confirm: true });

    const { status, body } = await callSignIn(email, password);
    expect(status).toBe(200);
    expect(body.status).toBe('ok');

    const storage = fakeSecureStore();
    const appLaunch1 = createClient(API_URL, ANON_KEY, { auth: { storage, persistSession: true } });
    await appLaunch1.auth.setSession({
      access_token: body.session.access_token,
      refresh_token: body.session.refresh_token,
    });

    // FR-005: force-quit/relaunch simulated by a brand-new client over the same storage.
    const appLaunch2 = createClient(API_URL, ANON_KEY, { auth: { storage, persistSession: true } });
    const { data: restored } = await appLaunch2.auth.getSession();
    expect(restored.session?.user.email).toBe(email);
  });

  it('locks out after 5 failed attempts and never reveals whether an email is registered (FR-011/FR-012)', async () => {
    const registeredEmail = `signin-lockout-int-${Date.now()}@example.test`;
    const unregisteredEmail = `signin-nouser-int-${Date.now()}@example.test`;
    await admin.auth.admin.createUser({ email: registeredEmail, password: 'Passw0rd', email_confirm: true });

    const wrongOnRegistered = await callSignIn(registeredEmail, 'WrongPass1');
    const onUnregistered = await callSignIn(unregisteredEmail, 'WrongPass1');
    expect(wrongOnRegistered.status).toBe(onUnregistered.status);
    expect(wrongOnRegistered.body).toEqual(onUnregistered.body);

    for (let i = 0; i < 3; i++) {
      await callSignIn(registeredEmail, 'WrongPass1');
    }
    const locked = await callSignIn(registeredEmail, 'WrongPass1');
    expect(locked.status).toBe(429);
    expect(locked.body.status).toBe('locked');
  });
});
