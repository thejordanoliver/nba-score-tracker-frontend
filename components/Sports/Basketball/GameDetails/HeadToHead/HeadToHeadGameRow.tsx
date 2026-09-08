import { BasketballGame } from "@/types/basketball/basketball";
import { Colors } from "constants/styles";
import { Image } from "expo-image";

import { Text, View } from "react-native";
import { headToHeadStyles } from "styles/GameDetailStyles/HeadToHeadStyles";
import { formatPeriod } from "utils/games";

type Props = {
  game: BasketballGame;
  homeTeamEspnId: string;
  awayTeamEspnId: string;
  homeTeamId: number;
  awayTeamId: number;
  homeLogo: any;
  awayLogo: any;
  homeTeamCode?: string;
  awayTeamCode?: string;
  isDark: boolean;
  isLast?: boolean; // <-- new optional prop
};

export default function HeadToHeadGameRow({
  game,
  homeTeamEspnId,
  awayTeamEspnId,
  homeTeamId,
  awayTeamId,
  homeLogo,
  awayLogo,
  homeTeamCode,
  awayTeamCode,
  isDark,
  isLast = false, // default false
}: Props) {
  const styles = headToHeadStyles(isDark);
  const safeDate = (date?: string | null) => {
    if (!date) return new Date();
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const gameDate = safeDate(game.date);

  const homeRecord = game?.home.record ?? "";
  const awayRecord = game?.home.record ?? "";

  const gameStatusDescription = game.status.description ?? "";
  const gameStatusDetail = game?.status.shortDetail ?? "";

  const isFinal = gameStatusDescription === "Final";
  const isScheduled = gameStatusDescription === "Scheduled";
  const inProgress = gameStatusDescription === "In Progress";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isForfeited = gameStatusDescription === "Forfeit";
  const isHalftime = gameStatusDescription === "Halftime";
  const endOfPeriod = gameStatusDescription === "End of Period";

  const period = formatPeriod({ period: game.status?.period });
  const displayClock = game.status?.clock;

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

  // --- Corrected score mapping ---
  const getTeamScore = (teamId: number) => {
    if (game?.home?.id === teamId) return game.home.score ?? 0;
    if (game?.away?.id === teamId) return game.away.score ?? 0;
    return 0;
  };

  const homeScore = getTeamScore(homeTeamId);
  const awayScore = getTeamScore(awayTeamId);
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const isTie = homeScore === awayScore;

  const winnerStyle = (teamWins: boolean) => ({
    color: isDark ? Colors.white : Colors.black,
    opacity: isFinal ? (isTie ? 1 : teamWins ? 1 : 0.5) : 1,
  });

  const ScoreText = ({
    score,
    record,
    teamWins,
  }: {
    score: number | undefined;
    record: string | undefined;
    teamWins: boolean;
  }) => {
    const showRecord = isScheduled || isCanceled || isPostponed || isDelayed;
    return (
      <Text
        style={
          showRecord
            ? styles.teamRecord
            : [styles.teamScore, winnerStyle(teamWins)]
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
          <Text style={styles.clock}>{displayClock}</Text>
        </View>
      );
    if (isDelayed) return <Text style={styles.finalText}>Delayed</Text>;
    if (isHalftime) return <Text style={styles.finalText}>Halftime</Text>;
    if (isCanceled) return <Text style={styles.finalText}>Canceled</Text>;
    if (isPostponed) return <Text style={styles.finalText}>Postponed</Text>;
    if (isForfeited) return <Text style={styles.finalText}>Forfeited</Text>;
    if (endOfPeriod) return <Text style={styles.clock}>End of {period}</Text>;
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
        <Text style={styles.date}>{formattedTime}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.gameCard, isLast && styles.lastGameCard]}>
      {/* Away Team */}
      <View style={styles.teamRow}>
        <View style={styles.teamInfo}>
          <Image
            source={awayLogo}
            style={styles.teamLogo}
            contentFit="contain"
          />
          <Text
            style={styles.teamName}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {awayTeamCode}
          </Text>
        </View>
        <ScoreText score={awayScore} record={awayRecord} teamWins={awayWon} />
      </View>

      {/* Game Info */}
      <View style={styles.info}>{renderStatus()}</View>

      {/* Home Team */}
      <View style={styles.teamRow}>
        <ScoreText score={homeScore} record={homeRecord} teamWins={homeWon} />
        <View style={styles.teamInfo}>
          <Image
            source={homeLogo}
            style={styles.teamLogo}
            contentFit="contain"
          />
          <Text
            style={styles.teamName}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {homeTeamCode}
          </Text>
        </View>
      </View>
    </View>
  );
}
