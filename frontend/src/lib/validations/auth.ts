import { z } from 'zod';
import { validateCedula } from './cedula';

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Signup validation schema (matches backend exactly)
export const signupSchema = z
  .object({
    nationalId: z.string()
      .min(1, 'National ID is required')
      .regex(/^\d{10}$/, 'Please enter a valid 10-digit national ID')
      .refine((value) => validateCedula(value),
        'Please enter a valid national ID'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .min(2, 'Name must be at least 2 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^\d{10}$/, 'Please enter a valid 10-digit phone number'),
    address: z
      .string()
      .min(1, 'Address is required')
      .min(5, 'Address must be at least 5 characters'),
    gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say'], {
      message: 'Please select a gender',
    }),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

// Email validation schema (for resend, forgot password)
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
});

export type EmailFormData = z.infer<typeof emailSchema>;

// OTP/Verification validation schema
export const otpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  code: z
    .string()
    .min(1, 'Verification code is required')
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers')
});

export type OtpFormData = z.infer<typeof otpSchema>;

// Reset Password validation schema
export const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    code: z
      .string()
      .min(1, 'Recovery code is required')
      .length(6, 'Code must be exactly 6 digits')
      .regex(/^\d+$/, 'Code must contain only numbers'),
    newPassword: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;