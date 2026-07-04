// contracts/auth-contracts.md — mfa-backup-codes-generate: requires an authenticated
// session; issues a fresh set of codes, invalidating any previously issued unused ones.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { generateBackupCode, hashBackupCode } from '../_shared/backupCodeHash.ts';

const CODE_COUNT = 10;

Deno.serve(async (req) => {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '');

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
  if (userError || !userData.user) {
    return Response.json({ status: 'error' }, { status: 401 });
  }
  const userId = userData.user.id;

  const codes = Array.from({ length: CODE_COUNT }, generateBackupCode);
  const rows = await Promise.all(
    codes.map(async (code) => ({ user_id: userId, code_hash: await hashBackupCode(code) })),
  );

  // Invalidate any previously issued codes before inserting the fresh set.
  await supabaseAdmin.from('mfa_backup_codes').delete().eq('user_id', userId);
  const { error: insertError } = await supabaseAdmin.from('mfa_backup_codes').insert(rows);
  if (insertError) {
    console.error(JSON.stringify({ event: 'mfa_backup_codes_generate', outcome: 'failure', accountId: userId, detail: insertError.message }));
    return Response.json({ status: 'error' }, { status: 500 });
  }

  console.log(JSON.stringify({ event: 'mfa_backup_codes_generate', outcome: 'success', accountId: userId, timestamp: new Date().toISOString() }));
  return Response.json({ codes });
});
