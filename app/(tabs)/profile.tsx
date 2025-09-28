import ConfirmModal from "components/ConfirmModal";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import BioSection from "components/Profile/BioSection";
import FavoriteTeamsSection from "components/Profile/FavoriteTeamsSection";
import FollowStats from "components/Profile/FollowStats";
import ProfileBanner from "components/Profile/ProfileBanner";
import ProfileHeader from "components/Profile/ProfileHeader";
import { SkeletonProfileScreen } from "components/SkeletonProfileScreen";
import { teams } from "constants/teams";
import { useFollowersModalStore } from "store/followersModalStore";
import { useSettingsModalStore } from "store/settingsModalStore";
import { getStyles } from "styles/ProfileScreen.styles";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Animated, ScrollView, View, useColorScheme } from "react-native";
import { useProfileData } from "hooks/useProfileData";
import { useAccountActions } from "hooks/useAccountActions";

export default function ProfileScreen() {
  const { user, isLoading, reload } = useProfileData();
  const { signOut, confirmDeleteAccount } = useAccountActions();

  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isGridView, setIsGridView] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");

  const {
    isVisible,
    type,
    targetUserId,
    openModal,
    clearRestore,
    shouldRestore,
  } = useFollowersModalStore();
  const {
    showOnReturn,
    setShowOnReturn,
    setShowSettingsModal,
  } = useSettingsModalStore();

  const toggleFavoriteTeamsView = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setIsGridView((prev) => !prev);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const init = async () => {
        if (shouldRestore && targetUserId) {
          clearRestore();
          openModal(type, targetUserId, user.id ? String(user.id) : undefined);
        }

        if (isVisible || !isActive) return;
        await reload();

        if (showOnReturn) {
          setShowSettingsModal(true);
          setShowOnReturn(false);
        }
      };

      init();
      return () => { isActive = false };
    }, [shouldRestore, targetUserId, type, isVisible, user.id, openModal, clearRestore, showOnReturn])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          title={`@${user.username}`}
          tabName="Profile"
          onLogout={() => setShowSignOutModal(true)}
          onSettings={() => router.push("/settings")}
        />
      ),
    });
  }, [navigation, user.username, isDark]);

  const favoriteTeams = teams.filter((t) => user.favorites.includes(t.id));
  const styles = getStyles(isDark);

  if (isLoading) return <SkeletonProfileScreen isDark={isDark} />;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <ProfileBanner bannerImage={user.bannerImage} profileImage={user.profileImage} isDark={isDark} />
        <FollowStats
          followersCount={user.followersCount}
          followingCount={user.followingCount}
          isDark={isDark}
          currentUserId={String(user.id ?? "")}
          targetUserId={String(user.id ?? "")}
          onFollowersPress={() => user.id && openModal("followers", String(user.id), String(user.id))}
          onFollowingPress={() => user.id && openModal("following", String(user.id), String(user.id))}
        />
        <ProfileHeader
          fullName={user.fullName}
          username={user.username}
          isDark={isDark}
          isCurrentUser
          onEditPress={() => router.push("/edit-profile")}
        />
        <BioSection bio={user.bio} isDark={isDark} />
        <View style={styles.favoritesContainer}>
          <FavoriteTeamsSection
            favoriteTeams={favoriteTeams}
            isGridView={isGridView}
            fadeAnim={fadeAnim}
            toggleFavoriteTeamsView={toggleFavoriteTeamsView}
            styles={styles}
            itemWidth={100}
            isCurrentUser
            username={user.username ?? undefined}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showSignOutModal}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={() => { setShowSignOutModal(false); signOut(); }}
        onCancel={() => setShowSignOutModal(false)}
      />
      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Account"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          try {
            await confirmDeleteAccount(password);
            setShowDeleteModal(false);
          } catch (err: any) {
            alert(err.message);
          }
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
