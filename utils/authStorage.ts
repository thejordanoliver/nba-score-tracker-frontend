// utils/authStorage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// Save tokens
export const saveTokens = async (accessToken: string, refreshToken?: string) => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

// Get access token
export const getAccessToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

// Get refresh token
export const getRefreshToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

// Clear tokens (logout)
export const clearTokens = async () => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
};
