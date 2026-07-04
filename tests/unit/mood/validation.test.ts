import { moodEntrySchema } from '@/features/mood/validation/schema';

describe('moodEntrySchema', () => {
  it('accepts mood and energy within 1-5', () => {
    expect(moodEntrySchema.safeParse({ moodLevel: 3, energyLevel: 5 }).success).toBe(true);
  });

  it('rejects a mood level below 1', () => {
    expect(moodEntrySchema.safeParse({ moodLevel: 0, energyLevel: 3 }).success).toBe(false);
  });

  it('rejects an energy level above 5', () => {
    expect(moodEntrySchema.safeParse({ moodLevel: 3, energyLevel: 6 }).success).toBe(false);
  });

  it('rejects a non-integer level', () => {
    expect(moodEntrySchema.safeParse({ moodLevel: 3.5, energyLevel: 3 }).success).toBe(false);
  });
});
