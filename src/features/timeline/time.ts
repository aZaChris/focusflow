// research.md §2: "today" is always the device's local calendar day — never a UTC
// day — so this reads the device clock directly, no timezone math against a server.

const MINUTES_PER_DAY = 24 * 60;

function minutesSinceMidnight(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// FR-002/FR-004: the same linear mapping positions both the now-marker and every
// activity block, so they always agree.
export function timeToPosition(time: string, dayHeightPx: number): number {
  return (minutesSinceMidnight(time) / MINUTES_PER_DAY) * dayHeightPx;
}

export function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentLocalTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// FR-014: the day-rollover check — a plain string comparison since todayLocalDate
// is already the device's local date.
export function hasDayChanged(previousDate: string, currentDate: string): boolean {
  return previousDate !== currentDate;
}
