// hooks/useAccountDetails.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";

import { apiClient, BASE_URL } from "utils/apiClient";

export type AccountDetailsUser = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  created_at: string;
  profile_image?: string | null;
  banner_image?: string | null;
};

type ChangePasswordResponse = {
  message: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

type ApiErrorResponse = {
  error?: unknown;
  message?: unknown;
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(error)) {
    const responseMessage =
      error.response?.data?.error ?? error.response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function parseImageUrl(url: string | null | undefined): string | null {
  if (!url || url === "null") return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function useAccountDetails() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userData, setUserData] = useState<AccountDetailsUser | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async (userId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<AccountDetailsUser>(
        `/api/users/id/${userId}`,
      );
      const data = res.data;

      setUserData({
        ...data,
        profile_image: parseImageUrl(data.profile_image),
        banner_image: parseImageUrl(data.banner_image),
      });
    } catch (err: unknown) {
      console.error(
        "Fetch account details error:",
        getApiErrorMessage(err, "Failed to load account details"),
      );
      setUserData(null);
      setError("Failed to load account details");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");
        if (!storedId) return;

        const idNum = Number(storedId);
        setCurrentUserId(idNum);
        await fetchUserData(idNum);
      } catch {
        setCurrentUserId(null);
        setIsLoading(false);
      }
    })();
  }, [fetchUserData]);

  const changePassword = async ({
    currentPassword,
    newPassword,
  }: ChangePasswordInput) => {
    setError(null);

    try {
      await apiClient.patch<ChangePasswordResponse>(
        "/api/users/me/password",
        {
          currentPassword,
          newPassword,
        },
      );
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to update password");
      setError(message);
      throw new Error(message);
    }
  };

  return {
    isLoading,
    currentUserId,
    userData,
    error,
    refetch: () =>
      currentUserId ? fetchUserData(currentUserId) : Promise.resolve(),
    changePassword,
  };
}
