import AsyncStorage from "@react-native-async-storage/async-storage";
import { teams } from "constants/teams";
import { cbTeams } from "constants/teamsCB";
import { cbbTeams } from "constants/teamsCBB";
import { cfbTeams } from "constants/teamsCFB";
import { mlbTeams } from "constants/teamsMLB";
import { nflTeams } from "constants/teamsNFL";
import { nhlTeams } from "constants/teamsNHL";
import { sbTeams } from "constants/teamsSB";
import { wcbbTeams } from "constants/teamsWCBB";
import { wnbaTeams } from "constants/teamsWNBA";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import { useFollowersStore } from "store/followersStore";
import type { FavoriteLeague, FavoriteTeamKey } from "types/favorites";
import { isFavoriteLeague, normalizeFavoriteTeamKeys } from "types/favorites";
import type { Team as TeamConfig } from "types/team";
import type { Team } from "types/types";
import { apiClient } from "utils/apiClient";
import {
  clearExpiredUserProfileCache,
  getCachedUserProfile,
  setCachedUserProfile,
  USER_PROFILE_CACHE_VERSION,
  type CachedUserProfilePayload,
  type UserProfileCacheState,
} from "utils/userProfileCache";

type TeamLookupItem = TeamConfig;

type UserProfileResponse = {
  id?: number | string | null;
  username?: string | null;
  fullName?: string | null;
  full_name?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  profile_image?: string | null;
  bannerImage?: string | null;
  banner_image?: string | null;
  followersCount?: number | null;
  followingCount?: number | null;
  favoriteTeams?: unknown;
  isFollowing?: boolean | null;
  updatedAt?: string | null;
  updated_at?: string | null;
};

type DisplayProfile = {
  id: string;
  username: string | null;
  fullName: string | null;
  bio: string | null;
  profileImage: string | null;
  bannerImage: string | null;
  favoriteTeams: FavoriteTeamKey[];
  updatedAt: string | null;
};

const createTeamLookup = <T extends TeamLookupItem>(teamList: readonly T[]) => {
  const lookup = new Map<string, T>();

  teamList.forEach((team) => {
    const id = team.id;
    if (id !== undefined && id !== null) {
      lookup.set(String(id), team);
    }
  });

  return lookup;
};

function parseString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;

  return value;
}

function parseImageUrl(url: unknown): string | null {
  const parsed = parseString(url);
  if (!parsed?.startsWith("http")) return null;
  return parsed;
}

function parseStoredUserId(id: string | null): number | null {
  if (!id) return null;

  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeFavoriteTeams(value: unknown): FavoriteTeamKey[] {
  return normalizeFavoriteTeamKeys(value);
}

function parseProfileId(value: unknown, fallback: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return parseString(value) ?? fallback;
}

function parseCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseUpdatedAt(data: UserProfileResponse): string | null {
  return parseString(data.updatedAt ?? data.updated_at);
}

function normalizeDisplayProfile(
  data: UserProfileResponse,
  fallbackUserId: string,
): DisplayProfile {
  return {
    id: parseProfileId(data.id, fallbackUserId),
    username: parseString(data.username),
    fullName: parseString(data.fullName ?? data.full_name),
    bio: parseString(data.bio),
    profileImage: parseImageUrl(data.profileImage ?? data.profile_image),
    bannerImage: parseImageUrl(data.bannerImage ?? data.banner_image),
    favoriteTeams: normalizeFavoriteTeams(data.favoriteTeams),
    updatedAt: parseUpdatedAt(data),
  };
}

function buildCachedProfilePayload(
  profile: DisplayProfile,
): CachedUserProfilePayload {
  return {
    id: profile.id,
    username: profile.username,
    fullName: profile.fullName,
    bio: profile.bio,
    profileImage: profile.profileImage,
    bannerImage: profile.bannerImage,
    favoriteTeams: profile.favoriteTeams,
    updatedAt: profile.updatedAt,
    cachedAt: Date.now(),
    version: USER_PROFILE_CACHE_VERSION,
  };
}

function getUpdatedAtTime(value?: string | null): number | null {
  if (!value) return null;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function shouldPreferCachedDisplay(
  cachedProfile: CachedUserProfilePayload | null,
  freshProfile: DisplayProfile,
) {
  const cachedUpdatedAt = getUpdatedAtTime(cachedProfile?.updatedAt);
  const freshUpdatedAt = getUpdatedAtTime(freshProfile.updatedAt);

  return (
    cachedUpdatedAt !== null &&
    freshUpdatedAt !== null &&
    cachedUpdatedAt > freshUpdatedAt
  );
}

function getProfileKey(userId: string, currentUserId: number | null) {
  return `${userId}:${currentUserId ?? "guest"}`;
}

export function useUserProfile(userId?: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasCachedProfile, setHasCachedProfile] = useState(false);
  const [cacheState, setCacheState] = useState<UserProfileCacheState>("none");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [hasLoadedCurrentUserId, setHasLoadedCurrentUserId] = useState(false);

  const [username, setUsername] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [favoriteTeams, setFavoriteTeams] = useState<FavoriteTeamKey[]>([]);

  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const activeProfileKeyRef = useRef<string | null>(null);
  const lastLoadedProfileKeyRef = useRef<string | null>(null);
  const followLoadingRef = useRef(false);

  const { shouldRestore, targetUserId, type, openModal, clearRestore } =
    useFollowersStore();

  const teamLookups = useMemo<
    Record<FavoriteLeague, Map<string, TeamLookupItem>>
  >(
    () => ({
      nba: createTeamLookup(teams),
      wnba: createTeamLookup(wnbaTeams),
      nfl: createTeamLookup(nflTeams),
      cfb: createTeamLookup(cfbTeams),
      cbb: createTeamLookup(cbbTeams),
      wcbb: createTeamLookup(wcbbTeams),
      mlb: createTeamLookup(mlbTeams),
      cb: createTeamLookup(cbTeams),
      sb: createTeamLookup(sbTeams),
      nhl: createTeamLookup(nhlTeams),
    }),
    [],
  );

  activeProfileKeyRef.current =
    userId && hasLoadedCurrentUserId
      ? getProfileKey(userId, currentUserId)
      : null;

  const resetProfileState = useCallback(() => {
    setUsername(null);
    setFullName(null);
    setBio(null);
    setProfileImage(null);
    setBannerImage(null);
    setFollowersCount(0);
    setFollowingCount(0);
    setFavoriteTeams([]);
    setIsFollowing(false);
  }, []);

  const applyDisplayProfile = useCallback(
    (profile: DisplayProfile | CachedUserProfilePayload) => {
      setUsername(profile.username);
      setFullName(profile.fullName);
      setBio(profile.bio);
      setProfileImage(profile.profileImage);
      setBannerImage(profile.bannerImage);
      setFavoriteTeams(profile.favoriteTeams);
    },
    [],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    void clearExpiredUserProfileCache();
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadCurrentUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        if (!isActive || !isMountedRef.current) return;

        setCurrentUserId(parseStoredUserId(storedUserId));
      } catch (error) {
        console.warn("Failed to load current user id", error);
        if (!isActive || !isMountedRef.current) return;

        setCurrentUserId(null);
      } finally {
        if (isActive && isMountedRef.current) {
          setHasLoadedCurrentUserId(true);
        }
      }
    };

    loadCurrentUserId();

    return () => {
      isActive = false;
    };
  }, []);

  const fetchUserData = useCallback(
    async (options?: { hydrateCache?: boolean }) => {
      if (!userId) {
        requestIdRef.current += 1;
        lastLoadedProfileKeyRef.current = null;
        resetProfileState();
        setHasCachedProfile(false);
        setCacheState("none");
        setIsRefreshing(false);
        setIsLoading(false);
        return;
      }

      if (!hasLoadedCurrentUserId) return;

      const requestId = ++requestIdRef.current;
      const profileKey = getProfileKey(userId, currentUserId);
      const shouldShowInitialLoading =
        lastLoadedProfileKeyRef.current !== profileKey;
      let cachedProfile: CachedUserProfilePayload | null = null;
      let didHydrateCache = false;

      if (shouldShowInitialLoading) {
        resetProfileState();
        setHasCachedProfile(false);
        setCacheState("none");
        setIsRefreshing(false);
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      if (options?.hydrateCache !== false) {
        const cachedResult = await getCachedUserProfile(userId);

        if (
          !isMountedRef.current ||
          requestId !== requestIdRef.current ||
          activeProfileKeyRef.current !== profileKey
        ) {
          return;
        }

        if (cachedResult) {
          cachedProfile = cachedResult.profile;
          didHydrateCache = true;
          applyDisplayProfile(cachedResult.profile);
          setHasCachedProfile(true);
          setCacheState(cachedResult.cacheState);
          setIsLoading(false);
          setIsRefreshing(true);
          lastLoadedProfileKeyRef.current = profileKey;
        }
      }

      try {
        const { data } = await apiClient.get<UserProfileResponse>(
          `api/users/id/${userId}`,
        );

        if (
          !isMountedRef.current ||
          requestId !== requestIdRef.current ||
          activeProfileKeyRef.current !== profileKey
        ) {
          return;
        }

        const freshProfile = normalizeDisplayProfile(data, userId);
        const displayProfile =
          cachedProfile &&
          shouldPreferCachedDisplay(cachedProfile, freshProfile)
            ? cachedProfile
            : freshProfile;

        applyDisplayProfile(displayProfile);
        setFollowersCount(parseCount(data.followersCount));
        setFollowingCount(parseCount(data.followingCount));
        setIsFollowing(
          typeof data.isFollowing === "boolean" ? data.isFollowing : false,
        );
        setHasCachedProfile(true);
        if (displayProfile !== cachedProfile) {
          setCacheState("fresh");
        }
        lastLoadedProfileKeyRef.current = profileKey;

        await setCachedUserProfile(
          userId,
          buildCachedProfilePayload(freshProfile),
        );
      } catch (error) {
        if (
          !isMountedRef.current ||
          requestId !== requestIdRef.current ||
          activeProfileKeyRef.current !== profileKey
        ) {
          return;
        }

        console.warn("Failed to load user profile", error);

        if (shouldShowInitialLoading && !didHydrateCache) {
          resetProfileState();
          setHasCachedProfile(false);
          setCacheState("none");
          lastLoadedProfileKeyRef.current = null;
        }
      } finally {
        if (
          isMountedRef.current &&
          requestId === requestIdRef.current &&
          activeProfileKeyRef.current === profileKey
        ) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [
      applyDisplayProfile,
      currentUserId,
      hasLoadedCurrentUserId,
      resetProfileState,
      userId,
    ],
  );

  useEffect(() => {
    if (!userId) {
      requestIdRef.current += 1;
      lastLoadedProfileKeyRef.current = null;
      resetProfileState();
      setHasCachedProfile(false);
      setCacheState("none");
      setIsRefreshing(false);
      setIsLoading(false);
      return;
    }

    if (!hasLoadedCurrentUserId) return;

    const profileKey = getProfileKey(userId, currentUserId);
    if (lastLoadedProfileKeyRef.current === profileKey) return;

    fetchUserData();
  }, [
    currentUserId,
    fetchUserData,
    hasLoadedCurrentUserId,
    resetProfileState,
    userId,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (shouldRestore && targetUserId) {
        clearRestore();
        openModal(type, targetUserId, currentUserId?.toString());
      }
    }, [
      shouldRestore,
      targetUserId,
      type,
      currentUserId,
      openModal,
      clearRestore,
    ]),
  );

  const toggleFollow = useCallback(async () => {
    if (
      !userId ||
      currentUserId === null ||
      String(currentUserId) === userId ||
      followLoadingRef.current
    ) {
      return;
    }

    const previousIsFollowing = isFollowing ?? false;
    const previousFollowersCount = followersCount;
    const optimisticIsFollowing = !previousIsFollowing;

    setIsFollowing(optimisticIsFollowing);
    setFollowersCount((count) =>
      optimisticIsFollowing ? count + 1 : Math.max(count - 1, 0),
    );
    followLoadingRef.current = true;
    setFollowLoading(true);

    try {
      await apiClient.post("api/follows/toggle", {
        followeeId: userId,
        isFollowing: optimisticIsFollowing,
      });
      await fetchUserData({ hydrateCache: false });
    } catch (error) {
      console.warn("Failed to toggle follow", error);
      if (isMountedRef.current) {
        setIsFollowing(previousIsFollowing);
        setFollowersCount(previousFollowersCount);
      }
    } finally {
      followLoadingRef.current = false;
      if (isMountedRef.current) {
        setFollowLoading(false);
      }
    }
  }, [currentUserId, fetchUserData, followersCount, isFollowing, userId]);

  const favoriteTeamsWithLeague = useMemo<Team[]>(
    () =>
      favoriteTeams
        .map((favorite): Team | null => {
          const [league, id] = favorite.split(":");
          if (!league || !id || !isFavoriteLeague(league)) {
            return null;
          }

          const team = teamLookups[league].get(id);
          return team
            ? {
                ...team,
                espnId: team.espnId ?? null,
                city: team.city ?? undefined,
                location: team.location ?? undefined,
                league,
              }
            : null;
        })
        .filter((team): team is Team => team !== null),
    [favoriteTeams, teamLookups],
  );

  const refreshProfile = useCallback(
    () => fetchUserData({ hydrateCache: false }),
    [fetchUserData],
  );

  return {
    isLoading,
    isRefreshing,
    hasCachedProfile,
    cacheState,
    username,
    fullName,
    bio,
    profileImage,
    bannerImage,
    followersCount,
    followingCount,
    isFollowing: isFollowing ?? false,
    followLoading,
    favoriteTeamsWithLeague,
    fadeAnim,
    currentUserId,

    // Actions
    toggleFollow,
    refreshProfile,
    fetchUserData,
  };
}
