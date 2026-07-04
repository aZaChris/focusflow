import { z } from 'zod';

// FR-003/FR-009: client-side UX feedback only — the activities table's
// check(end_time > start_time) constraint (data-model.md) is the actual trust
// boundary.
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

export const activitySchema = z
  .object({
    title: z.string().min(1).max(100),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine((value) => value.endTime > value.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });
