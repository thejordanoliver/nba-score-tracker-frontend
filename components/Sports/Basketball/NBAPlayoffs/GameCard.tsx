import { NBAPlayoffBracketStyles } from "@/styles/PlayoffStyles/NBAPlayoffBraketStyles";
import { NBABracketMatchup } from "@/types/basketball/basketball";
import { formatPeriod, getBroadcastDisplay } from "@/utils/games";
import { Colors } from "constants/styles";
import { getNBATeam } from "constants/teams";
import { Text, View } from "react-native";
import { TeamRow } from "./TeamRow";

type CardLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const bottomTeamId = (matchup: NBABracketMatchup) =>
  matchup.bottomTeam?.id?.toString() ?? "";

const topTeamId = (matchup: NBABracketMatchup) =>
  matchup.topTeam?.id?.toString() ?? "";

const getSeriesRecord = (matchup: NBABracketMatchup) => {
  const topWins = matchup.wins[topTeamId(matchup)] ?? 0;
  const bottomWins = matchup.wins[bottomTeamId(matchup)] ?? 0;

  return { topWins, bottomWins };
};

const latestGame = (game: NBABracketMatchup["games"][number]) => {
  const gameState = game?.status?.state;

  if (gameState === "in") {
    return true;
  } else if (gameState === "pre") {
    return true;
  } else if (gameState === "post") {
    return false;
  }

  const normalizedStatus = String(game.status?.description ?? "")
    .trim()
    .toLowerCase();

  return !["scheduled", "final"].includes(normalizedStatus);
};

const getRecentGame = (matchup: NBABracketMatchup) =>
  matchup.games.find((game) => latestGame(game));

const getTeamGamePoints = (
  game: NBABracketMatchup["games"][number],
  teamId?: string | number,
) => {
  if (teamId == null) return null;

  if (String(game?.home?.id) === String(teamId)) {
    return game?.home?.score ?? null;
  }

  if (String(game?.away?.id) === String(teamId)) {
    return game?.away?.score ?? null;
  }

  return null;
};

const getGameStatus = (
  game: NBABracketMatchup["games"][number] | undefined | null,
  isDark: boolean,
) => {
  const styles = NBAPlayoffBracketStyles(isDark);

  if (!game) {
    return null;
  }

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

  const clock = game.status?.clock;
  const gameStatusDescription = game.status?.description;
  const gameStatusDetail = game.status?.shortDetail;
  const tbd = gameStatusDetail?.includes("TBD") ? "TBD" : null;

  const isFinal = gameStatusDescription === "Final";
  const inProgress = gameStatusDescription === "In Progress";
  const isCanceled = gameStatusDescription === "Canceled";
  const isDelayed = gameStatusDescription === "Delayed";
  const isPostponed = gameStatusDescription === "Postponed";
  const isSuspended = gameStatusDescription === "Suspended";
  const isForfeited = gameStatusDescription === "Forfeit";
  const isHalftime = gameStatusDescription === "Halftime";
  const isEndOfPeriod = gameStatusDescription === "End of Period";

  const period = formatPeriod({ period: game.status?.period || 0 });

  if (inProgress) {
    return (
      <View style={styles.statusWrapper}>
        <Text style={styles.period}>{period}</Text>
        <View style={styles.statusDivider} />
        <Text style={styles.clock}>{clock}</Text>
      </View>
    );
  }

  if (isDelayed || isCanceled || isPostponed || isForfeited || isSuspended) {
    return <Text style={styles.clock}>{gameStatusDescription}</Text>;
  }

  if (isHalftime) {
    return <Text style={styles.clock}>Halftime</Text>;
  }

  if (isEndOfPeriod) {
    return <Text style={styles.clock}>End of {period}</Text>;
  }

  if (isFinal) {
    return (
      <View style={styles.statusWrapper}>
        <Text style={styles.clock}>{gameStatusDetail}</Text>
        <View style={styles.statusDivider} />
        <Text style={styles.clock}>{formattedDate}</Text>
      </View>
    );
  }

  return (
    <View style={styles.statusWrapper}>
      <Text style={styles.date}>{formattedDate}</Text>
      <View style={styles.statusDivider} />
      <Text style={styles.date}>{tbd || formattedTime}</Text>
    </View>
  );
};

const getFooterLabel = (matchup: NBABracketMatchup) => {
  if (matchup.seriesSummary) return matchup.seriesSummary;

  const { topWins, bottomWins } = getSeriesRecord(matchup);

  const leaderTeam =
    topWins === bottomWins
      ? undefined
      : topWins > bottomWins
        ? matchup.topTeam
        : matchup.bottomTeam;

  const teamName =
    leaderTeam?.code || getNBATeam(leaderTeam?.id ?? 0)?.code || "TBD";

  if (topWins === bottomWins && topWins !== 0 && bottomWins !== 0) {
    return "Series Tied";
  }

  if (bottomWins === 4) {
    return `${teamName} won series ${bottomWins}-${topWins}`;
  }

  if (topWins === 4) {
    return `${teamName} won series ${topWins}-${bottomWins}`;
  }

  if (topWins > bottomWins) {
    return `${teamName} leads ${topWins}-${bottomWins}`;
  }

  if (topWins < bottomWins) {
    return `${teamName} leads ${bottomWins}-${topWins}`;
  }

  return "Best of 7";
};

export const GameCard = ({
  matchup,
  layout,
  isDark,
  finals = false,
}: {
  matchup: NBABracketMatchup;
  layout: CardLayout;
  isDark: boolean;
  finals?: boolean;
}) => {
  const styles = NBAPlayoffBracketStyles(isDark);
  const { topWins, bottomWins } = getSeriesRecord(matchup);

  const recentGame = getRecentGame(matchup);

  const liveTopPoints =
    recentGame?.status?.state === "in"
      ? getTeamGamePoints(recentGame, matchup.topTeam?.id)
      : null;

  const liveBottomPoints =
    recentGame?.status?.state === "post"
      ? getTeamGamePoints(recentGame, matchup.bottomTeam?.id)
      : null;

  const broadcast = getBroadcastDisplay(recentGame?.broadcasts);

  return (
    <View
      style={[
        styles.cardShell,
        finals ? styles.finalsShell : null,
        {
          left: layout.x,
          top: layout.y,
          width: layout.width,
          height: layout.height,
          borderColor:
            finals && isDark
              ? Colors.dark.gold
              : finals
                ? Colors.light.gold
                : isDark
                  ? Colors.darkGray
                  : Colors.lightGray,
          backgroundColor: isDark
            ? Colors.dark.itemBackground
            : Colors.light.itemBackground,
        },
      ]}
    >
      <TeamRow
        team={matchup.topTeam}
        wins={topWins}
        oponnentWins={bottomWins}
        score={liveTopPoints}
        isDark={isDark}
      />

      <View style={styles.divider} />

      <TeamRow
        team={matchup.bottomTeam}
        wins={bottomWins}
        oponnentWins={topWins}
        score={liveBottomPoints}
        isDark={isDark}
      />

      <View style={styles.statusContainer}>
        {broadcast ? <Text style={styles.broadcast}>{broadcast}</Text> : null}
        {getGameStatus(recentGame, isDark)}
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.footerText}>{getFooterLabel(matchup)}</Text>
      </View>
    </View>
  );
};
