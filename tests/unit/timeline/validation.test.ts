import { activitySchema } from '@/features/timeline/validation/schema';

describe('activitySchema', () => {
  const base = { title: 'Team standup', startTime: '09:00', endTime: '09:30' };

  it('accepts a valid activity', () => {
    expect(activitySchema.safeParse(base).success).toBe(true);
  });

  it('rejects an empty title', () => {
    expect(activitySchema.safeParse({ ...base, title: '' }).success).toBe(false);
  });

  it('rejects an end time equal to the start time', () => {
    expect(activitySchema.safeParse({ ...base, endTime: '09:00' }).success).toBe(false);
  });

  it('rejects an end time before the start time', () => {
    expect(activitySchema.safeParse({ ...base, startTime: '10:00', endTime: '09:00' }).success).toBe(false);
  });
});
