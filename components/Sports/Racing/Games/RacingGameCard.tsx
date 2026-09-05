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

function parseEventDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getDriverGap(driver: RacingDriver): string | null {
  const statistic = driver.statistics.find((stat) => {
    const statisticLabel = [
      stat.name,
      stat.displayName,
      stat.shortDisplayName,
      stat.description,
      stat.abbreviation,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      statisticLabel.includes("gap") ||
      statisticLabel.includes("interval") ||
      statisticLabel.includes("time behind")
    );
  });

  if (!statistic) {
    return null;
  }

  const value = statistic.displayValue ?? statistic.value;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

export default function RacingGameCard({ game }: RacingEventCardProps) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();

  const isDark = resolvedColorScheme === "dark";
  const styles = racingCardStyles(isDark);

  const handlePress = () => {
    const gameId = game.id ?? game.uid;

    if (!gameId) {
      return;
    }

    router.push({
      pathname: "/game/racing/[game]",
      params: {
        game: String(gameId),
        data: encodeURIComponent(JSON.stringify(game)),
      },
    });
  };

  const gameDate = parseEventDate(game.startDate ?? game.date);

  const formattedDate = gameDate
    ? gameDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const formattedTime = gameDate
    ? gameDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : null;

  const drivers = Array.isArray(game.drivers)
    ? game.drivers
    : Array.isArray(game.competitors)
      ? game.competitors
      : [];

  const topDrivers = [...drivers]
    .sort((firstDriver, secondDriver) => {
      const firstOrder = firstDriver.position ?? Number.MAX_SAFE_INTEGER;

      const secondOrder = secondDriver.position ?? Number.MAX_SAFE_INTEGER;

      return firstOrder - secondOrder;
    })
    .slice(0, 3);

  const gameStatusDescription = game.status?.description ?? null;
  const gameStatusDetail = game.status?.shortDetail;
  const tbd = gameStatusDetail?.includes("TBD") ? "TBD" : null;
  const isFinal = gameStatusDescription === "Final";
  const isScheduled = gameStatusDescription === "Scheduled";
  const inProgress = gameStatusDescription === "In Progress";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";

  const sessionType =
    game.primaryCompetition?.type ??
    game.driverCompetition?.type ??
    game.competitions?.[0]?.type ??
    null;

  const sessionName = sessionType?.text;
  const headline = game.circuit?.name ?? "Racing Event";

  const broadcast =
    getBroadcastDisplay(game.broadcasts) || game.broadcast || null;

  const renderStatus = () => {
    if (inProgress) {
      return (
        <Text style={styles.finalText} numberOfLines={1}>
          {gameStatusDetail || "Live"}
        </Text>
      );
    }

    if (isDelayed || isCanceled || isPostponed) {
      return (
        <Text style={styles.finalText} numberOfLines={1}>
          {gameStatusDescription || gameStatusDetail}
        </Text>
      );
    }

    if (isFinal) {
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText} numberOfLines={1}>
            {gameStatusDetail || "Final"}
          </Text>

          {formattedDate ? (
            <>
              <View style={styles.finalStatusDivider} />

              <Text style={styles.finalText}>{formattedDate}</Text>
            </>
          ) : null}
        </View>
      );
    }

    if (isScheduled) {
      return (
        <View style={styles.infoWrapper}>
          {formattedDate ? (
            <Text style={styles.date}>{formattedDate}</Text>
          ) : null}

          {formattedDate && (tbd || formattedTime) ? (
            <View style={styles.statusDivider} />
          ) : null}

          {tbd || formattedTime ? (
            <Text style={styles.date}>{tbd || formattedTime}</Text>
          ) : null}
        </View>
      );
    }

    if (formattedDate || tbd || formattedTime) {
      return (
        <View style={styles.infoWrapper}>
          {formattedDate ? (
            <Text style={styles.date}>{formattedDate}</Text>
          ) : null}

          {formattedDate && (tbd || formattedTime) ? (
            <View style={styles.statusDivider} />
          ) : null}

          {tbd || formattedTime ? (
            <Text style={styles.date}>{tbd || formattedTime}</Text>
          ) : null}
        </View>
      );
    }

    return null;
  };

  const renderDriverRow = (driver: RacingDriver, index: number) => {
    const isLast = index === topDrivers.length - 1;

    const position = driver.position ?? index + 1;

    const isLeader = position === 1;
    const gap = getDriverGap(driver);

    const driverName = driver.shortName ?? driver.fullName ?? "Unknown Driver";

    return (
      <View
        key={driver.id ?? driver.uid ?? `${driverName}-${index}`}
        style={[
          styles.driverRow,
          isLeader && styles.leaderRow,
          isLast && styles.lastDriverRow,
        ]}
      >
        <View style={styles.positionContainer}>
          <Text style={[styles.position, isLeader && styles.leaderPosition]}>
            {position}
          </Text>
        </View>

        <View
          style={[
            styles.driverImageContainer,
            isLeader && styles.leaderImageContainer,
          ]}
        >
          <Image
            source={driver.flag ? { uri: driver.headshot } : placeholderImage}
            style={styles.driverImage}
            contentFit="cover"
          />
        </View>

        <View style={styles.driverInfoWrapper}>
          <Text style={styles.driverName} numberOfLines={1}>
            {driverName}
          </Text>

          {driver.country && (
            <Text style={styles.teamName} numberOfLines={1}>
              {driver.country}
            </Text>
          )}
        </View>

        <Text style={styles.interval} numberOfLines={1}>
          {gap}
        </Text>
      </View>
    );
  };

  const renderEmptyDriverState = () => {
    let title = "Driver information unavailable";
    let description = "Driver data has not been provided for this session.";

    if (isScheduled) {
      title = "Starting field not available";
      description = `${headline} drivers will be available closer to the session.`;
    } else if (isFinal) {
      title = "Results unavailable";
      description = "Final driver results have not been provided.";
    }

    return (
      <View style={styles.driverList}>
        <View style={[styles.driverRow, styles.lastDriverRow]}>
          <View style={styles.positionContainer}>
            <Ionicons
              name="car-sport-outline"
              size={18}
              color={styles.statusIcon.color}
            />
          </View>

          <View style={styles.driverInfoWrapper}>
            <Text style={styles.driverName} numberOfLines={1}>
              {title}
            </Text>

            <Text style={styles.teamName} numberOfLines={2}>
              {description}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={handlePress}
      disabled={!game.id && !game.uid}
    >
      <View style={styles.card}>
        <View style={styles.headlineContainer}>
          <Text style={styles.headlineText} numberOfLines={1}>
            {headline}
          </Text>
        </View>

        <View style={styles.cardHeader}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventName} numberOfLines={1}>
              {sessionName}
            </Text>
          </View>

          {renderStatus()}
        </View>

        {topDrivers.length > 0 ? (
          <View style={styles.driverList}>
            {topDrivers.map(renderDriverRow)}
          </View>
        ) : (
          renderEmptyDriverState()
        )}

        {broadcast ? (
          <Text style={styles.broadcast} numberOfLines={1}>
            {broadcast}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
