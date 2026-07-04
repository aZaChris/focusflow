import { timeToPosition, todayLocalDate, hasDayChanged } from '@/features/timeline/time';

describe('timeToPosition', () => {
  it('maps midnight to the top of the day', () => {
    expect(timeToPosition('00:00', 2400)).toBe(0);
  });

  it('maps noon to the halfway point', () => {
    expect(timeToPosition('12:00', 2400)).toBe(1200);
  });

  it('maps the last minute of the day close to the bottom', () => {
    expect(timeToPosition('23:59', 2400)).toBeCloseTo(2398, 0);
  });

  it('accepts times with seconds', () => {
    expect(timeToPosition('12:00:00', 2400)).toBe(1200);
  });
});

describe('todayLocalDate', () => {
  it('returns a YYYY-MM-DD string', () => {
    expect(todayLocalDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('hasDayChanged', () => {
  it('is false when the date string is unchanged', () => {
    expect(hasDayChanged('2026-07-04', '2026-07-04')).toBe(false);
  });

  it('is true when the date string differs', () => {
    expect(hasDayChanged('2026-07-04', '2026-07-05')).toBe(true);
  });
});
