import { z } from 'zod';

// FR-001: client-side UX feedback only — the `habits.title` check constraint
// (data-model.md) is the actual trust boundary.
export const habitTitleSchema = z.string().min(1).max(100);
