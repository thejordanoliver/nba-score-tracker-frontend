import { useESPNBroadcasts } from "hooks/useESPNBroadcasts";
import { useTeamInfo } from "hooks/useTeamInfo";
import { matchBroadcastToGame } from "utils/matchBroadcast";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { getStyles } from "../../styles/GameCard.styles";
import { teams } from "../../constants/teams";
import { useFetchPlayoffGames } from "../../hooks/usePlayoffSeries";
import { Game, Team } from "../../types/types";

export default function GameCard({
  game,
  isDark,
}: {
  game: Game;
  isDark?: boolean;
}) {
  const colorScheme = useColorScheme();
  const dark = isDark ?? colorScheme === "dark";
  const styles = getStyles(dark);
  const router = useRouter();

  const homeTeam =
    game.home ??
    ({ name: "Unknown", logo: "", record: "-", fullName: "Unknown" } as Team);
  const awayTeam =
    game.away ??
    ({ name: "Unknown", logo: "", record: "-", fullName: "Unknown" } as Team);

  const homeTeamData = useMemo(
    () =>
      teams.find(
        (t) =>
          t.name === homeTeam.name ||
          t.code === homeTeam.name ||
          t.name.includes(homeTeam.name)
      ),
    [homeTeam.name]
  );

  const awayTeamData = useMemo(
    () =>
      teams.find(
        (t) =>
          t.name === awayTeam.name ||
          t.code === awayTeam.name ||
          t.name.includes(awayTeam.name)
      ),
    [awayTeam.name]
  );

  const { team: homeInfo } = useTeamInfo(homeTeamData?.id?.toString());
  const { team: awayInfo } = useTeamInfo(awayTeamData?.id?.toString());

  const currentPeriod = Number(game.periods?.current ?? game.period);

  const isFinal = game.status === "Final";
  const inProgress = game.status === "In Progress";
  const isCanceled = game.status === "Canceled";
  const isDelayed = game.status === "Delayed";
  const isPostponed = game.status === "Postponed";
  const isEndOfPeriod = game.periods?.endOfPeriod === true;

  const homeWins = isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWins = isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0);

  const winnerStyle = (teamWins: boolean): TextStyle => ({
    color: dark ? "#fff" : "#1d1d1d",
    opacity: inProgress ? 1 : teamWins ? 1 : 0.5,
  });

  const getLogoSource = (teamData?: Team, teamFallback?: Team) => {
    if (!teamData && teamFallback?.logo) return { uri: teamFallback.logo };
    if (!teamData) return require("../../assets/Logos/NBA.png");
    if (dark && teamData.logoLight) return teamData.logoLight;
    return teamData.logo;
  };

  const { broadcasts } = useESPNBroadcasts();
  const matchedBroadcast = matchBroadcastToGame(game, broadcasts);
  const broadcastNetworks = matchedBroadcast?.broadcasts
    .map((b) => b.network)
    .filter(Boolean)
    .join(", ");

  const homeId = Number(homeTeamData?.id);
  const awayId = Number(awayTeamData?.id);
  const playoffGames =
    homeId && awayId ? useFetchPlayoffGames(homeId, awayId, 2024).games : [];
  const currentPlayoffGame = playoffGames.find((g) => g.id === game.id);
  const gameNumberLabel = currentPlayoffGame?.gameNumber
    ? `Game ${currentPlayoffGame.gameNumber}`
    : null;
  const seriesSummary = currentPlayoffGame?.seriesSummary;

  const gameDate = new Date(game.date);
  const isNBAFinals =
    gameDate.getMonth() === 5 &&
    gameDate.getDate() >= 5 &&
    gameDate.getDate() <= 22;
  const isChristmasDay =
    gameDate.getMonth() === 11 && gameDate.getDate() === 25;
  const isNewYearsDay = gameDate.getMonth() === 0 && gameDate.getDate() === 1;
  const holidayLabel = isChristmasDay
    ? "Christmas Day"
    : isNewYearsDay
    ? "New Year's Day"
    : null;

  function getTeamRecord(
    team: Team,
    teamData?: Team,
    fallbackInfo?: Team | null
  ) {
    return team.record && team.record.trim() !== "" && team.record !== "0-0"
      ? team.record
      : teamData?.current_season_record ??
          fallbackInfo?.current_season_record ??
          "-";
  }

  function getQuarterLabel(period?: number) {
    if (!period) return "Live";
    if (period <= 4) return ["1st", "2nd", "3rd", "4th"][period - 1] ?? "";
    const ot = period - 4;
    return ot === 1 ? "OT" : `OT${ot}`;
  }

  function getFinalWithQuarterLabel(period?: number) {
    if (!period) return "Final";
    if (period <= 4) return `Final`;
    const ot = period - 4;
    return ot === 1 ? "Final OT" : `Final OT${ot}`;
  }

  const ScoreText = ({
    team,
    teamData,
    fallbackInfo,
    score,
    teamWins,
  }: any) => {
    const isScheduled =
      game.status === "Scheduled" || isCanceled || isDelayed || isPostponed;
    const displayValue =
      isCanceled || isScheduled
        ? getTeamRecord(team, teamData, fallbackInfo)
        : score ?? "-";
    const style = isScheduled
      ? styles.teamRecord
      : [styles.teamScore, winnerStyle(teamWins)];
    return <Text style={style}>{displayValue}</Text>;
  };

  const renderCardContent = () => (
    <>
      {/* Away Team */}
      <View style={styles.teamSection}>
        <Image
          source={getLogoSource(awayTeamData, awayTeam)}
          style={styles.logo}
          accessibilityLabel={`${awayTeam.name} logo`}
        />
        <Text style={styles.teamName}>{awayTeam.name}</Text>
      </View>
      <ScoreText
        team={awayTeam}
        teamData={awayTeamData}
        fallbackInfo={awayInfo}
        score={game.awayScore}
        teamWins={awayWins}
      />

      {/* Game Info */}
      <View style={styles.info}>
        {(gameNumberLabel || seriesSummary || holidayLabel) && (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 6,
              paddingHorizontal: 4,
              width: "100%",
              position: "absolute",
              top: -20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {gameNumberLabel && (
                <Text style={styles.seriesStatus}>{gameNumberLabel}</Text>
              )}
              {gameNumberLabel && (seriesSummary || holidayLabel) && (
                <View style={styles.seriesDivider} />
              )}
              {seriesSummary && (
                <Text style={styles.seriesStatus}>{seriesSummary}</Text>
              )}
              {holidayLabel && (
                <Text style={styles.seriesStatus}>{holidayLabel}</Text>
              )}
            </View>
          </View>
        )}

        {isCanceled ? (
          <Text style={styles.finalText}>Canceled</Text>
        ) : isDelayed ? (
          <Text style={styles.finalText}>Delayed</Text>
        ) : isPostponed ? (
          <Text style={styles.finalText}>Postponed</Text>
        ) : isFinal ? (
          <>
            <Text style={styles.finalText}>
              {getFinalWithQuarterLabel(currentPeriod)}
            </Text>
            <Text style={styles.dateFinal}>
              {gameDate.toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
              })}
            </Text>
          </>
        ) : game.status === "Scheduled" ? (
          <>
            <Text style={styles.date}>
              {gameDate.toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.time}>{game.time}</Text>
          </>
        ) : inProgress ? (
          <>
            <Text style={styles.date}>
              {game.isHalftime
                ? "Halftime"
                : isEndOfPeriod
                ? `End of ${getQuarterLabel(currentPeriod)}`
                : getQuarterLabel(currentPeriod)}
            </Text>
            {!game.isHalftime && !isEndOfPeriod && game.clock && (
              <Text style={styles.clock}>{game.clock}</Text>
            )}
          </>
        ) : null}
        {broadcastNetworks && (
          <Text style={styles.broadcast}>{broadcastNetworks}</Text>
        )}
      </View>

      {/* Home Score & Team */}
      <ScoreText
        team={homeTeam}
        teamData={homeTeamData}
        fallbackInfo={homeInfo}
        score={game.homeScore}
        teamWins={homeWins}
      />
      <View style={styles.teamSection}>
        <Image
          source={getLogoSource(homeTeamData, homeTeam)}
          style={styles.logo}
          accessibilityLabel={`${homeTeam.name} logo`}
        />
        <Text style={styles.teamName}>{homeTeam.name}</Text>
      </View>
    </>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/game/[game]",
          params: { game: JSON.stringify(game) },
        })
      }
    >
      {isNBAFinals ? (
        <LinearGradient
          colors={["#DFBD69", "#CDA765"] as [string, string]}
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
