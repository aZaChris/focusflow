import { createClient } from '@supabase/supabase-js';
import { API_URL, ANON_KEY, adminClient } from '../helpers/env';

// Real network round-trips against a local Deno/Postgres stack — longer than the
// default 5s per-test budget.
jest.setTimeout(30000);

// contracts/auth-contracts.md — mfa-backup-codes-generate / mfa-backup-codes-redeem.
const GENERATE_URL = `${API_URL}/functions/v1/mfa-backup-codes-generate`;
const REDEEM_URL = `${API_URL}/functions/v1/mfa-backup-codes-redeem`;

const admin = adminClient();

async function generateCodes(accessToken: string) {
  const res = await fetch(GENERATE_URL, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
  return { status: res.status, body: await res.json() };
}

async function redeem(email: string, password: string, backupCode: string) {
  const res = await fetch(REDEEM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ email, password, backup_code: backupCode }),
  });
  return { status: res.status, body: await res.json() };
}

describe('mfa-backup-codes contract', () => {
  it('generate issues 10 one-time codes and invalidates the previous set', async () => {
    const email = `mfa-gen-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    await admin.auth.admin.createUser({ email, password, email_confirm: true });
    const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: signInData } = await client.auth.signInWithPassword({ email, password });

    const first = await generateCodes(signInData.session!.access_token);
    expect(first.status).toBe(200);
    expect(first.body.codes).toHaveLength(10);

    const second = await generateCodes(signInData.session!.access_token);
    expect(second.body.codes).toHaveLength(10);
    expect(second.body.codes).not.toEqual(first.body.codes);

    // The first-set codes are invalidated — redeeming one should now fail.
    const redeemOld = await redeem(email, password, first.body.codes[0]);
    expect(redeemOld.status).toBe(401);
    expect(redeemOld.body).toEqual({ status: 'invalid_backup_code' });
  });

  it('redeem accepts a valid code once, then rejects reuse (FR-016)', async () => {
    const email = `mfa-redeem-${Date.now()}@example.test`;
    const password = 'Passw0rd';
    await admin.auth.admin.createUser({ email, password, email_confirm: true });
    const client = createClient(API_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: signInData } = await client.auth.signInWithPassword({ email, password });
    const { body: generated } = await generateCodes(signInData.session!.access_token);
    const code = generated.codes[0];

    const first = await redeem(email, password, code);
    expect(first.status).toBe(200);
    expect(first.body.status).toBe('ok');
    expect(first.body.session.access_token).toEqual(expect.any(String));

    const second = await redeem(email, password, code);
    expect(second.status).toBe(401);
    expect(second.body).toEqual({ status: 'invalid_backup_code' });
  });

  it('redeem rejects a wrong password identically to any other invalid credentials (FR-012)', async () => {
    const email = `mfa-wrongpw-${Date.now()}@example.test`;
    await admin.auth.admin.createUser({ email, password: 'Passw0rd', email_confirm: true });

    const { status, body } = await redeem(email, 'WrongPass1', 'ABCDE12345');
    expect(status).toBe(401);
    expect(body).toEqual({ status: 'invalid_credentials' });
  });
});
