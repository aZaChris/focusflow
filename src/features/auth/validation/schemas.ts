import { z } from 'zod';

// FR-002: client-side UX feedback only — Supabase Auth is the actual trust boundary.
export const emailSchema = z.string().email();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
