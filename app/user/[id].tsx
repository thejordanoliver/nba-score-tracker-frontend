import BioSection from "components/Profile/BioSection";
import FavoriteTeamsSection from "components/Favorites/FavoriteTeamsSection";
import FollowersModal from "components/Profile/FollowersModal";
import FollowStats from "components/Profile/FollowStats";
import ProfileBanner from "components/Profile/ProfileBanner";
import ProfileHeader from "components/Profile/ProfileHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";

import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { useFollowersModalStore } from "store/followersModalStore";

import { teams } from "constants/teams";
import { getStyles } from "styles/ProfileScreen.styles";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function parseImageUrl(url: string | null | undefined): string | null {
  if (!url || url === "null") return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function UserProfileScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const numColumns = 3;
  const horizontalPadding = 40;
  const columnGap = 12;
  const totalGap = columnGap * (numColumns - 1);
  const availableWidth = screenWidth - horizontalPadding - totalGap;
  const itemWidth = availableWidth / numColumns;

  const params = useLocalSearchParams();
  const userId = params.id as string | undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [isGridView, setIsGridView] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    isVisible,
    type,
    targetUserId,
    openModal,
    closeModal,
    shouldRestore,
    clearRestore,
  } = useFollowersModalStore();

  // Load current user ID from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");
        if (storedId) setCurrentUserId(Number(storedId));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  // Fetch user profile data
  const fetchUserData = useCallback(async () => {
    if (!userId || currentUserId === null) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/api/users/${userId}?currentUserId=${currentUserId}`
      );
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();

      setUsername(data.username ?? null);
      setFullName(data.fullName ?? null);
      setBio(data.bio ?? null);
      setProfileImage(parseImageUrl(data.profileImage));
      setBannerImage(parseImageUrl(data.bannerImage));
      setFollowersCount(data.followersCount ?? data.followers_count ?? 0);
      setFollowingCount(data.followingCount ?? data.following_count ?? 0);
      setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
      if (typeof data.isFollowing === "boolean") {
        setIsFollowing(data.isFollowing);
      }
    } catch {
      setUsername(null);
      setFullName(null);
      setBio(null);
      setProfileImage(null);
      setBannerImage(null);
      setFollowersCount(0);
      setFollowingCount(0);
      setFavorites([]);
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentUserId]);

 // Restore modal + reload on screen focus
useFocusEffect(
  useCallback(() => {
    if (shouldRestore && targetUserId) {
      clearRestore(); // clear before opening
      openModal(
        type,
        targetUserId,
        currentUserId ? String(currentUserId) : undefined
      );
    }

    // ✅ Only fetch on screen focus, not when modal closes
    if (currentUserId !== null) {
      fetchUserData();
    }
  }, [
    shouldRestore,
    targetUserId,
    type,
    currentUserId, // ✅ removed isVisible
    openModal,
    clearRestore,
    fetchUserData,
  ])
);


  // Navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          title={username ? `@${username}` : "User"}
          tabName="User"
          onBack={() => router.back()}
        />
      ),
    });
  }, [navigation, username, router]);

  // Toggle favorite teams grid/list
  const toggleFavoriteTeamsView = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsGridView((prev) => !prev);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // Follow/unfollow handler
  const handleToggleFollow = async () => {
    if (followLoading || currentUserId === null || !userId) return;

    const prevFollowing = isFollowing;
    const prevCount = followersCount;
    const newFollowing = !prevFollowing;
    const newCount = newFollowing ? prevCount + 1 : Math.max(prevCount - 1, 0);

    setIsFollowing(newFollowing);
    setFollowersCount(newCount);
    setFollowLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/api/follows/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: currentUserId, followeeId: userId }),
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
      const data = await res.json();
      setIsFollowing(data.isFollowing);
      setFollowersCount((count) =>
        data.isFollowing
          ? Math.max(count, newCount)
          : Math.min(count, newCount)
      );
    } catch (err) {
      console.error("Failed to toggle follow:", err);
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
    } finally {
      setFollowLoading(false);
    }
  };

  const favoriteTeams = teams.filter((team) => favorites.includes(team.id));
  const styles = getStyles(isDark);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDark ? "#000" : "#fff",
        }}
      >
        <ActivityIndicator size="large" color={isDark ? "white" : "black"} />
      </View>
    );
  }

  const onFollowersPress = () => {
    if (currentUserId && userId) {
      openModal("followers", userId, String(currentUserId));
    }
  };

  const onFollowingPress = () => {
    if (currentUserId && userId) {
      openModal("following", userId, String(currentUserId));
    }
  };

  const isCurrentUser =
    currentUserId !== null && String(currentUserId) === userId;

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
        contentInsetAdjustmentBehavior="never"
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
          targetUserId={userId ?? ""}
          onFollowersPress={onFollowersPress}
          onFollowingPress={onFollowingPress}
        />

        <ProfileHeader
          fullName={fullName}
          username={username}
          isDark={isDark}
          isCurrentUser={isCurrentUser}
          isFollowing={isFollowing}
          loading={followLoading}
          onToggleFollow={handleToggleFollow}
        />

        <BioSection bio={bio} isDark={isDark} />

        <View style={styles.favoritesContainer}>
          <FavoriteTeamsSection
            favoriteTeams={favoriteTeams}
            isGridView={isGridView}
            fadeAnim={fadeAnim}
            toggleFavoriteTeamsView={toggleFavoriteTeamsView}
            styles={styles}
            itemWidth={itemWidth}
            isCurrentUser={false}
            username={username ?? undefined}
          />
        </View>
      </ScrollView>

      
    </>
  );
}
