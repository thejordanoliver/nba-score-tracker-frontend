import { BROWSEABLE_LEAGUES } from "constants/leagueIds";
import type { FavoriteSportId } from "constants/leagues";
import {
  normalizeFavoriteTeamKey,
  type FavoriteTeamKey,
} from "types/favorites";
import { z } from "zod";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9._-]+$/;
const FAVORITE_SPORT_IDS = new Set<string>(BROWSEABLE_LEAGUES);

const favoriteTeamSchema = z.custom<FavoriteTeamKey>(
  (value) => normalizeFavoriteTeamKey(value) !== null,
  "Select a valid favorite team.",
);

const favoriteSportSchema = z.custom<FavoriteSportId>(
  (value) => typeof value === "string" && FAVORITE_SPORT_IDS.has(value),
  "Select a valid favorite league.",
);

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(80, "Name must be 80 characters or fewer."),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Username is required.")
      .min(3, "Username must be at least 3 characters.")
      .max(30, "Username must be 30 characters or fewer.")
      .regex(
        USERNAME_PATTERN,
        "Use only letters, numbers, dots, underscores, and hyphens.",
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email is required.")
      .max(254, "Email must be 254 characters or fewer.")
      .regex(EMAIL_PATTERN, "Enter a valid email address."),
    password: z
      .string()
      .min(1, "Password is required.")
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password must be 128 characters or fewer."),
    confirmPassword: z
      .string()
      .min(1, "Confirm your password.")
      .max(128, "Password must be 128 characters or fewer."),
    favoriteTeams: z.array(favoriteTeamSchema),
    favoriteSports: z.array(favoriteSportSchema),
    profileImage: z.string().nullable(),
    bannerImage: z.string().nullable(),
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

export type SignupFormValues = z.infer<typeof signupSchema>;

export const SIGNUP_ACCOUNT_FIELDS = ["fullName", "username"] as const;

export const SIGNUP_CREDENTIAL_FIELDS = [
  "email",
  "password",
  "confirmPassword",
] as const;
