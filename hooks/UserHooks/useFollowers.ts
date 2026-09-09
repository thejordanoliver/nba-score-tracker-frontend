// hooks/UserHooks/useFollowers.ts

import { apiClient } from "@/utils/apiClient";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * User shape returned by the followers / following endpoints.
 * Images are expected to be remote URLs, usually Cloudinary or normalized server URLs.
 */
export type User = {
  id: number | string;
  username: string;
  profile_image: string;
  full_name: string;
  banner_image: string;
  bio?: string | null;
  followers_count?: number;
  isFollowing: boolean;
  followsYou?: boolean;
};

type FollowListType = "followers" | "following";

type ToggleFollowResponse = {
  isFollowing: boolean;
};

const followersCache = new Map<string, User[]>();

const getCacheKey = (
  currentUserId: string,
  targetUserId: string,
  type: FollowListType,
) => `${currentUserId || "guest"}:${targetUserId}:${type}`;

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "error" in error.response.data &&
    typeof error.response.data.error === "string"
  ) {
    return error.response.data.error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Error fetching users";
};

const isCanceledRequest = (error: unknown) => {
  if (typeof error !== "object" || error === null) return false;

  return (
    ("code" in error && error.code === "ERR_CANCELED") ||
    ("name" in error && error.name === "CanceledError")
  );
};

const updateUserFollowState = (
  users: User[],
  followeeId: string,
  isFollowing: boolean,
) =>
  users.map((user) =>
    user.id.toString() === followeeId.toString()
      ? { ...user, isFollowing }
      : user,
  );

const reconcileFollowList = (
  users: User[],
  currentUserId: string,
  targetUserId: string,
  type: FollowListType,
  followeeId: string,
  isFollowing: boolean,
) => {
  if (
    !isFollowing &&
    type === "following" &&
    targetUserId === currentUserId
  ) {
    return users.filter(
      (user) => user.id.toString() !== followeeId.toString(),
    );
  }

  return updateUserFollowState(users, followeeId, isFollowing);
};

const updateFollowStateInCache = (
  currentUserId: string,
  followeeId: string,
  isFollowing: boolean,
) => {
  const viewerCachePrefix = `${currentUserId || "guest"}:`;
  const ownFollowingCacheKey = getCacheKey(
    currentUserId,
    currentUserId,
    "following",
  );

  followersCache.forEach((cachedUsers, cacheKey) => {
    if (!cacheKey.startsWith(viewerCachePrefix)) return;

    if (cacheKey === ownFollowingCacheKey) {
      if (!isFollowing) {
        followersCache.set(
          cacheKey,
          cachedUsers.filter(
            (user) => user.id.toString() !== followeeId.toString(),
          ),
        );
      } else if (
        !cachedUsers.some(
          (user) => user.id.toString() === followeeId.toString(),
        )
      ) {
        // The cache does not have enough profile data to append this user safely.
        followersCache.delete(cacheKey);
      } else {
        followersCache.set(
          cacheKey,
          updateUserFollowState(cachedUsers, followeeId, true),
        );
      }

      return;
    }

    const updatedUsers = updateUserFollowState(
      cachedUsers,
      followeeId,
      isFollowing,
    );

    followersCache.set(cacheKey, updatedUsers);
  });
};

/**
 * Hook to fetch and manage followers / following users for a profile.
 *
 * @param currentUserId - Logged-in user's ID.
 * @param targetUserId - Profile user ID whose followers/following are being viewed.
 * @param type - Whether to fetch "followers" or "following".
 */
export function useFollowers(
  currentUserId: string,
  targetUserId: string,
  type: FollowListType,
) {
  const cacheKey = useMemo(
    () => getCacheKey(currentUserId, targetUserId, type),
    [currentUserId, targetUserId, type],
  );

  const [users, setUsers] = useState<User[]>(() => {
    return followersCache.get(cacheKey) ?? [];
  });

  const [loading, setLoading] = useState(() => {
    return Boolean(targetUserId) && !followersCache.has(cacheKey);
  });

  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch followers/following when:
   * - currentUserId changes
   * - targetUserId changes
   * - type changes
   *
   * Uses cache first, then refreshes in the background.
   */
  useEffect(() => {
    if (!targetUserId) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const cachedUsers = followersCache.get(cacheKey);

    if (cachedUsers) {
      setUsers(cachedUsers);
      setLoading(false);
    } else {
      setUsers([]);
      setLoading(true);
    }

    setError(null);

    apiClient
      .get<User[]>(
        `/api/follows/${encodeURIComponent(targetUserId)}/${type}`,
        { signal: controller.signal },
      )
      .then((res) => {
        if (!isActive) return;

        const nextUsers = Array.isArray(res.data) ? res.data : [];

        followersCache.set(cacheKey, nextUsers);
        setUsers(nextUsers);
      })
      .catch((err) => {
        if (!isActive || isCanceledRequest(err)) return;

        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [cacheKey, currentUserId, targetUserId, type]);

  /**
   * Set the authenticated viewer's follow state for a specific user.
   *
   * @param followeeId - ID of the user to follow or unfollow.
   * @param isFollowing - Desired follow state.
   */
  const toggleFollow = useCallback(
    async (followeeId: string, isFollowing: boolean): Promise<boolean> => {
      if (
        !currentUserId ||
        !followeeId ||
        followeeId.toString() === currentUserId.toString()
      ) {
        throw new Error("Invalid follow request");
      }

      const res = await apiClient.post<ToggleFollowResponse>(
        "/api/follows/toggle",
        {
          followeeId: Number(followeeId),
          isFollowing,
        },
      );

      if (typeof res.data.isFollowing !== "boolean") {
        throw new Error("Invalid follow response");
      }

      const nextIsFollowing = res.data.isFollowing;

      updateFollowStateInCache(currentUserId, followeeId, nextIsFollowing);

      setUsers((prevUsers) => {
        const updatedUsers = reconcileFollowList(
          prevUsers,
          currentUserId,
          targetUserId,
          type,
          followeeId,
          nextIsFollowing,
        );

        followersCache.set(cacheKey, updatedUsers);

        return updatedUsers;
      });

      return nextIsFollowing;
    },
    [cacheKey, currentUserId, targetUserId, type],
  );

  return {
    users,
    loading,
    error,
    toggleFollow,
  };
}
