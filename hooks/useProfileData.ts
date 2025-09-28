// hooks/useProfileData.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect, useCallback } from "react";
import { parseImageUrl } from "utils/imageUtils";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export function useProfileData() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{
    id: number | null;
    username: string | null;
    fullName: string | null;
    bio: string | null;
    profileImage: string | null;
    bannerImage: string | null;
    favorites: string[];
    followersCount: number;
    followingCount: number;
  }>({
    id: null,
    username: null,
    fullName: null,
    bio: null,
    profileImage: null,
    bannerImage: null,
    favorites: [],
    followersCount: 0,
    followingCount: 0,
  });

  const loadFollowCounts = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${userId}`);
      const data = await res.json();
      setUser((prev) => ({
        ...prev,
        followersCount: data.followersCount ?? 0,
        followingCount: data.followingCount ?? 0,
      }));
    } catch (err) {
      console.warn("Failed to load follow counts:", err);
    }
  }, []);

  const loadProfileData = useCallback(async () => {
    try {
      const keys = [
        "userId",
        "username",
        "fullName",
        "bio",
        "profileImage",
        "bannerImage",
        "favorites",
      ];
      const result = await AsyncStorage.multiGet(keys);
      const data = Object.fromEntries(result);

      setUser({
        id: data.userId ? Number(data.userId) : null,
        username: data.username ?? null,
        fullName: data.fullName ?? null,
        bio: data.bio ?? null,
        profileImage: parseImageUrl(data.profileImage),
        bannerImage: parseImageUrl(data.bannerImage),
        favorites: data.favorites ? JSON.parse(data.favorites) : [],
        followersCount: 0,
        followingCount: 0,
      });

      if (data.userId) await loadFollowCounts(data.userId);
    } catch (err) {
      console.warn("Failed to load profile data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [loadFollowCounts]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  return { user, isLoading, reload: loadProfileData };
}
