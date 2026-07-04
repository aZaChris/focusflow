import { emailSchema, passwordSchema, signUpSchema } from '@/features/auth/validation/schemas';

describe('emailSchema', () => {
  it('accepts a valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts a password with 8+ chars, a letter and a digit', () => {
    expect(passwordSchema.safeParse('Passw0rd').success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(passwordSchema.safeParse('Pw0').success).toBe(false);
  });

  it('rejects a password with no digit', () => {
    expect(passwordSchema.safeParse('Password').success).toBe(false);
  });

  it('rejects a password with no letter', () => {
    expect(passwordSchema.safeParse('12345678').success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('accepts a valid email/password pair', () => {
    expect(signUpSchema.safeParse({ email: 'user@example.com', password: 'Passw0rd' }).success).toBe(
      true,
    );
  });

  it('rejects when password fails policy even if email is valid', () => {
    expect(signUpSchema.safeParse({ email: 'user@example.com', password: 'short' }).success).toBe(
      false,
    );
  });
});
