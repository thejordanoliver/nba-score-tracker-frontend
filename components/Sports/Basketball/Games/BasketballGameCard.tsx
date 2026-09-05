import { getCBBTeam, getCBBTeamLogo } from "@/constants/teamsCBB";
import { getGLeagueTeam, getGLeagueTeamLogo } from "@/constants/teamsGLeague";
import { getWNBATeam, getWNBATeamLogo } from "@/constants/teamsWNBA";
import { BasketballGameCardProps } from "@/types/basketball/basketball";
import { activeOpacity } from "constants/styles";
import { getNBATeam, getNBATeamLogo, getTeamBySummerId } from "constants/teams";
import { getWCBBTeam, getWCBBTeamLogo } from "constants/teamsWCBB";
import { usePreferences } from "contexts/PreferencesContext";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { gameCardStyles } from "styles/GamecardStyles/GameCardStyles";
import {
  formatDate,
  formatTime,
  getHolidayLabel,
  safeDate,
} from "utils/dateUtils";
import { formatPeriod, getBroadcastDisplay, winnerStyle } from "utils/games";

export default function BasketballGameCard({
  game,
  isSL,
  isCBB,
  isWCBB,
  isWNBA,
  isGLEAGUE,
}: BasketballGameCardProps) {
  const router = useRouter();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const handlePress = () => {
      console.log(league);
    router.push({
      pathname: "/game/basketball/[game]",
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
        : isSL
          ? getTeamBySummerId(homeId)
          : isGLEAGUE
            ? getGLeagueTeam(homeId)
            : getNBATeam(homeId);

  const awayTeam = isCBB
    ? getCBBTeam(awayId)
    : isWCBB
      ? getWCBBTeam(awayId)
      : isWNBA
        ? getWNBATeam(awayId)
        : isSL
          ? getTeamBySummerId(awayId)
          : isGLEAGUE
            ? getGLeagueTeam(awayId)
            : getNBATeam(awayId);

            

  const homeName = homeTeam?.shortName || homeTeam?.name || game.home?.name;
  const awayName = awayTeam?.shortName || awayTeam?.name || game.away?.name;

  const homeLogo = isCBB
    ? getCBBTeamLogo(homeId, isDark)
    : isWCBB
      ? getWCBBTeamLogo(homeId, isDark)
      : isWNBA
        ? getWNBATeamLogo(homeId, isDark)
        : isWNBA
          ? getWNBATeamLogo(homeId, isDark)
          : isGLEAGUE
            ? getGLeagueTeamLogo(homeId, isDark)
            : getNBATeamLogo(homeId, isDark);

  const awayLogo = isCBB
    ? getCBBTeamLogo(awayId, isDark)
    : isWCBB
      ? getWCBBTeamLogo(awayId, isDark)
      : isWNBA
        ? getWNBATeamLogo(awayId, isDark)
        : isGLEAGUE
          ? getGLeagueTeamLogo(awayId, isDark)
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

  const styles = gameCardStyles(isDark, isChampionship);

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
  const isSuspended = gameStatusDescription === "Suspended";
  const isHalftime = gameStatusDescription === "Halftime";
  const endOfPeriod = gameStatusDescription === "End of Period";
  const homeRank = home?.rank;
  const awayRank = away?.rank;
  const homeRecord = game.home.record ?? "0-0";
  const awayRecord = game.away.record ?? "0-0";
  const broadcast = getBroadcastDisplay(game?.broadcasts);

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
          <View style={styles.statusDivider} />
          <Text style={styles.clock}>{clock}</Text>
        </View>
      );

    if (isDelayed || isCanceled || isPostponed || isForfeited || isSuspended)
      return <Text style={styles.finalText}>{gameStatusDescription}</Text>;

    if (endOfPeriod) return <Text style={styles.clock}>End of {period}</Text>;

    if (isHalftime) return <Text style={styles.finalText}>Halftime</Text>;

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
      {/* Away Team */}
      <View style={styles.teamSection}>
        <Image
          source={awayLogo}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel={`${awayName} logo`}
        />
        <Text style={styles.teamName}>
          {awayRank && <Text style={styles.rank}>{awayRank} </Text>}
          {awayName}
        </Text>
      </View>
      {/* Away Score / Record */}
      <ScoreText score={awayScore} record={awayRecord} isWinner={awayWins} />

      {/* headline */}
      <View style={styles.headlineContainer}>
        <Text style={[styles.headlineText]}>{headline}</Text>
      </View>

      {/* Game Info */}
      <View style={styles.info}>
        {renderStatus()}
        {!isFinal && broadcast && (
          <Text style={styles.broadcast}>{broadcast}</Text>
        )}
      </View>

      {/* Home Score / Record */}
      <ScoreText score={homeScore} record={homeRecord} isWinner={homeWins} />

      {/* Home Team */}
      <View style={styles.teamSection}>
        <Image
          source={homeLogo}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel={`${homeName} logo`}
        />
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
