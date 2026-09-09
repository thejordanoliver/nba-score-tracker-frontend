import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(1, "New password is required.")
      .min(8, "New password must be at least 8 characters.")
      .max(128, "New password must be 128 characters or fewer."),
    confirmPassword: z
      .string()
      .min(1, "Confirm your new password.")
      .max(128, "Password must be 128 characters or fewer."),
  })
  .superRefine(
    ({ confirmPassword, currentPassword, newPassword }, context) => {
      if (
        currentPassword &&
        newPassword &&
        currentPassword === newPassword
      ) {
        context.addIssue({
          code: "custom",
          message: "New password cannot be the same as current password.",
          path: ["newPassword"],
        });
      }

      if (confirmPassword !== newPassword) {
        context.addIssue({
          code: "custom",
          message: "New passwords do not match.",
          path: ["confirmPassword"],
        });
      }
    },
  );

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
