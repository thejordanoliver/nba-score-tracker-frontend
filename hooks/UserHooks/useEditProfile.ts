// hooks/UserHooks/useEditProfile.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import { useCallback } from "react";

import type { PrivateAccountUser } from "types/user";
import {
  apiClient,
  BASE_URL,
  refreshStoredAuthUser,
} from "utils/apiClient";
import { removeCachedUserProfile } from "utils/userProfileCache";

type ProfileUpdateResponse = {
  user: PrivateAccountUser;
};

type CachedAuthUser = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readCachedAuthUser = async (): Promise<CachedAuthUser> => {
  const storedUser = await AsyncStorage.getItem("authUser");

  if (!storedUser) return {};

  try {
    const parsed: unknown = JSON.parse(storedUser);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const persistUpdatedUser = async (user: PrivateAccountUser) => {
  const cachedUser = await readCachedAuthUser();

  await AsyncStorage.multiSet([
    ["userId", String(user.id)],
    ["username", user.username],
    ["fullName", user.fullName],
    ["bio", user.bio],
    ["profileImage", user.profileImage ?? ""],
    ["bannerImage", user.bannerImage ?? ""],
    [
      "authUser",
      JSON.stringify({
        ...cachedUser,
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        bio: user.bio,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
      }),
    ],
  ]);

  await removeCachedUserProfile(String(user.id));
  await refreshStoredAuthUser();
};

const getProfileSaveErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    const responseData = error.response?.data;
    const serverMessage = isRecord(responseData)
      ? typeof responseData.error === "string"
        ? responseData.error
        : typeof responseData.message === "string"
          ? responseData.message
          : null
      : null;

    if (serverMessage) return serverMessage;

    if (status === 400) {
      return "Invalid profile data. Please check your changes and try again.";
    }

    if (status === 401 || status === 403) {
      return "You are not authorized. Please sign in again.";
    }

    if (status === 413) {
      return "Image is too large. Please choose a smaller image.";
    }

    if (error.message === "Network Error") {
      return "Network error. Check your connection and try again.";
    }

    return error.message || "Failed to save profile.";
  }

  if (error instanceof Error && error.message) return error.message;

  return "Failed to save profile.";
};

export function useEditProfile() {
  const saveProfile = useCallback(
    async (formData: FormData): Promise<PrivateAccountUser> => {
      try {
        if (__DEV__) {
          console.log("Saving profile to:", `${BASE_URL}/api/users/me`);
        }

        const { data } = await apiClient.patch<ProfileUpdateResponse>(
          "/api/users/me",
          formData,
          {
            headers: {
              Accept: "application/json",
            },
            // Keep React Native's FormData intact so Axios can add its boundary.
            transformRequest: (body) => body,
            timeout: 60000,
          },
        );

        if (!data.user) {
          throw new Error("Server did not return updated profile data.");
        }

        await persistUpdatedUser(data.user);

        return data.user;
      } catch (error: unknown) {
        if (__DEV__) {
          console.warn("Save profile raw error:", {
            message: error instanceof Error ? error.message : undefined,
            status: isAxiosError(error) ? error.response?.status : undefined,
            data: isAxiosError(error) ? error.response?.data : undefined,
            baseURL: BASE_URL,
            url: isAxiosError(error) ? error.config?.url : undefined,
          });
        }

        const message = getProfileSaveErrorMessage(error);
        console.warn("Save profile failed:", message);
        throw new Error(message);
      }
    },
    [],
  );

  return { saveProfile };
}
