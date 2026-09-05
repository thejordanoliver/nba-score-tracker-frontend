import { getCFBTeam, getCFBTeamLogo } from "@/constants/teamsCFB";
import { getUFLTeam, getUFLTeamLogo } from "@/constants/teamsUFL";
import { FootballGameCardProps } from "@/types/football/football";
import { Colors, activeOpacity } from "constants/styles";
import { getNFLTeam, getNFLTeamLogo } from "constants/teamsNFL";
import { usePreferences } from "contexts/PreferencesContext";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { memo } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { gameCardStyles } from "styles/GamecardStyles/GameCardStyles";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "utils/dateUtils";
import { formatPeriod, getBroadcastDisplay, winnerStyle } from "utils/games";
import Football from "../../../../assets/icons8/Football.png";
import FootballLight from "../../../../assets/icons8/FootballLight.png";

function FootballGameCard({
  game,
  isCFB = false,
  isNFL = false,
}: FootballGameCardProps) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const handlePress = () => {
    router.push({
      pathname: "/game/football/[game]",
      params: {
        game: String(game.id),
        leagueId: String(league),
        data: encodeURIComponent(JSON.stringify(game)),
      },
    });
  };

  const gameDate = safeDate(game.date);
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);

  const league = game?.league?.id;

  const homeId = game?.home?.id ?? 0;
  const awayId = game?.away?.id ?? 0;

  const home = isNFL
    ? getNFLTeam(homeId)
    : isCFB
      ? getCFBTeam(homeId)
      : getUFLTeam(homeId);
  const away = isNFL
    ? getNFLTeam(awayId)
    : isCFB
      ? getCFBTeam(awayId)
      : getUFLTeam(awayId);

  const homeName = home?.shortName ?? home?.name ?? game?.home?.name;
  const awayName = away?.shortName ?? away?.name ?? game?.away?.name;

  const homeLogo = isNFL
    ? getNFLTeamLogo(homeId, isDark)
    : isCFB
      ? getCFBTeamLogo(homeId, isDark)
      : getUFLTeamLogo(homeId, isDark);
  const awayLogo = isNFL
    ? getNFLTeamLogo(awayId, isDark)
    : isCFB
      ? getCFBTeamLogo(awayId, isDark)
      : getUFLTeamLogo(awayId, isDark);

  const headline = game.headline ?? holidayLabel;
  const gameStatusDescription = game?.status.description ?? "";
  const gameStatusDetail = game?.status.shortDetail ?? "";
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isScheduled = gameStatusDescription === "Scheduled";
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
  const possessionTeamId = game.situation.possession;
  const homeRecord = game?.home?.record ?? "0-0";
  const awayRecord = game?.away?.record ?? "0-0";
  const homeScore = game?.home?.score ?? 0;
  const awayScore = game?.away?.score ?? 0;
  const homeRank = game?.home?.rank ?? null;
  const awayRank = game?.away?.rank ?? null;

  const headlineMatch = game?.headline?.toLowerCase();
  const isChampionship =
    headlineMatch?.includes("super bowl") ||
    headlineMatch?.includes("national championship");
  const styles = gameCardStyles(isDark, isChampionship);
  const homeHasPossession = inProgress && possessionTeamId === home?.espnId;
  const awayHasPossession = inProgress && possessionTeamId === away?.espnId;

  // -----------------------------------------------------
  // SCORE TEXT COMPONENT
  // -----------------------------------------------------
  const homeWins = game.home.winner;
  const awayWins = game.away.winner;
  const isTie = game.home.winner === game.away.winner;
  

  const ScoreText = ({
    score,
    record,
    isWinner,
  }: {
    score: number;
    record: string | undefined;
    isWinner: boolean;
  }) => {
    const showRecord = isScheduled;

    return (
      <Text
        style={
          showRecord
            ? styles.teamRecord
            : [
                styles.teamScore,
                winnerStyle({
                  isWinner: isWinner,
                  isTie: isTie,
                  isDark: isDark,
                }),
              ]
        }
      >
        {showRecord ? record : score}
      </Text>
    );
  };

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

  const renderCardContent = () => (
    <>
      <View style={styles.teamSection}>
        <Image source={awayLogo} style={styles.logo} contentFit="contain" />

        <Text style={styles.teamName}>
          {awayRank && <Text style={styles.rank}>{awayRank} </Text>}
          {awayName}
        </Text>
      </View>

      <View style={styles.teamSection}>
        <ScoreText score={awayScore} record={awayRecord} isWinner={awayWins} />
        {inProgress && awayHasPossession && (
          <Image
            source={isDark ? FootballLight : Football}
            style={styles.possession}
          />
        )}
      </View>

      <View style={styles.headlineContainer}>
        <Text style={[styles.headlineText]}>{headline}</Text>
      </View>

      <View style={styles.info}>
        {renderStatus()}

        {!isFinal && broadcast && (
          <Text style={styles.broadcast}>{broadcast}</Text>
        )}
      </View>

      <View style={styles.teamSection}>
        <ScoreText score={homeScore} record={homeRecord} isWinner={homeWins} />
        {inProgress && homeHasPossession && (
          <Image
            source={isDark ? FootballLight : Football}
            style={styles.possession}
          />
        )}
      </View>

      <View style={styles.teamSection}>
        <Image source={homeLogo} style={styles.logo} contentFit="contain" />
        <Text style={styles.teamName}>
          {homeRank && <Text style={styles.rank}>{homeRank} </Text>}
          {homeName}
        </Text>
      </View>
    </>
  );

  return (
    <TouchableOpacity activeOpacity={activeOpacity} onPress={handlePress}>
      {isChampionship ? (
        <LinearGradient
          colors={
            isDark
              ? ["#846f4a", "#50412a"]
              : (["#dbb145ff", "#CDA765"] as [string, string])
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.card}
        >
          {renderCardContent()}
        </LinearGradient>
      ) : (
        <View style={styles.card}>{renderCardContent()}</View>
      )}
    </TouchableOpacity>
  );
}

export default memo(FootballGameCard);
