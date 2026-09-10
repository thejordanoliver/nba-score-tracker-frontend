// profile.tsx
import FavoritesSection from "@/components/Favorites/FavoritesSection";
import BadgePreviewSection from "@/components/Profile/Badges/BadgePreviewSection";
import TabBar from "@/components/TabBars/TabBar";
import { useBadges } from "@/hooks/ForumHooks/useBadges";
import { useBookmarkedPosts } from "@/hooks/ForumHooks/useBookmarkedPosts";
import { useUserPosts } from "@/hooks/UserHooks/useUserPosts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, useWindowDimensions, View } from "react-native";
import ConfirmModal from "../../components/ConfirmModal";
import { CustomHeader } from "../../components/CustomHeader";
import Forum from "../../components/Forum/Forum";
import BioSection from "../../components/Profile/BioSection";
import FollowStats from "../../components/Profile/FollowStats";
import ProfileBanner from "../../components/Profile/ProfileBanner";
import ProfileHeader from "../../components/Profile/ProfileHeader";
import { SkeletonProfileScreen } from "../../components/Skeletons/SkeletonProfileScreen";
import { useFavoriteTeamsContext } from "../../contexts/FavoriteTeamsContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { useAuth } from "../../hooks/UserHooks/useAuth";
import { useProfile } from "../../hooks/UserHooks/useProfile";
import { useFollowersStore } from "../../store/followersStore";
import { useProfileRefreshStore } from "../../store/profileRefreshStore";
import { useSettingsModalStore } from "../../store/settingsModalStore";
import { profileStyles } from "../../styles/ProfileStyles/ProfileScreenStyles";
import type { ForumPost } from "../../types/forum";
import type { LeagueType, Team } from "../../types/types";

type CachedUser = {
  id?: number;
  username?: string;
  fullName?: string;
  profileImage?: string;
};

export type ProfileTab = "favorites" | "badges" | "posts" | "bookmarks";

const normalizeCachedString = (value?: string | null) => {
  const trimmed = value?.trim() ?? "";

  if (trimmed === "null" || trimmed === "undefined") {
    return "";
  }

  return trimmed;
};

export default function ProfileScreen() {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = useMemo(() => profileStyles(isDark), [isDark]);
  const {
    favorites,
    favoriteSports,
    favoriteSportsLoading,
    favoriteSportsReady,
    loadFavorites,
    clearFavorites,
    allTeams,
  } = useFavoriteTeamsContext();
  const { width: screenWidth } = useWindowDimensions();
  const numColumns = 3;
  const horizontalPadding = 24;
  const columnGap = 8;
  const totalGap = columnGap * (numColumns - 1);
  const availableWidth = screenWidth - horizontalPadding - totalGap;
  const itemWidth = availableWidth / numColumns;
  const { logout } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasLoadedProfileRef = useRef(false);
  const lastLoadedUserIdRef = useRef<number | null>(null);
  const [isGridView, setIsGridView] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [cachedUser, setCachedUser] = useState<CachedUser | null>(null);
  const [selectedTab, setSelectedTab] = useState<ProfileTab>("favorites");

  const { shouldRefreshProfile, clearProfileRefresh } =
    useProfileRefreshStore();

  const {
    isLoading,
    currentUserId,
    username,
    fullName,
    bio,
    profileImage,
    bannerImage,
    followersCount,
    followingCount,
    loadProfile,
    resetProfile,
  } = useProfile();

  const { type, targetUserId, openModal, shouldRestore, clearRestore } =
    useFollowersStore();

  const { showOnReturn, setShowOnReturn, setShowSettingsModal } =
    useSettingsModalStore();

  const viewedUserId = currentUserId;

  const {
    featuredBadges,
    summary,
    loading: badgesLoading,
    error: badgesError,
    refresh: refreshBadges,
  } = useBadges({
    enabled: Boolean(currentUserId),
  });

  const {
    posts: userPosts,
    loading: userPostsLoading,
    refreshing: userPostsRefreshing,
    error: userPostsError,
    hasMore: hasMoreUserPosts,
    refresh: refreshUserPosts,
    loadMore: loadMoreUserPosts,
    updatePost: updateUserPost,
    deletePost: deleteUserPost,
    editPost: editUserPost,
  } = useUserPosts({
    userId: currentUserId,
    enabled: selectedTab === "posts" && Boolean(currentUserId),
  });

  const {
    posts: bookmarkedPosts,
    loading: bookmarksLoading,
    refreshing: bookmarksRefreshing,
    error: bookmarksError,
    hasMore: hasMoreBookmarks,
    refresh: refreshBookmarks,
    loadMore: loadMoreBookmarks,
    updatePost: updateBookmarkedPost,
    removePost: removeBookmarkedPost,
    deletePost: deleteBookmarkedPost,
    editPost: editBookmarkedPost,
  } = useBookmarkedPosts({
    enabled: selectedTab === "bookmarks" && Boolean(currentUserId),
  });

  const handleTabPress = useCallback((tab: ProfileTab) => {
    setSelectedTab(tab);
  }, []);

  const handleBookmarkedImagePress = useCallback(() => {}, []);

  const handleUserPostBookmarkChange = useCallback(
    (post: ForumPost, bookmarked: boolean) => {
      updateUserPost({
        ...post,
        bookmarked,
      });
    },
    [updateUserPost],
  );

  const handleBookmarkedBookmarkChange = useCallback(
    (post: ForumPost, bookmarked: boolean) => {
      if (bookmarked) {
        updateBookmarkedPost(post);
        return;
      }

      removeBookmarkedPost(post.id);
    },
    [removeBookmarkedPost, updateBookmarkedPost],
  );

  const toggleFavoriteTeamsView = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsGridView((previousValue) => !previousValue);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const signOut = useCallback(async () => {
    try {
      hasLoadedProfileRef.current = false;
      lastLoadedUserIdRef.current = null;

      setCachedUser(null);

      clearFavorites();
      resetProfile();

      try {
        await AsyncStorage.removeItem("authUser");
      } catch (error) {
        console.warn("Failed to clear cached auth user:", error);
      }

      await logout();
    } catch (error) {
      console.warn("Failed to sign out:", error);
    } finally {
      setShowSignOutModal(false);
    }
  }, [clearFavorites, logout, resetProfile]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initialize = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("authUser");

          if (storedUser && isActive) {
            const parsedUser = JSON.parse(storedUser) as CachedUser | null;

            setCachedUser({
              id: parsedUser?.id,
              username: normalizeCachedString(parsedUser?.username),
              fullName: normalizeCachedString(parsedUser?.fullName),
              profileImage: normalizeCachedString(parsedUser?.profileImage),
            });
          } else if (isActive) {
            setCachedUser(null);
          }
        } catch (error) {
          console.warn("Failed to read cached authentication user:", error);

          try {
            await AsyncStorage.removeItem("authUser");
          } catch (removeError) {
            console.warn(
              "Failed to clear invalid cached auth user:",
              removeError,
            );
          }

          if (isActive) {
            setCachedUser(null);
          }
        }

        let loadedUserId = currentUserId;

        const shouldLoadProfile =
          !hasLoadedProfileRef.current || shouldRefreshProfile;

        if (shouldLoadProfile) {
          loadedUserId = await loadProfile();

          if (shouldRefreshProfile) {
            clearProfileRefresh();
          }
        }

        if (!isActive) {
          return;
        }

        const activeUserId = loadedUserId ?? currentUserId;

        hasLoadedProfileRef.current = Boolean(activeUserId);

        if (activeUserId && activeUserId !== lastLoadedUserIdRef.current) {
          await loadFavorites(activeUserId);

          if (!isActive) {
            return;
          }

          lastLoadedUserIdRef.current = activeUserId;
        }

        if (shouldRestore && targetUserId) {
          clearRestore();

          openModal(
            type,
            targetUserId,
            activeUserId ? String(activeUserId) : undefined,
          );
        }

        if (showOnReturn) {
          setShowSettingsModal(true);
          setShowOnReturn(false);
        }
      };

      initialize();

      return () => {
        isActive = false;
      };
    }, [
      currentUserId,
      loadProfile,
      loadFavorites,
      shouldRestore,
      targetUserId,
      type,
      openModal,
      clearRestore,
      showOnReturn,
      setShowSettingsModal,
      setShowOnReturn,
      shouldRefreshProfile,
      clearProfileRefresh,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedTab === "bookmarks" && currentUserId) {
        refreshBookmarks();
      }
    }, [currentUserId, refreshBookmarks, selectedTab]),
  );

  useLayoutEffect(() => {
    const safeUsername =
      normalizeCachedString(username) ||
      normalizeCachedString(cachedUser?.username);

    const headerTitle = safeUsername ? `@${safeUsername}` : "Profile";

    const messageUserId = currentUserId ?? cachedUser?.id;

    navigation.setOptions({
      header: () => (
        <CustomHeader
          title={headerTitle}
          tabName="Profile"
          onLogout={() => {
            setShowSignOutModal(true);
          }}
          onSettings={() => {
            router.push("/settings");
          }}
          onMessages={() => {
            router.push({
              pathname: "/messages",
              params: {
                userId: messageUserId ? String(messageUserId) : "",
                username: username ?? cachedUser?.username ?? "",
                fullName: fullName ?? cachedUser?.fullName ?? "",
                profileImage: profileImage ?? cachedUser?.profileImage ?? "",
              },
            });
          }}
          onEdit={() => {
            router.push("/edit-profile");
          }}
        />
      ),
    });
  }, [
    navigation,
    router,
    username,
    cachedUser,
    currentUserId,
    fullName,
    profileImage,
  ]);

  const favoriteTeamsWithLeague = useMemo<Team[]>(() => {
    return favorites
      .map((favorite): Team | null => {
        const [league, id] = favorite.split(":");

        const team = allTeams.find(
          (item) => item.league === league && String(item.id) === id,
        );

        if (!team) {
          return null;
        }

        return {
          ...team,
          espnId: team.espnId ?? null,
          city: team.city ?? undefined,
          location: team.location ?? undefined,
          league: league as LeagueType,
        };
      })
      .filter((team): team is Team => team !== null);
  }, [allTeams, favorites]);

  const onFollowersPress = useCallback(() => {
    if (!currentUserId) {
      return;
    }

    router.push({
      pathname: "/followers",
      params: {
        type: "followers",
        currentUserId: String(currentUserId),
        targetUserId: String(currentUserId),
      },
    });
  }, [currentUserId, router]);

  const onFollowingPress = useCallback(() => {
    if (!currentUserId) {
      return;
    }

    router.push({
      pathname: "/followers",
      params: {
        type: "following",
        currentUserId: String(currentUserId),
        targetUserId: String(currentUserId),
      },
    });
  }, [currentUserId, router]);

  if (isLoading) {
    return <SkeletonProfileScreen isDark={isDark} />;
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProfileBanner
          bannerImage={bannerImage}
          profileImage={profileImage}
          isDark={isDark}
        />

        <FollowStats
          followersCount={followersCount}
          followingCount={followingCount}
          isDark={isDark}
          currentUserId={currentUserId ? String(currentUserId) : ""}
          targetUserId={currentUserId ? String(currentUserId) : ""}
          onFollowersPress={onFollowersPress}
          onFollowingPress={onFollowingPress}
        />

        <ProfileHeader
          fullName={fullName}
          username={username}
          isDark={isDark}
          isCurrentUser
          onEditPress={() => {
            router.push("/edit-profile");
          }}
        />

        <BioSection bio={bio} isDark={isDark} />

        <TabBar
          tabs={["favorites", "badges", "posts", "bookmarks"] as const}
          selected={selectedTab}
          onTabPress={handleTabPress}
          isDark={isDark}
        />

        {selectedTab === "favorites" && (
          <View style={styles.contentContainer}>
            <FavoritesSection
              favoriteTeams={favoriteTeamsWithLeague}
              favoriteSports={favoriteSports}
              favoriteSportsLoading={favoriteSportsLoading}
              favoriteSportsReady={favoriteSportsReady}
              isGridView={isGridView}
              fadeAnim={fadeAnim}
              onToggleView={toggleFavoriteTeamsView}
              itemWidth={itemWidth}
              isCurrentUser={currentUserId === viewedUserId}
            />
          </View>
        )}

        {selectedTab === "badges" && (
          <View style={styles.contentContainer}>
            <BadgePreviewSection
              badges={featuredBadges}
              earnedCount={summary.earnedCount}
              totalCount={summary.totalCount}
              isDark={isDark}
              itemWidth={itemWidth}
              loading={badgesLoading}
              error={badgesError}
              onRetry={refreshBadges}
              onPressSeeAll={() => {
                router.push("/badges");
              }}
            />
          </View>
        )}
        {selectedTab === "posts" && (
          <View style={styles.bookmarkContainer}>
            <Forum
              posts={userPosts}
              currentUserId={currentUserId}
              isDark={isDark}
              loading={userPostsLoading}
              refreshing={userPostsRefreshing}
              error={userPostsError}
              hasMore={hasMoreUserPosts}
              onRetry={refreshUserPosts}
              onLoadMore={loadMoreUserPosts}
              onBookmarkChange={handleUserPostBookmarkChange}
              onDeletePost={deleteUserPost}
              onEditPost={editUserPost}
              onImagePress={handleBookmarkedImagePress}
              showCreateButton={false}
              emptyTitle="No posts yet"
              emptyMessage="Posts you create will appear here."
              emptyIcon="chatbubble-outline"
              scrollEnabled={false}
              loadMoreMode="button"
              skeletonCount={3}
            />
          </View>
        )}

        {selectedTab === "bookmarks" && (
          <View style={styles.bookmarkContainer}>
            <Forum
              posts={bookmarkedPosts}
              currentUserId={currentUserId}
              isDark={isDark}
              loading={bookmarksLoading}
              refreshing={bookmarksRefreshing}
              error={bookmarksError}
              hasMore={hasMoreBookmarks}
              onRetry={refreshBookmarks}
              onLoadMore={loadMoreBookmarks}
              onBookmarkChange={handleBookmarkedBookmarkChange}
              onDeletePost={deleteBookmarkedPost}
              onEditPost={editBookmarkedPost}
              onImagePress={handleBookmarkedImagePress}
              showCreateButton={false}
              emptyTitle="No bookmarks yet"
              emptyMessage="Saved forum posts will appear here."
              emptyIcon="bookmark-outline"
              scrollEnabled={false}
              loadMoreMode="button"
              skeletonCount={3}
            />
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showSignOutModal}
        title="Log Out?"
        message="You will need to log in again to access your account."
        confirmText="Log out"
        cancelText="Cancel"
        variant="danger"
        onConfirm={signOut}
        onCancel={() => {
          setShowSignOutModal(false);
        }}
      />
    </>
  );
}
