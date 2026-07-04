# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Development (auth / Supabase)

This app talks to a hosted Supabase project (Postgres + Auth + Edge Functions) for the
`001-user-auth` feature — no Docker required. See `specs/001-user-auth/quickstart.md`
for the full scenario walkthroughs this setup supports.

`002-habit-mood-tracking` (habits with streaks, mood/energy logging) reuses the same
project and adds only `supabase/migrations/000{4,5,6}_*.sql` — no new Edge Functions,
no new environment variables. Streaks are computed at read time by the `get_habits`
Postgres function rather than stored, so there's nothing to backfill if the streak
logic ever needs to change (see `specs/002-habit-mood-tracking/research.md` §1). See
`specs/002-habit-mood-tracking/quickstart.md` for its scenario walkthroughs.

`003-timeline-visualization` (today's schedule as a live timeline, with a real-time
"now" marker and activity blocks) reuses the same project and adds only
`supabase/migrations/0007_activities.sql` — again no new Edge Functions, no new
environment variables. It deliberately does not use `@shopify/react-native-skia`
(unlike `legacy-reference/`'s Timeline Canvas) — plain React Native views are enough
for what this version's spec needs (see
`specs/003-timeline-visualization/research.md` §1). See
`specs/003-timeline-visualization/quickstart.md` for its scenario walkthroughs.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. Log in and link this repo to your Supabase project (personal access token from
   https://supabase.com/dashboard/account/tokens if the browser login flow isn't
   available in your environment):

   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   ```

3. Copy `.env.example` to `.env` and fill in the project's URL/anon key (Project
   Settings → API) and its service role key (test-only, never shipped in the app —
   see the comment in `.env.example`, and Principle VII in the project constitution).
4. Push migrations and Edge Functions, and sync `config.toml`'s auth settings:

   ```bash
   supabase db push
   supabase functions deploy --use-api   # bundles server-side, no Docker needed
   supabase config push
   ```

   Free-tier projects reject a couple of `config.toml` settings with a 402
   (`[auth.sessions] inactivity_timeout`, `[storage.vector]`) — see the `ponytail:`
   comments next to them in `supabase/config.toml`.

5. Run the test suite (unit + contract + integration, against the linked project):

   ```bash
   npm test
   ```

   Contract/integration tests hit real network endpoints (Postgres, Auth, Edge
   Functions) and run serially (`--runInBand`) to avoid flaky contention. They read
   `.env` via Node's `--env-file` flag (see `package.json`'s `test` script — no dotenv
   dependency needed). Email-verification/password-reset tests use the admin
   `generateLink` API instead of reading a real inbox, so no local SMTP/Mailpit is
   needed — but free-tier hosted projects also rate-limit real outbound auth email
   very aggressively, so `resetPasswordForEmail` (the one real send path still under
   test) is only called once across the suite; add a custom SMTP provider in the
   dashboard if you need to exercise it more.

6. Typecheck with `npx tsc --noEmit`. If a change adds a new screen under `app/`,
   regenerate Expo Router's typed routes first (`npx expo start` briefly, or just run the
   dev server) — otherwise `Link`/`router.push` calls to the new route won't typecheck
   yet.

### Running against local Supabase instead

If you'd rather run everything locally (e.g. offline work), `supabase start` still
works the same way it always did — it just requires Docker Desktop. Point `.env` at
`http://127.0.0.1:54321` and the CLI's printed local anon/service_role keys instead.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
