import { z } from 'zod';

export const emailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const phoneSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^[0-9]{10,15}$/, 'Phone number should be 10-15 digits')
});

export const otpSchema = z.object({
  otp: z.string().regex(/^[0-9]{6}$/, 'OTP must be 6 digits')
});
