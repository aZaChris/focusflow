import { z } from 'zod';

// FR-007: client-side UX feedback only — the mood_entries check constraints
// (data-model.md) are the actual trust boundary.
const levelSchema = z.number().int().min(1).max(5);

export const moodEntrySchema = z.object({
  moodLevel: levelSchema,
  energyLevel: levelSchema,
});
