# Manual QA Checklist — pending device testing

Consolidates the manual QA left pending for `004-subscription-monetization`,
`005-ai-voice-journal`, and `006-now-next-widget` (tracked as `⏸️` tasks in
each feature's `tasks.md`). Nothing here can run under `npm test` — see each
feature's `research.md` §4 for why. Check items off as you go; this file is
disposable once everything is checked (or move failures into new tasks).

---

## Part A — One-time environment setup (Android Studio)

Do this once; it unblocks all three features below.

- [ ] Install Android Studio, open it once so it finishes its own first-run SDK
      component download (Android SDK Platform, Platform-Tools, an emulator
      image if you'll use one).
- [ ] Confirm `ANDROID_HOME`/`ANDROID_SDK_ROOT` is set and `adb` is on your
      `PATH` (Android Studio's "SDK Manager" shows the SDK location; add
      `<sdk>/platform-tools` and `<sdk>/emulator` to `PATH`).
- [ ] Either: create an emulator (Android Studio → Device Manager → Create
      Device), **or** connect a physical Android phone with USB debugging
      enabled (Settings → About phone → tap "Build number" 7×, then Settings →
      Developer options → USB debugging).
- [ ] From `focusflow-rewrite/`, generate the native Android project:
      ```bash
      npx expo prebuild
      ```
- [ ] Build and install a development build:
      ```bash
      npx expo run:android
      ```
      This compiles locally (no EAS cloud queue) and installs on whichever
      device/emulator `adb devices` shows as connected.
- [ ] Confirm the app launches, and you can sign in with a test account
      (`001-user-auth`).

---

## Part B — `004-subscription-monetization` (RevenueCat)

### One-time RevenueCat/store setup

- [ ] RevenueCat project created, with the Android app added and its API key
      copied.
- [ ] Set `EXPO_PUBLIC_REVENUECAT_API_KEY` in `focusflow-rewrite/.env` to that
      **public** key (never a secret key — Principle VII).
- [ ] In RevenueCat: one entitlement (matching `ENTITLEMENT_ID = 'premium'` in
      `src/features/subscription/hooks/useEntitlement.ts`) and one product,
      exposed through a single offering marked "current."
- [ ] In Google Play Console: a license-testing account added (Setup → License
      testing), and the app uploaded to at least an internal testing track.
- [ ] Rebuild after changing `.env`/`app.json` (`npx expo run:android` again).

### Scenario 1 — View plans and subscribe

- [ ] Sign in, open the subscription screen → plan and price are shown.
- [ ] Purchase the plan using the license-testing account → native purchase UI
      appears; on success, screen shows active entitlement automatically.
- [ ] Start a purchase and cancel partway (or force airplane mode mid-flow) →
      clear message shown, no crash/hang.

### Scenario 2 — Restore a previous purchase

- [ ] With the Scenario 1 account still subscribed, reinstall the app (or sign
      out/in fresh), sign in again → subscription screen already shows active
      entitlement with **no** tap needed (confirms account-linked identity).
- [ ] As a genuinely fresh/never-subscribed account, tap "Restore purchases" →
      clear "nothing to restore" message, not an error.

### Scenario 3 — See and manage subscription status

- [ ] As the subscribed account, open account settings → plan, active status,
      renewal/expiration shown.
- [ ] Tap "Manage subscription" → opens Play Store's native subscription
      management.
- [ ] As a never-subscribed account, open account settings → accurate "no
      active subscription" state, not blank/broken.

### Cross-cutting check

- [ ] As a never-subscribed account, use habits, mood logging, and the
      timeline end to end → fully functional, nothing gated or degraded.

---

## Part C — `005-ai-voice-journal` (OpenAI)

### One-time setup

- [ ] Set the Edge Function secret (this is **not** an app `.env` value):
      ```bash
      supabase secrets set OPENAI_API_KEY=sk-...
      ```
- [ ] Deploy the function:
      ```bash
      supabase functions deploy journal-process --use-api
      ```
- [ ] Add a short test audio fixture for the automated tests too (a few
      seconds of clear speech, e.g. "Today was a pretty good day, I got
      through my whole to-do list"), saved as
      `tests/fixtures/journal-test-clip.m4a` (see
      `tests/fixtures/README.md`). Easiest source: record it on your phone and
      AirDrop/transfer it in, or export it from the app itself once recording
      works.
- [ ] Run the automated suite once the above is in place:
      ```bash
      npm test
      ```
      Expect `tests/integration/journal/*.test.ts` to go from failing (404s /
      missing-file error) to passing — these hit the real OpenAI API, so each
      run has a small real cost (research.md §4).

### Scenario 1 — Speak instead of type

- [ ] As a first-time user of the journal, open it → consent notice naming
      OpenAI is shown before any recording is possible.
- [ ] Acknowledge consent, record a short entry, stop → a transcript matching
      what you said appears.
- [ ] Repeat with the network disabled right after stopping → clear "needs a
      connection" message; retry once reconnected succeeds without
      re-recording.

### Scenario 2 — Get a mood reflection

- [ ] Continuing from a successful recording → mood summary + short feedback
      appear alongside the transcript automatically.
- [ ] Simulate the mood-analysis step failing on its own (e.g. temporarily
      break the model name in `supabase/functions/journal-process/index.ts`
      and redeploy) while transcription still works → transcript still shown,
      a "retry mood analysis" action is available and succeeds once fixed.

### Scenario 3 — Look back on past entries

- [ ] With several entries recorded, open history → most-recent-first, each
      showing transcript/mood/feedback.
- [ ] Delete one entry → gone immediately, doesn't reappear on refresh.
- [ ] As a brand-new user, open history → empty state, not an error.

### Privacy check — no audio ever persists

- [ ] After a recording finishes processing, confirm: no leftover local temp
      audio file, no Supabase Storage bucket for this feature, and the
      `journal_entries` row has no audio column/value — only transcript/mood
      text.

---

## Part D — `006-now-next-widget` (Android widget)

*Uses the same dev build from Part A — no separate account/secret setup.*

### Scenario 1 — See what's now and next without opening the app

- [ ] With an activity in progress and another later today
      (`003-timeline-visualization`), add the widget: long-press the home
      screen → Widgets → FocusFlow → drag "Now & Next" onto the home screen →
      shows current + next correctly.
- [ ] Clear today's activities (or use a fresh account) → widget shows a
      clear "nothing scheduled" state, not blank/broken.
- [ ] With only a later activity, nothing in progress → widget shows "nothing
      right now" + the later activity as next.

### Scenario 2 — Widget stays current on its own

- [ ] With the widget showing a current activity, wait past its end time (and
      the next one's start) **without opening the app** → within 30 minutes,
      widget updates on its own.
- [ ] Disable network, wait through a transition, re-enable → widget catches
      up to the correct state on its next refresh.

### Scenario 3 — Jump into the app from the widget

- [ ] Tap the widget → app opens directly to the timeline, in under ~2
      seconds.

### Not-signed-in check

- [ ] Sign out of the app, check the widget (may take one refresh cycle) →
      neutral "sign in to see your schedule" state, never an error/crash/blank
      widget.

---

## When everything above is checked

- [ ] Update each feature's `tasks.md`, flipping the remaining `⏸️`/pending
      tasks to `[X]`:
  - `specs/004-subscription-monetization/tasks.md`: T010, T013, T017
  - `specs/005-ai-voice-journal/tasks.md`: T006 (deploy), T019 (full quickstart)
  - `specs/006-now-next-widget/tasks.md`: T007, T009, T011, T012
- [ ] If anything failed, note it here or open a fresh task/issue rather than
      silently reverting code — then this file can be deleted once everything
      is green and committed.
