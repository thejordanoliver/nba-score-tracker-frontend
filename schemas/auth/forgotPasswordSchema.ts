import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = /^\d{6}$/;

export const forgotPasswordSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required.")
      .max(254, "Email must be 254 characters or fewer.")
      .regex(EMAIL_PATTERN, "Enter a valid email address."),
    code: z
      .string()
      .trim()
      .min(1, "Code is required.")
      .regex(CODE_PATTERN, "Enter the 6-digit code from your email."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be 128 characters or fewer."),
    confirmPassword: z
      .string()
      .min(1, "Confirm password is required.")
      .max(128, "Password must be 128 characters or fewer."),
  })
  .superRefine(({ confirmPassword, password }, context) => {
    if (confirmPassword !== password) {
      context.addIssue({
        code: "custom",
        message: "Passwords must match.",
        path: ["confirmPassword"],
      });
    }
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const FORGOT_PASSWORD_EMAIL_FIELDS = ["email"] as const;

export const FORGOT_PASSWORD_CODE_FIELDS = ["email", "code"] as const;
