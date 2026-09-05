import { getCBBTeam, getCBBTeamLogo } from "@/constants/teamsCBB";
import { getWNBATeam, getWNBATeamLogo } from "@/constants/teamsWNBA";
import { squareGameCardStyles } from "@/styles/GamecardStyles/SquareGameCardStyles";
import { BasketballGameCardProps } from "@/types/basketball/basketball";
import { activeOpacity } from "constants/styles";
import { getNBATeam, getNBATeamLogo } from "constants/teams";
import { getWCBBTeam, getWCBBTeamLogo } from "constants/teamsWCBB";
import { usePreferences } from "contexts/PreferencesContext";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { formatDate, formatTime, getHolidayLabel } from "utils/dateUtils";
import { formatPeriod, getBroadcastDisplay, winnerStyle } from "utils/games";

export default function BasketballSquareGameCard({
  game,
  isCBB,
  isWCBB,
  isWNBA,
}: BasketballGameCardProps) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const handlePress = () => {
    router.push({
      pathname: "/game/basketball/[game]",
      params: {
        game: String(game.id),
        leagueId: String(league),
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
  const formattedDate = formatDate(gameDate);
  const formattedTime = formatTime(gameDate);
  const holidayLabel = getHolidayLabel(gameDate);

  const league = game?.league?.id;
  const home = game?.home;
  const away = game?.away;
  const homeId = home?.id;
  const awayId = away?.id;

  const homeTeam = isCBB
    ? getCBBTeam(homeId)
    : isWCBB
      ? getWCBBTeam(homeId)
      : isWNBA
        ? getWNBATeam(homeId)
        : getNBATeam(homeId);

  const awayTeam = isCBB
    ? getCBBTeam(awayId)
    : isWCBB
      ? getWCBBTeam(awayId)
      : isWNBA
        ? getWNBATeam(awayId)
        : getNBATeam(awayId);

  const homeName = homeTeam?.code || game.home?.code;
  const awayName = awayTeam?.code || game.away?.code;

  const homeLogo = isCBB
    ? getCBBTeamLogo(homeId, isDark)
    : isWCBB
      ? getWCBBTeamLogo(homeId, isDark)
      : isWNBA
        ? getWNBATeamLogo(homeId, isDark)
        : getNBATeamLogo(homeId, isDark);

  const awayLogo = isCBB
    ? getCBBTeamLogo(awayId, isDark)
    : isWCBB
      ? getWCBBTeamLogo(awayId, isDark)
      : isWNBA
        ? getWNBATeamLogo(awayId, isDark)
        : getNBATeamLogo(awayId, isDark);

  const headline = game?.headline || holidayLabel;
  const isChampionship =
    headline?.includes("NBA Summer League - Final") ||
    headline?.includes("NBA Finals") ||
    headline?.includes(
      "Men's Basketball Championship - National Championship",
    ) ||
    headline?.includes(
      "Women's Basketball Championship - National Championship",
    );

  const styles = squareGameCardStyles(isDark, isChampionship);

  const homeScore = game.home.score ?? 0;
  const awayScore = game.away.score ?? 0;

  const period = formatPeriod({
    period: game.status.period,
    isCBB: isCBB || isWCBB,
  });
  const clock = game.status.displayClock;
  const gameStatusDescription = game.status?.description;
  const gameStatusDetail = game.status.shortDetail;
  const tbd = gameStatusDetail.includes("TBD") ? "TBD" : null;
  const isFinal = gameStatusDescription === "Final";
  const isScheduled = gameStatusDescription === "Scheduled";
  const inProgress = gameStatusDescription === "In Progress";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeit";
  const isHalftime = gameStatusDescription === "Halftime";
  const endOfPeriod = gameStatusDescription === "End of Period";
  const broadcast = getBroadcastDisplay(game?.broadcasts);

  const homeRecord = game.home.record ?? "0-0";
  const awayRecord = game.away.record ?? "0-0";

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
    score: number | undefined;
    record: string | undefined;
    isWinner: boolean;
  }) => {
    const showRecord = isScheduled || isCanceled || isPostponed || isDelayed;

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

  const renderStatus = () => {
    if (inProgress)
      return (
        <View style={styles.infoWrapper}>
          <Text style={styles.period}>{period}</Text>
          <View style={styles.divider} />
          <Text style={styles.clock}>{clock}</Text>
        </View>
      );

    if (isDelayed || isCanceled || isPostponed || isForfeited)
      return <Text style={styles.finalText}>{gameStatusDescription}</Text>;

    if (isHalftime) return <Text style={styles.finalText}>Halftime</Text>;

    if (endOfPeriod)
      return <Text style={styles.clock}>{gameStatusDetail}</Text>;

    if (isFinal)
      return (
        <View>
          <Text style={styles.finalText}>{gameStatusDetail}</Text>
          <Text style={styles.finalText}>{formattedDate}</Text>
        </View>
      );

    return (
      <View>
        <Text style={styles.date}>{formattedDate}</Text>
        <Text style={styles.date}>{tbd || formattedTime}</Text>
      </View>
    );
  };

  const renderCardContent = () => (
    <>
      <View style={styles.cardWrapper}>
        {/* Away Team */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
            <Image
              source={awayLogo}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel={`${awayName} logo`}
            />
            <Text style={styles.teamName}>{awayName}</Text>
          </View>
          {/* Away Score / Record */}
          <ScoreText
            score={awayScore}
            record={awayRecord}
            isWinner={awayWins}
          />
        </View>

        {/* Home Team */}
        <View style={styles.teamSection}>
          <View style={styles.teamWrapper}>
            <Image
              source={homeLogo}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel={`${homeName} logo`}
            />
            <Text style={styles.teamName}>{homeName}</Text>
          </View>

          {/* Home Score / Record */}
          <ScoreText
            score={homeScore}
            record={homeRecord}
            isWinner={homeWins}
          />
        </View>
      </View>
      {/* headlineText */}
      <Text style={[styles.headlineText]}>{headline}</Text>

      {/* Game Info */}
      <View style={styles.info}>
        {renderStatus()}
        {!isFinal && broadcast && (
          <Text style={styles.broadcast}>{broadcast}</Text>
        )}
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
