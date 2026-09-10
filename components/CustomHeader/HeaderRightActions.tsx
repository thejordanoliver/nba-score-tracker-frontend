import { Ionicons } from "@expo/vector-icons";
import { activeOpacity, Colors } from "constants/styles";
import * as Haptics from "expo-haptics";
import {
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { customHeaderStyles } from "../../styles/CustomHeaderStyles";
import {
  getFavoriteHeaderAccessibilityLabel,
  getFavoriteHeaderIconName,
} from "./favoriteAction";
import { ProfileHeaderMenu } from "./ProfileHeaderMenu";

type HeaderRightActionsProps = {
  isTeamScreen: boolean;
  isPlayerScreen?: boolean;
  showFavoriteAction?: boolean;
  favoritePending?: boolean;
  notificationPending?: boolean;
  favoriteIconColor: string;
  onToggleFavorite?: () => void;
  onToggleNotifications?: () => void;
  onOpenInfo?: () => void;
  isFavorite?: boolean;
  isNotified?: boolean;
  tabName?: string;
  isDark: boolean;
  profileMenuVisible: boolean;
  onToggleProfileMenu: () => void;
  onProfileSettings: () => void;
  onEditProfile: () => void;
  onProfileLogout: () => void;
  onSearchToggle?: () => void;
  onNotificationsCenter?: () => void;
  unreadNotificationCount?: number;
  onOpenThemesSettings?: () => void;
  isMessagesListScreen: boolean;
  onCreateMessage?: () => void;
  onToggleLayout?: () => void;
  isGrid?: boolean;
};

type FavoriteHeaderButtonProps = {
  isFavorite: boolean;
  pending: boolean;
  color: string;
  onPress: () => void;
};

function FavoriteHeaderButton({
  isFavorite,
  pending,
  color,
  onPress,
}: FavoriteHeaderButtonProps) {
  const { width } = useWindowDimensions();
  const styles = customHeaderStyles(false, width);

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      disabled={pending}
      onPress={handlePress}
      style={styles.teamHeaderActionButton}
      accessibilityRole="button"
      accessibilityLabel={getFavoriteHeaderAccessibilityLabel(isFavorite)}
      accessibilityState={{ disabled: pending, selected: isFavorite }}
      hitSlop={8}
    >
      <Ionicons
        name={getFavoriteHeaderIconName(isFavorite)}
        size={24}
        color={color}
      />
    </TouchableOpacity>
  );
}

export function HeaderRightActions({
  isTeamScreen,
  isPlayerScreen,
  showFavoriteAction = false,
  favoritePending = false,
  notificationPending = false,
  favoriteIconColor,
  onToggleFavorite,
  onToggleNotifications,
  onOpenInfo,
  isFavorite,
  isNotified,
  tabName,
  isDark,
  profileMenuVisible,
  onToggleProfileMenu,
  onProfileSettings,
  onEditProfile,
  onProfileLogout,
  onSearchToggle,
  onNotificationsCenter,
  unreadNotificationCount = 0,
  onOpenThemesSettings,
  isMessagesListScreen,
  onCreateMessage,
  onToggleLayout,
  isGrid,
}: HeaderRightActionsProps) {
  const { width } = useWindowDimensions();
  const styles = customHeaderStyles(isDark, width);

  if (isTeamScreen) {
    return (
      <View style={styles.teamHeaderActions}>
        {onToggleFavorite ? (
          <FavoriteHeaderButton
            isFavorite={Boolean(isFavorite)}
            pending={favoritePending}
            color={Colors.white}
            onPress={onToggleFavorite}
          />
        ) : null}

        {onToggleNotifications ? (
          <TouchableOpacity
            activeOpacity={activeOpacity}
            onPress={onToggleNotifications}
            style={styles.teamHeaderActionButton}
            accessibilityRole="button"
            accessibilityLabel="Open team notification settings"
            accessibilityState={{ selected: Boolean(isNotified) }}
            hitSlop={8}
          >
            <Ionicons
              name={isNotified ? "notifications" : "notifications-outline"}
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        ) : null}

        {!isPlayerScreen && onOpenInfo ? (
          <TouchableOpacity
            activeOpacity={activeOpacity}
            onPress={onOpenInfo}
            style={styles.teamHeaderActionButton}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={Colors.white}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (tabName === "Game" && onToggleNotifications) {
    const handleGameNotificationPress = () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
      onToggleNotifications();
    };

    return (
      <View style={styles.teamHeaderActions}>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          disabled={notificationPending}
          onPress={handleGameNotificationPress}
          style={[
            styles.teamHeaderActionButton,
            notificationPending && { opacity: 0.55 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open game notification settings"
          accessibilityState={{
            disabled: notificationPending,
            selected: Boolean(isNotified),
          }}
          hitSlop={8}
        >
          <Ionicons
            name={isNotified ? "notifications" : "notifications-outline"}
            size={24}
            color={Colors.white}
          />
        </TouchableOpacity>
      </View>
    );
  }

  if (showFavoriteAction && onToggleFavorite) {
    return (
      <View style={styles.teamHeaderActions}>
        <FavoriteHeaderButton
          isFavorite={Boolean(isFavorite)}
          pending={favoritePending}
          color={favoriteIconColor}
          onPress={onToggleFavorite}
        />
      </View>
    );
  }

  if (tabName === "Profile") {
    return (
      <View style={styles.profileMenuAnchor}>
        <ProfileHeaderMenu
          visible={profileMenuVisible}
          isDark={isDark}
          onSettings={onProfileSettings}
          onEdit={onEditProfile}
          onLogout={onProfileLogout}
        />

        <TouchableOpacity
          activeOpacity={activeOpacity}
          onPress={onToggleProfileMenu}
          style={[
            styles.profileHeaderActionButton,
            {
              borderColor: profileMenuVisible
                ? Colors.lightGray
                : isDark
                  ? Colors.darkGray
                  : Colors.lightGray,
              backgroundColor: profileMenuVisible
                ? isDark
                  ? Colors.black
                  : Colors.white
                : "transparent",
            },
          ]}
          hitSlop={8}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={isDark ? Colors.white : Colors.black}
          />
        </TouchableOpacity>
      </View>
    );
  }

  if ((tabName === "Explore" || tabName === "Leagues") && onSearchToggle) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onSearchToggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Search"
      >
        <Ionicons
          name="search"
          size={24}
          color={isDark ? Colors.white : Colors.black}
        />
      </TouchableOpacity>
    );
  }

  if (tabName === "Home" && onNotificationsCenter) {
    const hasUnreadNotifications = unreadNotificationCount > 0;

    const notificationCount =
      unreadNotificationCount > 99 ? "99+" : String(unreadNotificationCount);

    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onNotificationsCenter}
        hitSlop={8}
        style={styles.notificationButton}
        accessibilityRole="button"
        accessibilityLabel={
          hasUnreadNotifications
            ? `${unreadNotificationCount} unread notifications`
            : "Notifications"
        }
      >
        <Ionicons
          name={
            hasUnreadNotifications ? "notifications" : "notifications-outline"
          }
          size={24}
          color={isDark ? Colors.white : Colors.black}
        />

        {hasUnreadNotifications && (
          <View
            style={[
              styles.notificationBadge,
              {
                backgroundColor: isDark
                  ? Colors.dark.lightRed
                  : Colors.light.red,
              },
            ]}
          >
            <Text style={styles.notificationBadgeText}>
              {notificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (tabName === "Message" && onOpenThemesSettings) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onOpenThemesSettings}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Open message theme settings"
      >
        <Ionicons
          name="color-palette-outline"
          size={24}
          color={isDark ? Colors.white : Colors.black}
        />
      </TouchableOpacity>
    );
  }

  if (isMessagesListScreen && onCreateMessage) {
    return (
      <Pressable
        onPress={onCreateMessage}
        accessibilityRole="button"
        accessibilityLabel="Create message"
        hitSlop={14}
        style={({ pressed }) => [
          styles.headerActionButton,
          pressed && styles.headerActionButtonPressed,
        ]}
      >
        <Ionicons
          name="create-outline"
          size={24}
          color={isDark ? Colors.white : Colors.black}
        />
      </Pressable>
    );
  }

  if (onToggleLayout) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onToggleLayout}
        hitSlop={8}
      >
        <Ionicons
          name={isGrid ? "list" : "grid"}
          size={24}
          color={isDark ? Colors.white : Colors.black}
        />
      </TouchableOpacity>
    );
  }

  return <View style={styles.headerSidePlaceholder} />;
}
