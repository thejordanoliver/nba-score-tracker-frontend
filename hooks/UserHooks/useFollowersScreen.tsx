// hooks/UserHooks/useFollowersScreen.tsx

import { CustomHeader } from "@/components/CustomHeader";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import {
  useFollowers,
  type User as FollowersHookUser,
} from "hooks/UserHooks/useFollowers";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useProfileRefreshStore } from "store/profileRefreshStore";
import { followersListStyles } from "styles/ProfileStyles/FollowersListStyles";
import { Mode } from "types/user";
type RouteParam = string | string[] | undefined;

export type FollowerUser = Omit<
  FollowersHookUser,
  "id" | "full_name" | "profile_image"
> & {
  id: string;
  username: string;
  full_name: string;
  fullName?: string | null;
  profile_image: string;
  profileImage?: string | null;
  isFollowing: boolean;
};

const normalizeRouteParam = (param: RouteParam) => {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
};

const normalizeFollowerUser = (
  user: FollowersHookUser & {
    fullName?: string | null;
    profileImage?: string | null;
  },
): FollowerUser => {
  const fullName = user.fullName ?? user.full_name ?? "";
  const profileImage = user.profileImage ?? user.profile_image ?? "";

  return {
    ...user,
    id: String(user.id),
    username: user.username ?? "",
    full_name: fullName,
    fullName: user.fullName,
    profile_image: profileImage,
    profileImage: user.profileImage,
  };
};

const getUserSignature = (user: FollowerUser) =>
  [
    user.id,
    user.username,
    user.full_name,
    user.fullName ?? "",
    user.profile_image,
    user.profileImage ?? "",
    String(user.isFollowing),
    String(user.followsYou ?? false),
  ].join("\u0001");

export function useFollowersScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = useMemo(() => followersListStyles(isDark), [isDark]);
  const { type, currentUserId, targetUserId } = useLocalSearchParams<{
    type?: Mode | string[];
    currentUserId?: string | string[];
    targetUserId?: string | string[];
  }>();

  const mode = useMemo<Mode>(() => {
    const normalizedType = normalizeRouteParam(type);
    return normalizedType === "following" ? "following" : "followers";
  }, [type]);

  const normalizedCurrentUserId = useMemo(
    () => normalizeRouteParam(currentUserId),
    [currentUserId],
  );

  const normalizedTargetUserId = useMemo(
    () => normalizeRouteParam(targetUserId),
    [targetUserId],
  );

  const requestProfileRefresh = useProfileRefreshStore(
    (state) => state.requestProfileRefresh,
  );

  const headerTitle = useMemo(
    () => (mode === "followers" ? "Followers" : "Following"),
    [mode],
  );

  const [search, setSearch] = useState("");
  const [loadingIdSet, setLoadingIdSet] = useState<Set<string>>(
    () => new Set(),
  );
  const [users, setUsers] = useState<FollowerUser[]>([]);

  const usersRef = useRef<FollowerUser[]>([]);
  const loadingIdsRef = useRef<Set<string>>(new Set());
  const sourceSignatureRef = useRef("");

  const {
    users: usersFromHook,
    loading,
    error,
    toggleFollow,
  } = useFollowers(normalizedCurrentUserId, normalizedTargetUserId, mode);

  const normalizedSourceUsers = useMemo(
    () => (usersFromHook ?? []).map(normalizeFollowerUser),
    [usersFromHook],
  );

  const sourceSignature = useMemo(
    () => normalizedSourceUsers.map(getUserSignature).join("\u0002"),
    [normalizedSourceUsers],
  );

  const loadingIds = useMemo(() => Array.from(loadingIdSet), [loadingIdSet]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader title={headerTitle} tabName="User" onBack={handleBack} />
      ),
    });
  }, [navigation, headerTitle, handleBack]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const addLoadingId = useCallback((targetId: string) => {
    loadingIdsRef.current.add(targetId);
    setLoadingIdSet(new Set(loadingIdsRef.current));
  }, []);

  const removeLoadingId = useCallback((targetId: string) => {
    loadingIdsRef.current.delete(targetId);
    setLoadingIdSet(new Set(loadingIdsRef.current));
  }, []);

  useEffect(() => {
    if (sourceSignatureRef.current === sourceSignature) return;

    sourceSignatureRef.current = sourceSignature;

    setUsers((prevUsers) => {
      if (loadingIdsRef.current.size === 0) {
        return normalizedSourceUsers;
      }

      const optimisticUsersById = new Map(
        prevUsers.map((user) => [user.id, user]),
      );

      return normalizedSourceUsers.map((user) =>
        loadingIdsRef.current.has(user.id)
          ? (optimisticUsersById.get(user.id) ?? user)
          : user,
      );
    });
  }, [normalizedSourceUsers, sourceSignature]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const handleUserPress = useCallback(
    (userId: string) => {
      if (!userId) return;
      router.push(`/user/${userId}`);
    },
    [router],
  );

  const handleToggleFollow = useCallback(
    async (targetId: string) => {
      if (
        !normalizedCurrentUserId ||
        !targetId ||
        targetId === normalizedCurrentUserId ||
        loadingIdsRef.current.has(targetId)
      ) {
        return;
      }

      const previousIsFollowing = usersRef.current.find(
        (user) => user.id === targetId,
      )?.isFollowing;

      if (previousIsFollowing === undefined) return;

      addLoadingId(targetId);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === targetId
            ? { ...user, isFollowing: !user.isFollowing }
            : user,
        ),
      );

      try {
        const nextIsFollowing = await toggleFollow(
          targetId,
          !previousIsFollowing,
        );

        setUsers((prevUsers) =>
          !nextIsFollowing &&
          mode === "following" &&
          normalizedTargetUserId === normalizedCurrentUserId
            ? prevUsers.filter((user) => user.id !== targetId)
            : prevUsers.map((user) =>
                user.id === targetId
                  ? { ...user, isFollowing: nextIsFollowing }
                  : user,
              ),
        );

        requestProfileRefresh();
      } catch {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === targetId
              ? { ...user, isFollowing: previousIsFollowing }
              : user,
          ),
        );
      } finally {
        removeLoadingId(targetId);
      }
    },
    [
      addLoadingId,
      mode,
      normalizedCurrentUserId,
      normalizedTargetUserId,
      removeLoadingId,
      requestProfileRefresh,
      toggleFollow,
    ],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((user) => {
      const username = user.username.toLowerCase();
      const fullName = user.full_name.toLowerCase();
      const displayName = user.fullName?.toLowerCase() ?? "";

      return (
        username.includes(normalizedSearch) ||
        fullName.includes(normalizedSearch) ||
        displayName.includes(normalizedSearch)
      );
    });
  }, [users, search]);

  return {
    styles,
    search,
    filteredUsers,
    loading,
    loadingIds,
    error,
    normalizedCurrentUserId,
    handleSearchChange,
    handleUserPress,
    handleToggleFollow,
  };
}
