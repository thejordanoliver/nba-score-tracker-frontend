import { CustomHeader } from "@/components/CustomHeader";
import { GameNotificationTeamLogos } from "@/components/Notifications/GameNotificationTeamLogos";
import { Colors, PLACEHOLDER_AVATAR } from "@/constants/styles";
import { useNotifications } from "@/contexts/NotificationContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { NotificationsCenterStyles } from "@/styles/NotificationCenterStyles";
import type { AppNotification, NotificationType } from "@/types/notifications";
import { parseImageUrl } from "@/utils/imageUtils";
import { getNotificationGameTeams } from "@/utils/notification-team-presentation";
import {
  getNotificationActorProfileImage,
  getNotificationCenterHref,
  getNotificationLeagueLabel,
  shouldShowNotificationActorProfileImage,
} from "@/utils/notificationCenter";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { formatDistance } from "date-fns/formatDistance";
import { Image } from "expo-image";
import { Href, useNavigation, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

const getNotificationIcon = (
  type: NotificationType,
): React.ComponentProps<typeof Ionicons>["name"] => {
  switch (type) {
    case "game_starting":
    case "game_touchdown":
    case "game_quarter_end":
    case "game_halftime":
    case "game_close":
    case "game_final":
      return "alert";

    case "post_like":
      return "heart-outline";

    case "post_comment":
    case "comment_reply":
      return "chatbubble-ellipses-outline";

    case "message":
      return "chatbubbles-outline";

    case "badge":
      return "ribbon-outline";

    case "new_follower":
      return "people-outline";

    default:
      return "notifications-outline";
  }
};

type NotificationRowProps = {
  notification: AppNotification;
  isDark: boolean;
  now: number;
  onPress: (notification: AppNotification) => void;
  onArchive: (notification: AppNotification) => void;
};

const NotificationRow = memo(function NotificationRow({
  notification,
  isDark,
  now,
  onPress,
  onArchive,
}: NotificationRowProps) {
  const styles = NotificationsCenterStyles(isDark);

  const { title, body, type, readAt } = notification;

  if (!title && !body) {
    return null;
  }

  const iconName = getNotificationIcon(type);
  const href = getNotificationCenterHref(notification);
  const leagueLabel = getNotificationLeagueLabel(notification);
  const gameTeams = getNotificationGameTeams(notification, isDark);
  const actorProfileImage =
    shouldShowNotificationActorProfileImage(notification)
      ? (parseImageUrl(getNotificationActorProfileImage(notification)) ??
        PLACEHOLDER_AVATAR)
      : null;
  const isPressable = href !== null;
  const isUnread = !readAt;
  const createdAt = new Date(notification.createdAt);
  const timeAgo = Number.isNaN(createdAt.getTime())
    ? null
    : formatDistance(createdAt, now, { addSuffix: true }).replace(
        /^about /,
        "",
      );
  const accessibilityLabel = [
    leagueLabel,
    title,
    gameTeams?.matchup,
    body,
    timeAgo,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      disabled={!isPressable}
      onPress={() => onPress(notification)}
      accessibilityRole={isPressable ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={
        isPressable ? "Opens the related notification." : undefined
      }
      style={({ pressed }) => [
        styles.notificationRow,
        isUnread && styles.notificationRowUnread,
        pressed && isPressable && styles.notificationRowPressed,
      ]}
    >
      <View
        style={[styles.iconWrapper, gameTeams && styles.gameTeamLogoWrapper]}
      >
        {gameTeams ? (
          <GameNotificationTeamLogos teams={gameTeams} isDark={isDark} />
        ) : actorProfileImage ? (
          <Image
            source={{ uri: actorProfileImage }}
            style={styles.profileImage}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <Ionicons
            name={iconName}
            size={20}
            color={isDark ? Colors.white : Colors.black}
          />
        )}

        {isUnread && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          {leagueLabel && <Text style={styles.leagueLabel}>{leagueLabel}</Text>}

          <Text style={styles.notificationHeader} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {gameTeams?.matchup && (
          <Text style={styles.teamNames} numberOfLines={1}>
            {gameTeams.matchup}
          </Text>
        )}

        <Text style={styles.notificationText} numberOfLines={gameTeams ? 2 : 3}>
          {body}
        </Text>

        {timeAgo && <Text style={styles.notificationTime}>{timeAgo}</Text>}
      </View>

      <Pressable
        onPress={() => onArchive(notification)}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${title}`}
        hitSlop={8}
      >
        <Ionicons
          name="close"
          size={17}
          color={isDark ? Colors.lightGray : Colors.darkGray}
        />
      </Pressable>

      {isPressable && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={isDark ? Colors.lightGray : Colors.darkGray}
          style={styles.chevron}
        />
      )}
    </Pressable>
  );
});

export default function NotificationsCenter() {
  const { resolvedColorScheme } = usePreferences();

  const {
    centerNotifications,
    markCenterNotificationRead,
    markAllCenterNotificationsRead,
    removeCenterNotification,
    refreshNotifications,
    loadMoreNotifications,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
  } = useNotifications();

  const isDark = resolvedColorScheme === "dark";
  const [relativeTimeNow, setRelativeTimeNow] = useState(() => Date.now());

  const styles = NotificationsCenterStyles(isDark);

  const navigation = useNavigation();
  const router = useRouter();

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader tabName="Notifications" onBack={() => router.back()} />
      ),
    });
  }, [navigation, router]);

  useFocusEffect(
    useCallback(() => {
      void refreshNotifications();
    }, [refreshNotifications]),
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRelativeTimeNow(Date.now());
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  const handleNotificationPress = useCallback(
    (notification: AppNotification) => {
      if (!notification.readAt) {
        markCenterNotificationRead(notification.id);
      }

      const href = getNotificationCenterHref(notification);

      if (!href) {
        return;
      }

      router.push(href as Href);
    },
    [markCenterNotificationRead, router],
  );

  const handleMarkAllRead = useCallback(() => {
    void markAllCenterNotificationsRead();
  }, [markAllCenterNotificationsRead]);

  const handleArchiveNotification = useCallback(
    (notification: AppNotification) => {
      void removeCenterNotification(notification.id);
    },
    [removeCenterNotification],
  );

  const renderNotificationItem = useCallback<ListRenderItem<AppNotification>>(
    ({ item }) => (
      <NotificationRow
        notification={item}
        isDark={isDark}
        now={relativeTimeNow}
        onPress={handleNotificationPress}
        onArchive={handleArchiveNotification}
      />
    ),
    [
      handleArchiveNotification,
      handleNotificationPress,
      isDark,
      relativeTimeNow,
    ],
  );

  const hasUnreadNotifications = centerNotifications.some(
    (notification) => !notification.readAt,
  );

  return (
    <FlatList
      data={centerNotifications}
      extraData={relativeTimeNow}
      keyExtractor={(item) => item.id}
      renderItem={renderNotificationItem}
      ListHeaderComponent={
        hasUnreadNotifications ? (
          <View style={styles.listHeader}>
            <Pressable
              onPress={handleMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              hitSlop={8}
              style={({ pressed }) => [
                styles.markAllButton,
                pressed && styles.markAllButtonPressed,
              ]}
            >
              <Text style={styles.markAllText}>Mark all as read</Text>
            </Pressable>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          {loading ? (
            <ActivityIndicator color={isDark ? Colors.white : Colors.black} />
          ) : (
            <>
              <Ionicons
                name="notifications-outline"
                size={34}
                color={isDark ? Colors.lightGray : Colors.darkGray}
              />

              <Text style={styles.emptyTitle}>No notifications yet</Text>

              <Text style={styles.emptyText}>
                {error
                  ? "Notifications could not be loaded. Pull down to try again."
                  : "New messages, likes, comments, and other activity will appear here."}
              </Text>
            </>
          )}
        </View>
      }
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            style={{ paddingVertical: 16 }}
            color={isDark ? Colors.white : Colors.black}
          />
        ) : null
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refreshNotifications()}
          tintColor={isDark ? Colors.white : Colors.black}
        />
      }
      onEndReached={() => {
        if (hasMore && !loadingMore) void loadMoreNotifications();
      }}
      onEndReachedThreshold={0.35}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        styles.container,
        centerNotifications.length === 0 && styles.emptyContainer,
      ]}
      showsVerticalScrollIndicator={false}
    />
  );
}
