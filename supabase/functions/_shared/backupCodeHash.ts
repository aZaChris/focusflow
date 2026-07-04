// Shared by mfa-backup-codes-generate and mfa-backup-codes-redeem: never store or
// compare backup codes in plaintext (data-model.md `mfa_backup_codes.code_hash`).
export async function hashBackupCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateBackupCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
  let code = '';
  const random = new Uint32Array(10);
  crypto.getRandomValues(random);
  for (let i = 0; i < 10; i++) code += alphabet[random[i] % alphabet.length];
  return code;
}
