// contracts/auth-contracts.md — account-delete: caller identified by their own session;
// Admin deleteUser cascades to profiles/mfa_backup_codes/etc. per data-model.md FKs.
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer /, '');

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
  if (userError || !userData.user) {
    return Response.json({ status: 'error' }, { status: 401 });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
  if (deleteError) {
    console.error(JSON.stringify({ event: 'account_delete', outcome: 'failure', accountId: userData.user.id, detail: deleteError.message, timestamp: new Date().toISOString() }));
    return Response.json({ status: 'error' }, { status: 500 });
  }

  console.log(JSON.stringify({ event: 'account_delete', outcome: 'success', accountId: userData.user.id, timestamp: new Date().toISOString() }));
  return Response.json({ status: 'deleted' });
});
