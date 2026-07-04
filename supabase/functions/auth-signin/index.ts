// contracts/auth-contracts.md — auth-signin: FR-011 lockout, FR-012 non-enumeration,
// FR-015 mfa_required when the account has a verified TOTP factor.
import { createClient } from 'jsr:@supabase/supabase-js@2';

// quickstart.md Scenario 2: attempts 1-4 return invalid_credentials, the 5th (and any
// further attempt within the window) returns locked — so the gate trips once 4 prior
// failures are on record, before a 5th is even attempted.
const MAX_FAILURES_BEFORE_LOCKOUT = 4;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_RETRY_AFTER_SECONDS = 900;

Deno.serve(async (req) => {
  const { email, password } = await req.json();

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  // Separate clients: signing in on the admin client would silently overwrite its auth
  // context with the signed-in user's (lower-privileged) session, breaking any admin
  // query made afterward (e.g. the login_attempts insert below, on a successful sign-in).
  const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();
  const { count, error: countError } = await supabaseAdmin
    .from('login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .eq('success', false)
    .gte('attempted_at', windowStart);
  if (countError) console.error('login_attempts count error', countError);

  if ((count ?? 0) >= MAX_FAILURES_BEFORE_LOCKOUT) {
    console.log(JSON.stringify({ event: 'sign_in', outcome: 'failure', detail: 'locked', timestamp: new Date().toISOString() }));
    return Response.json(
      { status: 'locked', retry_after_seconds: LOCKOUT_RETRY_AFTER_SECONDS },
      { status: 429 },
    );
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
  const { error: insertError } = await supabaseAdmin
    .from('login_attempts')
    .insert({ email, success: !error });
  if (insertError) console.error('login_attempts insert error', insertError);

  if (error || !data.session) {
    console.log(JSON.stringify({ event: 'sign_in', outcome: 'failure', timestamp: new Date().toISOString() }));
    return Response.json({ status: 'invalid_credentials' }, { status: 401 });
  }

  const verifiedFactor = data.user?.factors?.find((f) => f.status === 'verified');
  if (verifiedFactor) {
    console.log(JSON.stringify({ event: 'sign_in', outcome: 'success', detail: 'mfa_required', accountId: data.user?.id, timestamp: new Date().toISOString() }));
    return Response.json({ status: 'mfa_required', factor_id: verifiedFactor.id });
  }

  console.log(JSON.stringify({ event: 'sign_in', outcome: 'success', accountId: data.user?.id, timestamp: new Date().toISOString() }));
  return Response.json({
    status: 'ok',
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    },
  });
});
