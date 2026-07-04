// contracts/auth-contracts.md — mfa-backup-codes-redeem: alternative to a TOTP code
// during sign-in. Single-use (FR-016) and non-enumerating on bad credentials (FR-012).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { hashBackupCode } from '../_shared/backupCodeHash.ts';

Deno.serve(async (req) => {
  const { email, password, backup_code: backupCode } = await req.json();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // Two separate clients: signing in on the same client used for admin DB access would
  // silently overwrite that client's auth context with the signed-in user's (lower-
  // privileged) session, breaking every admin query made afterward.
  const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError || !signInData.session) {
    return Response.json({ status: 'invalid_credentials' }, { status: 401 });
  }

  const codeHash = await hashBackupCode(backupCode);
  const { data: match } = await supabaseAdmin
    .from('mfa_backup_codes')
    .select('id')
    .eq('user_id', signInData.user.id)
    .eq('code_hash', codeHash)
    .is('used_at', null)
    .maybeSingle();

  if (!match) {
    console.log(JSON.stringify({ event: 'mfa_backup_code_redeem', outcome: 'failure', accountId: signInData.user.id, timestamp: new Date().toISOString() }));
    return Response.json({ status: 'invalid_backup_code' }, { status: 401 });
  }

  await supabaseAdmin
    .from('mfa_backup_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('id', match.id);

  console.log(JSON.stringify({ event: 'mfa_backup_code_redeem', outcome: 'success', accountId: signInData.user.id, timestamp: new Date().toISOString() }));
  return Response.json({
    status: 'ok',
    session: {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
    },
  });
});
