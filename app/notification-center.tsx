import { CustomHeader } from "@/components/CustomHeader";
import { Colors } from "@/constants/styles";
import {
  useNotifications,
} from "@/contexts/NotificationContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { NotificationsCenterStyles } from "@/styles/NotificationCenterStyles";
import { getNotificationCenterHref } from "@/utils/notificationCenter";
import type { AppNotification, NotificationType } from "@/types/notifications";
import { Ionicons } from "@expo/vector-icons";
import { Href, useNavigation, useRouter } from "expo-router";
import { memo, useCallback, useLayoutEffect } from "react";
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
  onPress: (notification: AppNotification) => void;
  onArchive: (notification: AppNotification) => void;
};

const NotificationRow = memo(function NotificationRow({
  notification,
  isDark,
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
  const isPressable = href !== null;
  const isUnread = !readAt;

  return (
    <Pressable
      disabled={!isPressable}
      onPress={() => onPress(notification)}
      accessibilityRole={isPressable ? "button" : undefined}
      accessibilityLabel={`${title}. ${body}`}
      accessibilityHint={
        isPressable ? "Opens the related notification." : undefined
      }
      style={({ pressed }) => [
        styles.notificationRow,
        isUnread && styles.notificationRowUnread,
        pressed && isPressable && styles.notificationRowPressed,
      ]}
    >
      <View style={styles.iconWrapper}>
        <Ionicons
          name={iconName}
          size={20}
          color={isDark ? Colors.white : Colors.black}
        />

        {isUnread && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.notificationHeader} numberOfLines={1}>
          {title}
        </Text>

        <Text style={styles.notificationText} numberOfLines={3}>
          {body}
        </Text>
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
        onPress={handleNotificationPress}
        onArchive={handleArchiveNotification}
      />
    ),
    [handleArchiveNotification, handleNotificationPress, isDark],
  );

  const hasUnreadNotifications = centerNotifications.some(
    (notification) => !notification.readAt,
  );

  return (
    <FlatList
      data={centerNotifications}
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
