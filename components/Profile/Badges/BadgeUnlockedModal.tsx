import { BADGE_TIER_COLORS } from "@/constants/badges";
import { Colors, Fonts, activeOpacity } from "@/constants/styles";
import { usePreferences } from "@/contexts/PreferencesContext";
import { markBadgeNotificationsRead } from "@/services/badgeApi";
import { useBadgeNotificationStore } from "@/store/badgeNotificationStore";
import type {
  BadgeNotification,
  BadgeProgress,
  BadgeTier,
} from "@/types/badges";
import { capitalizeBadgeTier } from "@/utils/badgeUtils";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BadgeEmblem from "./BadgeEmblem";

const FALLBACK_TIER: BadgeTier = "bronze";

const buildUnlockedBadge = (notification: BadgeNotification): BadgeProgress => {
  const { badge } = notification;

  return {
    id: badge.badgeId,
    name: badge.name || "New badge",
    description: badge.description || "You unlocked a new badge.",
    category: badge.category || "community",
    metric: badge.metric || "totalEngagement",
    tier: badge.tier ?? FALLBACK_TIER,
    threshold: badge.threshold || 1,
    symbol: badge.symbol || "🏆",
    sortOrder: 0,
    currentValue: badge.threshold || 1,
    progressPercent: 100,
    remaining: 0,
    isEarned: true,
    earnedAt: badge.earnedAt,
  };
};

export default function BadgeUnlockedModal() {
  const currentNotification = useBadgeNotificationStore(
    (state) => state.currentNotification,
  );

  const dismissCurrentNotification = useBadgeNotificationStore(
    (state) => state.dismissCurrentNotification,
  );

  const queueNotificationReadRetry = useBadgeNotificationStore(
    (state) => state.queueNotificationReadRetry,
  );

  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const insets = useSafeAreaInsets();

  const cardOpacity = useRef(new Animated.Value(0)).current;

  const cardScale = useRef(new Animated.Value(0.92)).current;

  const emblemScale = useRef(new Animated.Value(0.82)).current;

  const badge = useMemo(
    () =>
      currentNotification ? buildUnlockedBadge(currentNotification) : null,
    [currentNotification],
  );

  const notificationId = currentNotification?.notificationId ?? null;

  const tierColor = badge ? BADGE_TIER_COLORS[badge.tier] : Colors.midTone;

  const styles = useMemo(
    () => badgeUnlockedModalStyles(isDark, tierColor),
    [isDark, tierColor],
  );

  const acknowledgeRead = useCallback(
    async (dismissedNotificationId: string) => {
      try {
        const acknowledgedIds = await markBadgeNotificationsRead([
          dismissedNotificationId,
        ]);

        if (!acknowledgedIds.includes(dismissedNotificationId)) {
          queueNotificationReadRetry(dismissedNotificationId);
        }
      } catch (error) {
        queueNotificationReadRetry(dismissedNotificationId);

        if (__DEV__) {
          console.warn(
            "[BadgeModal] Failed to mark notification as read",
            error,
          );
        }
      }
    },
    [queueNotificationReadRetry],
  );

  const handleDismiss = useCallback(() => {
    const dismissedNotificationId = notificationId;

    dismissCurrentNotification();

    if (dismissedNotificationId) {
      void acknowledgeRead(dismissedNotificationId);
    }
  }, [acknowledgeRead, dismissCurrentNotification, notificationId]);

  useEffect(() => {
    if (!badge) {
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      emblemScale.setValue(0.82);

      return;
    }

    cardOpacity.setValue(0);
    cardScale.setValue(0.92);
    emblemScale.setValue(0.82);

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 16,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(emblemScale, {
          toValue: 1.08,
          damping: 10,
          stiffness: 220,
          useNativeDriver: true,
        }),
        Animated.spring(emblemScale, {
          toValue: 1,
          damping: 12,
          stiffness: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [badge, cardOpacity, cardScale, emblemScale, notificationId]);

  return (
    <Modal
      visible={Boolean(currentNotification)}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={handleDismiss}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 18),
            paddingBottom: Math.max(insets.bottom, 18),
          },
        ]}
      >
        <Animated.View
          accessible
          accessibilityRole="summary"
          accessibilityLabel={
            badge
              ? `Badge Unlocked. ${badge.name}. ${capitalizeBadgeTier(
                  badge.tier,
                )}. ${badge.description}`
              : "Badge Unlocked"
          }
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {badge && (
            <>
              <View style={styles.accent} />

              <Text selectable style={styles.heading}>
                Badge Unlocked
              </Text>

              <Animated.View
                style={[
                  styles.emblemWrap,
                  {
                    transform: [
                      {
                        scale: emblemScale,
                      },
                    ],
                  },
                ]}
              >
                <BadgeEmblem badge={badge} size={112} showLockedState={false} />
              </Animated.View>

              <View style={styles.textContainer}>
                <Text selectable style={styles.name}>
                  {badge.name}
                </Text>

                <Text selectable style={styles.tier}>
                  {capitalizeBadgeTier(badge.tier)}
                </Text>

                <Text selectable style={styles.description}>
                  {badge.description}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss badge notification"
                onPress={handleDismiss}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonText}>Awesome</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const badgeUnlockedModalStyles = (isDark: boolean, tierColor: string) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 22,
      backgroundColor: isDark ? "rgba(0,0,0,0.72)" : "rgba(0,0,0,0.46)",
    },

    card: {
      alignItems: "center",
      width: "100%",
      maxWidth: 360,
      paddingHorizontal: 22,
      paddingTop: 24,
      paddingBottom: 20,
      borderWidth: 1,
      borderColor: tierColor,
      borderRadius: 24,
      backgroundColor: isDark ? Colors.black : Colors.white,
      overflow: "hidden",
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 16,
      },
      shadowOpacity: isDark ? 0.44 : 0.22,
      shadowRadius: 24,
      elevation: 24,
    },

    accent: {
      position: "absolute",
      top: 0,
      right: 0,
      left: 0,
      height: 5,
      backgroundColor: tierColor,
    },

    heading: {
      fontFamily: Fonts.BOLD,
      fontSize: 15,
      color: tierColor,
      textAlign: "center",
      textTransform: "uppercase",
    },

    emblemWrap: {
      marginTop: 18,
    },

    textContainer: {
      alignItems: "center",
      gap: 6,
      marginTop: 16,
    },

    name: {
      fontFamily: Fonts.BOLD,
      fontSize: 24,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },

    tier: {
      fontFamily: Fonts.BOLD,
      fontSize: 13,
      color: tierColor,
      textAlign: "center",
      textTransform: "uppercase",
    },

    description: {
      marginTop: 4,
      fontFamily: Fonts.REGULAR,
      fontSize: 15,
      lineHeight: 21,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },

    button: {
      alignItems: "center",
      minWidth: 150,
      marginTop: 22,
      paddingHorizontal: 22,
      paddingVertical: 11,
      borderRadius: 10,
      backgroundColor: tierColor,
    },

    buttonPressed: {
      opacity: activeOpacity,
    },

    buttonText: {
      fontFamily: Fonts.BOLD,
      fontSize: 15,
      color: Colors.white,
    },
  });
