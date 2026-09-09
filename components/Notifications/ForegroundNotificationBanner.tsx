import { GameNotificationTeamLogos } from "@/components/Notifications/GameNotificationTeamLogos";
import { Colors, PLACEHOLDER_AVATAR } from "@/constants/styles";
import {
  useNotificationBanners,
  useNotifications,
} from "@/contexts/NotificationContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { parseImageUrl } from "@/utils/imageUtils";
import { getNotificationGameTeams } from "@/utils/notification-team-presentation";
import {
  getNotificationActorProfileImage,
  getNotificationCenterHref,
  getNotificationLeagueLabel,
  shouldShowNotificationActorProfileImage,
} from "@/utils/notificationCenter";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Href, useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ForegroundNotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { resolvedColorScheme } = usePreferences();
  const { notifications, onDismiss } = useNotificationBanners();
  const { markCenterNotificationRead } = useNotifications();
  const banner = notifications.at(-1);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    if (!banner) return;
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
      mass: 0.8,
    }).start();
  }, [banner, progress]);

  const animatedStyle = useMemo(
    () => ({
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-24, 0],
          }),
        },
      ],
    }),
    [progress],
  );

  if (!banner) return null;
  const canonical = banner.notification;
  const isDark = resolvedColorScheme === "dark";
  const leagueLabel = canonical ? getNotificationLeagueLabel(canonical) : null;
  const gameTeams = canonical
    ? getNotificationGameTeams(canonical, isDark)
    : null;
  const actorProfileImage =
    canonical && shouldShowNotificationActorProfileImage(canonical)
      ? (parseImageUrl(getNotificationActorProfileImage(canonical)) ??
        PLACEHOLDER_AVATAR)
      : null;

  const open = () => {
    onDismiss(banner.id);
    if (!canonical) return;
    if (!canonical.readAt) void markCenterNotificationRead(canonical.id);
    const href = getNotificationCenterHref(canonical);
    if (href) router.push(href as Href);
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.positioner, { top: insets.top + 8 }, animatedStyle]}
    >
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`${leagueLabel ? `${leagueLabel}. ` : ""}${canonical?.title ?? "Notification"}. ${gameTeams?.matchup ? `${gameTeams.matchup}. ` : ""}${banner.message}`}
        style={[styles.banner, isDark ? styles.bannerDark : styles.bannerLight]}
      >
        <View style={[styles.icon, gameTeams && styles.gameTeamIcon]}>
          {gameTeams ? (
            <GameNotificationTeamLogos
              teams={gameTeams}
              isDark={isDark}
              size={29}
            />
          ) : actorProfileImage ? (
            <Image
              source={{ uri: actorProfileImage }}
              style={styles.profileImage}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <Ionicons name="notifications" size={20} color={Colors.white} />
          )}
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            {leagueLabel && (
              <Text style={styles.leagueLabel}>{leagueLabel}</Text>
            )}

            <Text
              style={[styles.title, isDark && styles.textDark]}
              numberOfLines={1}
            >
              {canonical?.title ?? "Tempo"}
            </Text>
          </View>
          {gameTeams?.matchup && (
            <Text
              style={[styles.teamNames, isDark && styles.bodyDark]}
              numberOfLines={1}
            >
              {gameTeams.matchup}
            </Text>
          )}
          <Text
            style={[styles.body, isDark && styles.bodyDark]}
            numberOfLines={gameTeams ? 1 : 2}
          >
            {banner.message}
          </Text>
        </View>
        <Pressable
          onPress={() => onDismiss(banner.id)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          hitSlop={10}
        >
          <Ionicons
            name="close"
            size={18}
            color={isDark ? Colors.lightGray : Colors.darkGray}
          />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 1000,
    elevation: 12,
  },
  banner: {
    minHeight: 70,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  bannerLight: { backgroundColor: "#FFFFFF", borderColor: "#E2E2E7" },
  bannerDark: { backgroundColor: "#202124", borderColor: "#3A3A3C" },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E31B23",
    alignItems: "center",
    justifyContent: "center",
  },
  gameTeamIcon: {
    width: 48,
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  copy: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  leagueLabel: {
    flexShrink: 0,
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#E31B23",
    color: Colors.white,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  title: {
    flexShrink: 1,
    color: "#111",
    fontSize: 15,
    fontWeight: "700",
  },
  body: { color: "#555", fontSize: 13, lineHeight: 18 },
  teamNames: { color: "#333", fontSize: 12, lineHeight: 16, fontWeight: "600" },
  textDark: { color: "#FFFFFF" },
  bodyDark: { color: "#D1D1D6" },
});
