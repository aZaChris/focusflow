#!/usr/bin/env node
// Pre-commit secret scan (Constitution Principle VII) — blocks commits that
// contain obvious credential material in staged file contents.
const { execFileSync } = require('node:child_process');

const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/;

const PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/sk-[a-zA-Z0-9]{20,}/, 'OpenAI-style secret key'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key ID'],
  // Checked per-line below instead of over the whole file: a JWT on a line
  // whose key is EXPO_PUBLIC_* (eas.json, .env.example) is the Supabase anon
  // key — public-by-design, safe to ship in the built app (Principle VII).
  // Same JWT shape on any other line (e.g. a real SUPABASE_SERVICE_ROLE_KEY)
  // must still block the commit.
  [JWT_PATTERN, 'JWT (possible service-role key)', { perLine: true }],
];

const staged = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .filter((f) => !/\.(png|jpg|jpeg|gif|webp|ico|ttf|otf|woff2?|lock)$/i.test(f))
  .filter((f) => f !== 'scripts/scan-secrets.js');

let found = false;

for (const file of staged) {
  let content;
  try {
    // execFileSync (no shell) so paths with spaces/parentheses (e.g. app/(auth)/,
    // "expo-symbol 2.svg") aren't mangled by shell word-splitting/globbing.
    content = execFileSync('git', ['show', `:${file}`], { encoding: 'utf8' });
  } catch {
    continue; // deleted or binary file
  }
  for (const [pattern, label, opts] of PATTERNS) {
    if (opts?.perLine) {
      const hit = content
        .split('\n')
        .some((line) => pattern.test(line) && !/EXPO_PUBLIC_/.test(line));
      if (hit) {
        console.error(`✖ Possible ${label} found in ${file}`);
        found = true;
      }
    } else if (pattern.test(content)) {
      console.error(`✖ Possible ${label} found in ${file}`);
      found = true;
    }
  }
}

if (found) {
  console.error('\nCommit blocked: remove the secret or add the file to .gitignore.');
  process.exit(1);
}
