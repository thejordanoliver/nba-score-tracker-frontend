import { activeOpacity, Colors } from "@/constants/styles";
import type { FootballGame } from "@/types/football/football";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "@/utils/dateUtils";
import { formatPeriod, getBroadcastDisplay } from "@/utils/games";
import { Pressable, Text, View } from "react-native";

import { CFPBracketStyles } from "styles/PlayoffStyles/CFPBracketStyles";
import type { FootballTeam } from "types/football/cfpBracketTypes";
import { BracketTeamRow } from "./BracketTeamRow";

/*
|--------------------------------------------------------------------------
| Game Card
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| game.away = TOP
| game.home = BOTTOM
|--------------------------------------------------------------------------
*/

export function BracketGameCard({
  game,
  x,
  y,
  onPress,
  onTeamPress,
  isDark,
}: {
  game: FootballGame;
  x: number;
  y: number;
  onPress?: () => void;
  onTeamPress?: (team: FootballTeam) => void;
  isDark: boolean;
}) {
  const styles = CFPBracketStyles(isDark);

  const status =
    game.status?.shortDetail ??
    game.status?.description ??
    game.status?.detail ??
    "";

  const gameDate = safeDate(game.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);
  const headline = game.headline ?? holidayLabel;
  const gameStatusDescription = game?.status.description ?? "";
  const gameStatusDetail = game?.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const inProgress = gameStatusDescription === "In Progress";
  const isHalftime = gameStatusDescription === "Halftime";
  const isFinal = gameStatusDescription === "Final";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeited";
  const isSuspended = gameStatusDescription === "Suspended";
  const endOfPeriod = gameStatusDescription === "End of Period";
  const clock = game.status?.displayClock;
  const period = formatPeriod({ period: game.status.period });
  const redzone = game?.situation?.isRedZone;
  const isRedzone = redzone;
  const broadcasts = game?.broadcasts;
  const broadcast = getBroadcastDisplay(broadcasts);
  const downDistanceText = game.situation.downDistanceText;

  const renderDownAndDistance = () => {
    if (!downDistanceText) return null;
    const [beforeAt, afterAt] = downDistanceText.split(" at ");
    return (
      <Text style={styles.downDistance}>
        {beforeAt}
        {afterAt && (
          <>
            {" at "}
            <Text
              style={[
                styles.downDistance,
                isRedzone && {
                  color: isDark ? Colors.dark.lightRed : Colors.light.red,
                },
              ]}
            >
              {afterAt}
            </Text>
          </>
        )}
      </Text>
    );
  };

  const renderStatus = () => {
    if (inProgress)
      return (
        <>
          <View style={styles.infoWrapper}>
            <Text style={styles.date}>{period}</Text>
            <View style={styles.statusDivider} />
            <Text style={styles.clock}>{clock}</Text>
          </View>
          {renderDownAndDistance()}
        </>
      );

    if (endOfPeriod) return <Text style={styles.clock}>End of {period}</Text>;

    if (
      isHalftime ||
      isDelayed ||
      isCanceled ||
      isPostponed ||
      isForfeited ||
      isSuspended
    )
      return <Text style={styles.finalText}>{gameStatusDescription}</Text>;

    if (isFinal)
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.finalText}>{gameStatusDetail}</Text>
          <View style={styles.finalStatusDivider} />
          <Text style={styles.finalText}>{formattedDate}</Text>
        </View>
      );

    return (
      <View style={styles.infoWrapper}>
        <Text style={styles.date}>{formattedDate}</Text>
        <View style={styles.statusDivider} />
        <Text style={styles.date}>{tbd || formattedTime}</Text>
      </View>
    );
  };

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.gameCard,

        {
          left: x,
          top: y,
        },

        pressed && { opacity: activeOpacity },
      ]}
    >
      {status ? (
        <View style={styles.statusContainer}>
          <Text style={styles.headline} numberOfLines={1}>
            {headline}
          </Text>
        </View>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | Away Team - Top
      |--------------------------------------------------------------------------
      */}

      <BracketTeamRow
        team={game.away}
        onPress={
          game.away && onTeamPress ? () => onTeamPress(game.away) : undefined
        }
        isDark={isDark}
      />

      <View style={styles.divider} />

      {/*
      |--------------------------------------------------------------------------
      | Home Team - Bottom
      |--------------------------------------------------------------------------
      */}

      <BracketTeamRow
        team={game.home}
        onPress={
          game.home && onTeamPress ? () => onTeamPress(game.home) : undefined
        }
        isDark={isDark}
      />

      <View style={styles.footerContainer}>
        {renderStatus()}
        <Text style={styles.broadcast}>{broadcast}</Text>
      </View>
    </Pressable>
  );
}
