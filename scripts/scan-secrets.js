#!/usr/bin/env node
// Pre-commit secret scan (Constitution Principle VII) — blocks commits that
// contain obvious credential material in staged file contents.
const { execFileSync } = require('node:child_process');

const PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/sk-[a-zA-Z0-9]{20,}/, 'OpenAI-style secret key'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key ID'],
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'JWT (possible service-role key)'],
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
  for (const [pattern, label] of PATTERNS) {
    if (pattern.test(content)) {
      console.error(`✖ Possible ${label} found in ${file}`);
      found = true;
    }
  }
}

if (found) {
  console.error('\nCommit blocked: remove the secret or add the file to .gitignore.');
  process.exit(1);
}
