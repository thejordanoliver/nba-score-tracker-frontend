// hooks/useAccountDetails.ts
import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";

import type { PrivateAccountUser } from "types/user";
import { apiClient, BASE_URL, saveTokens } from "utils/apiClient";

export type AccountDetailsUser = PrivateAccountUser;

export type ChangePasswordResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
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
  const [userData, setUserData] = useState<AccountDetailsUser | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiClient.get<AccountDetailsUser>("/api/users/me");
      const data = res.data;

      setUserData({
        ...data,
        profileImage: parseImageUrl(data.profileImage),
        bannerImage: parseImageUrl(data.bannerImage),
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
    void fetchUserData();
  }, [fetchUserData]);

  const changePassword = async ({
    currentPassword,
    newPassword,
  }: ChangePasswordInput) => {
    setError(null);

    try {
      const response = await apiClient.patch<ChangePasswordResponse>(
        "/api/users/me/password",
        {
          currentPassword,
          newPassword,
        },
      );

      await saveTokens(
        response.data.accessToken,
        response.data.refreshToken,
      );

      return response.data;
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Failed to update password");
      setError(message);
      throw new Error(message);
    }
  };

  return {
    isLoading,
    userData,
    error,
    refetch: fetchUserData,
    changePassword,
  };
}
