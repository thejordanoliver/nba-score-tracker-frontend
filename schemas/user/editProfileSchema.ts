import { z } from "zod";

export const EDIT_PROFILE_FULL_NAME_MAX_LENGTH = 80;
export const EDIT_PROFILE_BIO_MAX_LENGTH = 150;

export const editProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(
      1,
      `Full name must be 1-${EDIT_PROFILE_FULL_NAME_MAX_LENGTH} characters`,
    )
    .max(
      EDIT_PROFILE_FULL_NAME_MAX_LENGTH,
      `Full name must be 1-${EDIT_PROFILE_FULL_NAME_MAX_LENGTH} characters`,
    ),
  bio: z
    .string()
    .max(
      EDIT_PROFILE_BIO_MAX_LENGTH,
      `Bio must be ${EDIT_PROFILE_BIO_MAX_LENGTH} characters or less`,
    )
    .transform((value) => value.trim()),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
