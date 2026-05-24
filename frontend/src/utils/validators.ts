import { z } from 'zod';

export const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const emailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const emailSignupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters')
      .max(60, 'Full name must be at most 60 characters')
      .optional()
      .or(z.literal('')),
    email: z.string().email('Please enter a valid email'),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .max(128, 'Password must be at most 128 characters')
      .regex(strongPasswordRegex, 'Use uppercase, lowercase, number, and special character'),
    confirmPassword: z.string().min(1, 'Confirm password is required')
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^[0-9]{10,15}$/, 'Phone number should be 10-15 digits')
});

export const otpSchema = z.object({
  otp: z.string().regex(/^[0-9]{6}$/, 'OTP must be 6 digits')
});
