// utils/apiClient.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { create } from "axios";
import { router } from "expo-router";
import { isRefreshResponseForCurrentSession } from "utils/authSessionRace";
import { USER_PROFILE_CACHE_KEY_PREFIX } from "utils/userProfileCache";

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

// ─── Shared Axios Instance ────────────────────────────────────────────────────

export const apiClient = create({
  baseURL: BASE_URL,
});

export const forgotPassword = (email: string) =>
  apiClient.post("/api/forgot-password", { email });

export const verifyResetCode = (email: string, code: string) =>
  apiClient.post("/api/verify-reset-code", { email, code });

export const resetPassword = (email: string, code: string, password: string) =>
  apiClient.post("/api/reset-password", { email, code, password });

// ─── Token helpers ────────────────────────────────────────────────────────────

export const getAccessToken = () => AsyncStorage.getItem("accessToken");
export const getRefreshToken = () => AsyncStorage.getItem("refreshToken");

type AuthSessionListener = (session: { accessToken: string | null }) => void;

const authSessionListeners = new Set<AuthSessionListener>();

const notifyAuthSessionListeners = (accessToken: string | null) => {
  authSessionListeners.forEach((listener) => {
    listener({ accessToken });
  });
};

export const refreshStoredAuthUser = async () => {
  const accessToken = await getAccessToken();

  if (accessToken) {
    notifyAuthSessionListeners(accessToken);
  }
};

export const subscribeAuthSession = (listener: AuthSessionListener) => {
  authSessionListeners.add(listener);

  return () => {
    authSessionListeners.delete(listener);
  };
};

export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.multiSet([
    ["accessToken", accessToken],
    ["refreshToken", refreshToken],
  ]);

  notifyAuthSessionListeners(accessToken);
};

const AUTH_SESSION_STORAGE_KEYS = [
  "accessToken",
  "refreshToken",
  "userId",
  "username",
  "fullName",
  "bio",
  "profileImage",
  "bannerImage",
  "loggedInUser",
  "favorites",
  "currentUser",
  "user",
  "authUser",
  "authState",
  "session",
];

const AUTH_SESSION_STORAGE_KEY_PREFIXES = [
  "favoriteTeams:",
  "@view_mode_preference_",
  USER_PROFILE_CACHE_KEY_PREFIX,
];

export const clearAuthSession = async (userId?: number | string | null) => {
  const keysToRemove = new Set(AUTH_SESSION_STORAGE_KEYS);

  if (userId != null) {
    keysToRemove.add(`favoriteTeams:${userId}`);
    keysToRemove.add(`@view_mode_preference_${userId}`);
  }

  try {
    const existingKeys = await AsyncStorage.getAllKeys();

    existingKeys.forEach((key) => {
      if (
        AUTH_SESSION_STORAGE_KEY_PREFIXES.some((prefix) =>
          key.startsWith(prefix),
        )
      ) {
        keysToRemove.add(key);
      }
    });
  } catch (err) {
    console.warn("Failed to list auth storage keys:", err);
  }

  try {
    await AsyncStorage.multiRemove(Array.from(keysToRemove));
  } finally {
    delete apiClient.defaults.headers.common.Authorization;
    delete apiClient.defaults.headers.common.authorization;
    notifyAuthSessionListeners(null);
  }
};

export const clearTokens = async () => {
  await clearAuthSession();
};

const PUBLIC_AUTH_PATHS = [
  "/api/login",
  "/api/signup",
  "/api/forgot-password",
  "/api/verify-reset-code",
  "/api/reset-password",
  "/api/refresh",
  "/api/logout",
];

const getRequestPath = (url?: string) => {
  if (!url) return "";

  try {
    return new URL(url, BASE_URL || "http://localhost").pathname;
  } catch {
    const withoutQuery = url.split("?")[0];
    const withoutBase =
      BASE_URL && withoutQuery.startsWith(BASE_URL)
        ? withoutQuery.slice(BASE_URL.length)
        : withoutQuery;

    return withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`;
  }
};

const shouldSkipAuthRefresh = (url?: string) => {
  const requestPath = getRequestPath(url);

  return PUBLIC_AUTH_PATHS.some(
    (path) => requestPath === path || requestPath === `${path}/`,
  );
};

// ─── Request interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Response interceptor ────────────────────────────────────────────────────

let isRefreshing = false;

let failedQueue: {
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url;

    const isAuthError = status === 401 || status === 403;
    const requestPath = getRequestPath(requestUrl);
    const responseError = error.response?.data?.error;
    const isInvalidCurrentPassword =
      status === 401 &&
      ((requestPath === "/api/users/me/password" &&
        responseError === "Invalid current password") ||
        (requestPath === "/api/users/me" &&
          responseError === "Invalid password"));

    // Important:
    // Do NOT refresh/redirect for login/signup/reset routes.
    // A 401 from /api/login means "Wrong password", not "expired session".
    // The password-change route also uses 401 for a bad current password.
    if (
      !originalRequest ||
      shouldSkipAuthRefresh(requestUrl) ||
      isInvalidCurrentPassword
    ) {
      return Promise.reject(error);
    }

    if (!isAuthError || originalRequest?._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const res = await axios.post(`${BASE_URL}/api/refresh`, {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        res.data;

      // A concurrent password change can install a replacement session while
      // this refresh request is in flight. Never let the older response put
      // its token pair back over the newly rotated credentials.
      const currentRefreshToken = await getRefreshToken();

      if (
        !isRefreshResponseForCurrentSession(refreshToken, currentRefreshToken)
      ) {
        const currentAccessToken = await getAccessToken();

        if (!currentAccessToken) {
          throw new Error("Auth session changed during token refresh");
        }

        originalRequest.headers.Authorization = `Bearer ${currentAccessToken}`;
        processQueue(null, currentAccessToken);

        return apiClient(originalRequest);
      }

      await saveTokens(newAccessToken, newRefreshToken);

      apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);

      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      await clearAuthSession();
      router.replace("/login");

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
