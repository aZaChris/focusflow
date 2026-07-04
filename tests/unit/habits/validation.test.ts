import { habitTitleSchema } from '@/features/habits/validation/schema';

describe('habitTitleSchema', () => {
  it('accepts a short, non-empty title', () => {
    expect(habitTitleSchema.safeParse('Drink water').success).toBe(true);
  });

  it('rejects an empty title', () => {
    expect(habitTitleSchema.safeParse('').success).toBe(false);
  });

  it('rejects a title over 100 characters', () => {
    expect(habitTitleSchema.safeParse('a'.repeat(101)).success).toBe(false);
  });

  it('accepts a title at exactly 100 characters', () => {
    expect(habitTitleSchema.safeParse('a'.repeat(100)).success).toBe(true);
  });
});
