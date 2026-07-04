import { MAX_RECORDING_SECONDS, isWithinRecordingCap } from '@/features/journal/validation/schema';

describe('isWithinRecordingCap', () => {
  it('accepts a duration under the cap', () => {
    expect(isWithinRecordingCap(60)).toBe(true);
  });

  it('accepts a duration exactly at the cap', () => {
    expect(isWithinRecordingCap(MAX_RECORDING_SECONDS)).toBe(true);
  });

  it('rejects a duration over the cap', () => {
    expect(isWithinRecordingCap(MAX_RECORDING_SECONDS + 1)).toBe(false);
  });
});
