import type { Activity } from '@/features/timeline/hooks/useTodayActivities';

// FR-007: what's happening now and what's next, derived client-side from the same
// small list already fetched for rendering (research.md §3).
export function getNowAndNext(
  activities: Activity[],
  nowTime: string,
): { current: Activity | null; next: Activity | null } {
  const current = activities.find((a) => a.start_time <= nowTime && nowTime < a.end_time) ?? null;

  const next =
    activities
      .filter((a) => a.start_time > nowTime)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0] ?? null;

  return { current, next };
}
