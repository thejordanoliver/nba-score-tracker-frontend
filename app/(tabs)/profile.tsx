// profile.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import ConfirmModal from "components/ConfirmModal";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import FavoriteTeamsSection from "components/Favorites/FavoriteTeamsSection";
import BioSection from "components/Profile/BioSection";
import FollowStats from "components/Profile/FollowStats";
import ProfileBanner from "components/Profile/ProfileBanner";
import ProfileHeader from "components/Profile/ProfileHeader";
import { SkeletonProfileScreen } from "components/SkeletonProfileScreen";
import { teams } from "constants/teams";
import { teams as nflteams } from "constants/teamsNFL";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useAuth } from "hooks/useAuth";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useFollowersModalStore } from "store/followersModalStore";
import { useSettingsModalStore } from "store/settingsModalStore";
import { getStyles } from "styles/ProfileScreen.styles";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function parseImageUrl(url: string | null | undefined): string | null {
  if (!url || url === "null") return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function ProfileScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const numColumns = 3;
  const horizontalPadding = 40;
  const columnGap = 12;
  const totalGap = columnGap * (numColumns - 1);
  const availableWidth = screenWidth - horizontalPadding - totalGap;
  const itemWidth = availableWidth / numColumns;
  const { deleteAccount } = useAuth();
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
  const [password, setPassword] = useState("");
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const viewedUserId = currentUserId;

  const {
    isVisible,
    type,
    targetUserId,
    openModal,
    closeModal,
    shouldRestore,
    clearRestore,
  } = useFollowersModalStore();
  const {
    showSettingsModal,
    setShowSettingsModal,
    showOnReturn,
    setShowOnReturn,
  } = useSettingsModalStore();

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

  const handleNavigateSettings = (
    screen: "accountdetails" | "appearance" | "preferences"
  ) => {
    setShowSettingsModal(false);
    router.push(`/settings/${screen}`);
  };

  const loadFollowCounts = async (userId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${userId}`);
      const data = await res.json();
      setFollowersCount(data.followersCount ?? 0);
      setFollowingCount(data.followingCount ?? 0);
    } catch (error) {
      console.warn("Failed to load follow counts:", error);
    }
  };

  const loadProfileData = async () => {
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

      setUsername(data.username ?? null);
      setFullName(data.fullName ?? null);
      setBio(data.bio ?? null);
      setProfileImage(parseImageUrl(data.profileImage));
      setBannerImage(parseImageUrl(data.bannerImage));
      setFavorites(data.favorites ? JSON.parse(data.favorites) : []);

      if (data.userId) {
        setCurrentUserId(Number(data.userId));
        await loadFollowCounts(data.userId);
      }
    } catch (error) {
      console.warn("Failed to load profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      if (!password.trim()) {
        alert("Please enter your password.");
        return;
      }
      await deleteAccount(password); // backend call
      setShowDeleteModal(false);
      setPassword("");
      router.replace("/settings/deleteaccountsplash");
    } catch (error) {
      alert("Failed to delete account. Check your password and try again.");
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.clear();
      router.replace("/login");
    } catch (error) {
      console.warn("Failed to sign out:", error);
    } finally {
      setShowSignOutModal(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const initialize = async () => {
        if (shouldRestore && targetUserId) {
          clearRestore(); // ✅ clear first
          openModal(
            type,
            targetUserId,
            currentUserId ? String(currentUserId) : undefined
          );
        }

        if (isVisible || !isActive) return;

        setIsLoading(true);
        await loadProfileData();

        // If user navigated back and expects the settings modal, show it
        if (showOnReturn) {
          setShowSettingsModal(true);
          setShowOnReturn(false); // reset the flag
        }
      };

      initialize();

      return () => {
        isActive = false;
      };
    }, [
      shouldRestore,
      targetUserId,
      type,
      isVisible,
      currentUserId,
      openModal,
      clearRestore,
      showOnReturn,
      setShowSettingsModal,
      setShowOnReturn,
    ])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          title={`@${username}`}
          tabName="Profile"
          onLogout={() => setShowSignOutModal(true)}
          onSettings={() => router.push("/settings")} // ← this is the fix
        />
      ),
    });
  }, [navigation, username, isDark]);

  const favoriteTeams = favorites
    .map((fav: string) => {
      // fav format: "NBA:1610612737" or "NFL:13"
      const [league, id] = fav.split(":");
      if (league === "NBA") return teams.find((t) => t.id === id);
      if (league === "NFL") return nflteams.find((t) => t.id === id);
      return null;
    })
    .filter(Boolean); // remove nulls
  const styles = getStyles(isDark);

  const favoriteTeamsWithLeague = favorites
    .map((fav: string) => {
      const [league, id] = fav.split(":");
      let team;
      if (league === "NBA") team = teams.find((t) => t.id === id); // NBA IDs are strings
      if (league === "NFL") team = nflteams.find((t) => String(t.id) === id); // convert number to string
      if (!team) return null;
      return { ...team, league: league as "NBA" | "NFL" };
    })
    .filter(Boolean);

  if (isLoading) return <SkeletonProfileScreen isDark={isDark} />;

  const onFollowersPress = () => {
    if (currentUserId) {
      openModal("followers", String(currentUserId), String(currentUserId));
    }
  };

  const onFollowingPress = () => {
    if (currentUserId) {
      openModal("following", String(currentUserId), String(currentUserId));
    }
  };

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
          targetUserId={currentUserId ? String(currentUserId) : ""}
          onFollowersPress={onFollowersPress}
          onFollowingPress={onFollowingPress}
        />

        <ProfileHeader
          fullName={fullName}
          username={username}
          isDark={isDark}
          isCurrentUser={true}
          onEditPress={() => router.push("/edit-profile")}
        />

        <BioSection bio={bio} isDark={isDark} />

        <View style={styles.favoritesContainer}>
          <FavoriteTeamsSection
            favoriteTeams={favoriteTeamsWithLeague}
            isGridView={isGridView}
            fadeAnim={fadeAnim}
            toggleFavoriteTeamsView={toggleFavoriteTeamsView}
            styles={styles}
            itemWidth={itemWidth}
            isCurrentUser={currentUserId === viewedUserId}
            username={username ?? undefined}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showSignOutModal}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={() => {
          setShowSignOutModal(false);
          signOut();
        }}
        onCancel={() => setShowSignOutModal(false)}
      />

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Account"
        message="This action cannot be undone. Are you sure you want to delete your account?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
