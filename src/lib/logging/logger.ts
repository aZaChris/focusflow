// research.md §7 (001-user-auth) / §4 (002-habit-mood-tracking) — structured,
// non-silent logging of app events. No third-party vendor — this only guarantees
// client-side outcomes (including failures) are surfaced, not swallowed (FR-010,
// FR-013, Principle VI). Feature-agnostic: any feature calls the same logEvent.
export type LogOutcome = 'success' | 'failure';

export interface AppLogEvent {
  event: string;
  accountId?: string;
  outcome: LogOutcome;
  timestamp: string;
  detail?: string;
}

export function logEvent(
  event: string,
  outcome: LogOutcome,
  options: { accountId?: string; detail?: string } = {},
): void {
  const entry: AppLogEvent = {
    event,
    outcome,
    timestamp: new Date().toISOString(),
    ...options,
  };
  // eslint-disable-next-line no-console
  console[outcome === 'failure' ? 'error' : 'log'](JSON.stringify(entry));
}
