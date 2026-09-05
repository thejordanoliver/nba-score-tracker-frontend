import { RacingDriver, RacingEventCardProps } from "@/types/racing/racing";
import { Ionicons } from "@expo/vector-icons";
import placeholderImage from "assets/Placeholders/playerPlaceholder.png";
import { activeOpacity } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { racingCardStyles } from "styles/GamecardStyles/GameCardStyles";
import { getBroadcastDisplay } from "utils/games";

export default function RacingSquareGameCard({ game }: RacingEventCardProps) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const handlePress = () => {
    router.push({
      pathname: "/game/racing/[game]",
      params: {
        game: String(game.id),
        data: encodeURIComponent(JSON.stringify(game)),
      },
    });
  };

  const safeDate = (date?: string | null) => {
    if (!date) return new Date();

    const d = new Date(date);

    return isNaN(d.getTime()) ? new Date() : d;
  };

  const gameDate = safeDate(game.date);

  const formattedDate = gameDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const formattedTime =
    gameDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) || "";

  const drivers = game.drivers?.length ? game.drivers : game.competitors;
  const topDrivers = [...(drivers ?? [])]
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
    .slice(0, 4);

  const styles = racingCardStyles(isDark);
  const gameStatusDescription = game?.status?.description;
  const gameStatusDetail = game?.status?.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const headline = game.shortName || game.name;

  const isScheduled = gameStatusDescription === "Scheduled";
  const isCanceled = gameStatusDescription === "Canceled";
  const isFinal = gameStatusDescription === "Final";
  const isPostponed = gameStatusDescription === "Postponed";
  const isDelayed = gameStatusDescription === "Delayed";
  const inProgress = gameStatusDescription === "In Progress";

  const broadcasts = game.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);

  const statusLabel = isCanceled
    ? "Canceled"
    : isPostponed
    ? "Postponed"
    : isDelayed
    ? "Delayed"
    : isFinal
    ? "Final"
    : inProgress
    ? game.status?.detail || "Live"
    : tbd || formattedTime;

  const renderDriverRow = (driver: RacingDriver, index: number) => {
    const isLast = index === topDrivers.length - 1;
    const position = driver.order ?? index + 1;

    return (
      <View
        key={driver.id ?? driver.uid ?? index}
        style={[styles.driverRow, isLast && styles.lastDriverRow]}
      >
        <View style={styles.positionContainer}>
          <Text
            style={[
              styles.position,
              position === 1 && styles.leaderPosition,
            ]}
          >
            {position}
          </Text>
        </View>

        <View style={styles.driverImageContainer}>
          <Image
            source={driver.flag ? { uri: driver.flag } : placeholderImage}
            style={styles.driverImage}
          />
        </View>

        <View style={styles.driverInfoWrapper}>
          <Text style={styles.driverName} numberOfLines={1}>
            {driver.shortName || driver.displayName || driver.name}
          </Text>
          {driver.country ? (
            <Text style={styles.teamName} numberOfLines={1}>
              {driver.country}
            </Text>
          ) : null}
        </View>

        {driver.winner ? (
          <Ionicons name="trophy" size={16} color={styles.leaderPosition.color} />
        ) : null}
      </View>
    );
  };

  return (
    <TouchableOpacity activeOpacity={activeOpacity} onPress={handlePress}>
      <View style={styles.card}>
        <View style={styles.headlineContainer}>
          <Text style={styles.headlineText} numberOfLines={1}>
            {headline}
          </Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventName} numberOfLines={1}>
              {game.leagueInfo?.name}
            </Text>
            <Text style={styles.trackName} numberOfLines={1}>
              {formattedDate}
            </Text>
          </View>

          <Text
            style={
              isFinal
                ? styles.finalText
                : inProgress
                ? styles.liveText
                : styles.scheduledText
            }
          >
            {statusLabel}
          </Text>
        </View>

        <View style={styles.driverList}>
          {topDrivers.map(renderDriverRow)}
        </View>

        {broadcast ? (
          <Text style={styles.broadcast} numberOfLines={1}>
            {broadcast}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
