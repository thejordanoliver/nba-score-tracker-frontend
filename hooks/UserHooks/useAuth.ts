// hooks/useAuth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { disconnectNotificationSocket } from "services/notificationSocket";
import { useBadgeNotificationStore } from "store/badgeNotificationStore";
import {
  apiClient,
  clearAuthSession,
  saveTokens,
  subscribeAuthSession,
} from "utils/apiClient";

interface User {
  id: number;
  username: string;
  fullName?: string;
  full_name?: string;
  bio?: string;
  profileImage?: string | null;
  profile_image?: string | null;
  banner_image?: string | null;
}

const normalizeImage = (value?: string | null): string | null => {
  if (!value || value === "null" || value === "undefined") return null;
  return value;
};

const normalizeString = (value?: string | null): string => {
  if (!value || value === "null" || value === "undefined") return "";
  return value;
};

const normalizeCachedAuthUser = (user: User) => ({
  id: user.id,
  username: normalizeString(user.username),
  fullName: normalizeString(user.full_name ?? user.fullName),
  profileImage: normalizeImage(user.profile_image ?? user.profileImage) ?? "",
});

const loadStoredAuthSnapshot = async (): Promise<{
  accessToken: string;
  user: User;
} | null> => {
  const values = await AsyncStorage.multiGet([
    "accessToken",
    "userId",
    "username",
    "fullName",
    "bio",
    "profileImage",
    "bannerImage",
  ]);

  const stored: Record<string, string | null> = Object.fromEntries(values);
  const parsedUserId = stored.userId
    ? Number.parseInt(stored.userId, 10)
    : NaN;

  if (
    !stored.accessToken ||
    !stored.userId ||
    !stored.username ||
    Number.isNaN(parsedUserId)
  ) {
    return null;
  }

  return {
    accessToken: stored.accessToken,
    user: {
      id: parsedUserId,
      username: stored.username,
      full_name: stored.fullName ?? "",
      bio: stored.bio ?? "",
      profile_image: normalizeImage(stored.profileImage),
      banner_image: normalizeImage(stored.bannerImage),
    },
  };
};

export function useAuth() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeAuthSession(({ accessToken }) => {
      if (!isMounted) return;

      setToken(accessToken);

      if (!accessToken) {
        setUser(null);
        return;
      }

      void loadStoredAuthSnapshot()
        .then((snapshot) => {
          if (!isMounted || !snapshot) return;
          setUser(snapshot.user);
        })
        .catch((err) => {
          if (__DEV__) {
            console.warn("Failed to refresh auth user from storage:", err);
          }
        });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const snapshot = await loadStoredAuthSnapshot();

        if (!snapshot) {
          await clearAuthSession();
          setToken(null);
          setUser(null);
          return;
        }

        setToken(snapshot.accessToken);
        setUser(snapshot.user);
      } catch (err) {
        console.error("Failed to load user from storage:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  const handleAuthSuccess = async (
    accessToken: string,
    refreshToken: string,
    user: User,
  ) => {
    setToken(accessToken);
    setUser(user);

    await AsyncStorage.multiSet([
      ["userId", user.id.toString()],
      ["username", normalizeString(user.username)],
      ["fullName", normalizeString(user.full_name ?? user.fullName)],
      ["bio", normalizeString(user.bio)],
      [
        "profileImage",
        normalizeImage(user.profile_image ?? user.profileImage) ?? "",
      ],
      ["bannerImage", normalizeImage(user.banner_image) ?? ""],
      ["authUser", JSON.stringify(normalizeCachedAuthUser(user))],
    ]);

    await saveTokens(accessToken, refreshToken);
  };

  const login = async (username: string, password: string) => {
    setLoadingAction(true);

    try {
      const res = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("/api/login", { username, password });

      await handleAuthSuccess(
        res.data.accessToken,
        res.data.refreshToken,
        res.data.user,
      );

      router.replace("/(tabs)/profile");
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Login failed";

      console.warn("Login failed:", message);

      throw new Error(message);
    } finally {
      setLoadingAction(false);
    }
  };

  const signup = async (formData: FormData) => {
    setLoadingAction(true);

    try {
      const res = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: User;
      }>("api/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await handleAuthSuccess(
        res.data.accessToken,
        res.data.refreshToken,
        res.data.user,
      );

      router.replace("/(tabs)/profile");
    } catch (err: any) {
      const message =
        err.response?.data?.error ?? err.message ?? "Signup failed";
      console.error("Signup error:", message);
      throw new Error(message);
    } finally {
      setLoadingAction(false);
    }
  };

  const logout = async () => {
    const currentUserId = user?.id;
    let refreshToken: string | null = null;

    try {
      refreshToken = await AsyncStorage.getItem("refreshToken");
    } catch (err) {
      console.warn("Failed to read refresh token before logout:", err);
    }

    try {
      try {
        await AsyncStorage.removeItem("authUser");
      } catch (err) {
        console.warn("Failed to clear cached auth user:", err);
      }

      await clearAuthSession(currentUserId);
      disconnectNotificationSocket();
      useBadgeNotificationStore.getState().clearBadgeNotifications();
      setUser(null);
      setToken(null);

      if (refreshToken) {
        void apiClient.post(`/api/logout`, { refreshToken }).catch(() => {});
      }
    } catch (err) {
      console.error("Logout error:", err);
      disconnectNotificationSocket();
      useBadgeNotificationStore.getState().clearBadgeNotifications();
      setUser(null);
      setToken(null);
    }
  };

  const deleteAccount = async (password: string) => {
    const currentPassword = password.trim();

    if (!currentPassword) {
      throw new Error("Password is required");
    }

    try {
      await apiClient.delete("/api/users/me", {
        data: {
          currentPassword,
        },
      });
    } catch (err: any) {
      const message =
        err.response?.data?.error ?? err.message ?? "Failed to delete account";

      // Do not use console.error here for expected validation errors like wrong password.
      console.warn("Delete account failed:", message);

      throw new Error(message);
    }

    // Move to the public completion screen before publishing the signed-out
    // state so the root auth guard cannot race this navigation back to login.
    router.replace("/settings/deleteaccountsplash");

    try {
      await clearAuthSession(user?.id);
    } catch (err) {
      // The server deletion succeeded, so local cleanup failures should not be
      // reported as though the account still exists.
      console.warn("Failed to clear deleted account session:", err);
    }

    disconnectNotificationSocket();
    useBadgeNotificationStore.getState().clearBadgeNotifications();
    setUser(null);
    setToken(null);
  };

  return {
    user,
    token,
    loadingUser,
    loading: loadingAction,
    login,
    signup,
    logout,
    deleteAccount,
  };
}
