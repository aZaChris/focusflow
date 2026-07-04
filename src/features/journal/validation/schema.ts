// FR-013: client-side UX feedback only — the Edge Function's byte-size check
// (contracts/journal-contracts.md, 413 response) is the actual trust boundary.
export const MAX_RECORDING_SECONDS = 5 * 60;

export function isWithinRecordingCap(durationSeconds: number): boolean {
  return durationSeconds <= MAX_RECORDING_SECONDS;
}
