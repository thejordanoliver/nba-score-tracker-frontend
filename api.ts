import { create } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "utils/apiConfig";

export const api = create({
  baseURL: API_BASE_URL,
});

// Automatically attach token from AsyncStorage
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    // Axios v1+ headers is AxiosHeaders type
    if (config.headers && "set" in config.headers && typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      // Fallback: cast to any to bypass TS strict typing
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
