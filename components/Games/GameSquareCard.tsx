import { Fonts } from "constants/fonts";
import { useESPNBroadcasts } from "hooks/useESPNBroadcasts";
import { useTeamInfo } from "hooks/useTeamInfo";
import { matchBroadcastToGame } from "utils/matchBroadcast";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { teams } from "../../constants/teams";
import { useFetchPlayoffGames } from "../../hooks/usePlayoffSeries";
import { Game, Team } from "../../types/types";

export default function GameSquareCard({
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

  const homeTeam = (game.home ?? {
    name: "Unknown",

    logo: "",
    record: "-",
    fullName: "Unknown",
  }) as Team;
  const awayTeam = (game.away ?? {
    name: "Unknown",
    logo: "",
    record: "-",
    fullName: "Unknown",
  }) as Team;

  const homeTeamData = useMemo(() => {
    return teams.find(
      (t) =>
        homeTeam.name &&
        (t.name === homeTeam.name ||
          t.code === homeTeam.name ||
          t.name.includes(homeTeam.name))
    );
  }, [homeTeam.name]);

  const awayTeamData = useMemo(() => {
    return teams.find(
      (t) =>
        awayTeam.name &&
        (t.name === awayTeam.name ||
          t.code === awayTeam.name ||
          t.name.includes(awayTeam.name))
    );
  }, [awayTeam.name]);

  const { team: homeInfo } = useTeamInfo(homeTeamData?.id?.toString());
  const { team: awayInfo } = useTeamInfo(awayTeamData?.id?.toString());

  const isFinal = game.status?.toLowerCase() === "final";
  const inProgress = game.status === "In Progress";
  const isCanceled = game.status === "Canceled";

  const homeWins = isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWins = isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0);

  const isPlayoff =
    game.isPlayoff || (game.stage !== undefined && game.stage >= 4);

  const winnerStyle = (teamWins: boolean): TextStyle | undefined =>
    teamWins ? { color: dark ? "#fff" : "#000", fontWeight: "bold" } : {};

  const getLogoSource = (teamData?: Team, teamFallback?: Team) => {
    const logo = teamData?.logo ?? teamFallback?.logo;

    const fallbackLogo = require("../../assets/Logos/NBA.png");

    if (!logo) {
      return fallbackLogo;
    }

    if (typeof logo === "string") {
      const lowerLogo = logo.toLowerCase();
      if (
        lowerLogo.endsWith(".gif") ||
        lowerLogo.includes("giphy.com") ||
        lowerLogo.endsWith(".webp")
      ) {
        return fallbackLogo;
      }
      return { uri: logo };
    }

    if (dark && teamData?.logoLight) {
      return teamData.logoLight;
    }

    return logo;
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
  const gameNumber = currentPlayoffGame?.gameNumber;
  const seriesSummary = currentPlayoffGame?.seriesSummary;
  const isEndOfPeriod = game.periods?.endOfPeriod === true;
  const currentPeriod = game.periods?.current ?? game.period;
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

  const finalsScoreStyle = (isWinner: boolean): TextStyle => ({
    color: isWinner ? (dark ? "#000" : "#000") : "rgba(0, 0, 0, 0.4)",
  });

  const gameNumberLabel = gameNumber ? `Game ${gameNumber}` : null;

  function getTeamRecord(
    team: Team,
    teamData?: Team,
    fallbackInfo?: Team | null
  ) {
    const record =
      team.record && team.record.trim() !== "" && team.record !== "0-0"
        ? team.record
        : teamData?.current_season_record ||
          fallbackInfo?.current_season_record;

    return record ?? "-";
  }
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
          colors={["#DFBD69", "#CDA765"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardWrapper}>
            {/* Away team */}
            <View style={styles.teamSection}>
              <View style={styles.teamWrapper}>
                <Image
                  key={awayTeamData?.id ?? awayTeam.name}
                  source={getLogoSource(awayTeamData, awayTeam)}
                  defaultSource={require("../../assets/Logos/NBA.png")}
                  fadeDuration={0}
                  style={styles.logo}
                  accessibilityLabel={`${awayTeam.name} logo`}
                />
                <Text
                  style={[styles.teamName, { color: dark ? "#000" : "#000" }]}
                >
                  {awayTeamData?.code ?? awayTeam.code ?? awayTeam.name}
                </Text>
              </View>
              {/* Away score or record */}
              <Text
                style={[
                  game.status === "Scheduled" || isCanceled
                    ? styles.teamRecord
                    : styles.teamScore,
                  finalsScoreStyle(awayWins), // was missing or you used finalsScoreStyle in Finals only
                ]}
              >
                {isCanceled
                  ? getTeamRecord(awayTeam, awayTeamData, awayInfo)
                  : game.status === "Scheduled"
                  ? getTeamRecord(awayTeam, awayTeamData, awayInfo)
                  : game.awayScore ?? "-"}
              </Text>
            </View>

            {/* Home team */}
            <View style={styles.teamSection}>
              <View style={styles.teamWrapper}>
                <Image
                  key={homeTeamData?.id ?? homeTeam.name}
                  source={getLogoSource(homeTeamData, homeTeam)}
                  fadeDuration={0}
                  style={styles.logo}
                  accessibilityLabel={`${homeTeam.name} logo`}
                />
                <Text
                  style={[styles.teamName, { color: dark ? "#000" : "#000" }]}
                >
                  {homeTeamData?.code ?? homeTeam.code ?? homeTeam.name}
                </Text>
              </View>
              <Text
                style={[
                  game.status === "Scheduled" || isCanceled
                    ? styles.teamRecord
                    : styles.teamScore,
                  finalsScoreStyle(homeWins),
                ]}
              >
                {isCanceled
                  ? getTeamRecord(homeTeam, homeTeamData, homeInfo)
                  : game.status === "Scheduled"
                  ? getTeamRecord(homeTeam, homeTeamData, homeInfo)
                  : game.homeScore ?? "-"}
              </Text>
            </View>
          </View>

          {/* Game info */}
          <View style={styles.info}>
            {isCanceled ? (
              <Text style={styles.finalText}>Canc.</Text>
            ) : isFinal ? (
              <>
                <Text style={styles.finalText}>Final</Text>
                <Text style={[styles.dateFinal, { color: "#000" }]}>
                  {new Date(game.date).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </Text>
              </>
            ) : game.status === "Scheduled" ? (
              <>
                <Text style={[styles.date, { color: "#000" }]}>
                  {new Date(game.date).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </Text>
                <Text style={[styles.time, { color: "#000" }]}>
                  {game.time}
                </Text>
              </>
            ) : inProgress ? (
              <>
                <Text
                  style={[
                    styles.date,
                    {
                      fontFamily: Fonts.OSMEDIUM,
                      color: isDark ? "#fff" : "#1d1d1d",
                    },
                  ]}
                >
                  {(() => {
                    const periodNum = Number(currentPeriod) || 0;

                    if (game.isHalftime) {
                      return "Halftime";
                    }

                    if (isEndOfPeriod) {
                      if (periodNum > 4) {
                        return periodNum === 5
                          ? "End of OT"
                          : `End of ${periodNum - 4}OT`;
                      }
                      return `End of Q${periodNum}`;
                    }

                    if (periodNum > 4) {
                      return periodNum === 5 ? "OT" : `${periodNum - 4}OT`;
                    }

                    return `Q${periodNum || "Live"}`;
                  })()}
                </Text>
              </>
            ) : null}
          </View>
          {broadcastNetworks && (
            <Text
              style={[
                styles.broadcast,
                {
                  color: "#000",
                  position: "absolute",
                  top: 2,
                  left: 12,
                },
              ]}
            >
              {broadcastNetworks}
            </Text>
          )}
          {(gameNumberLabel || seriesSummary || holidayLabel) && (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                left: 8,
                bottom: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "nowrap",
                  gap: 6,
                }}
              >
                {gameNumberLabel && (
                  <Text
                    style={{
                      color: "#000",
                      fontFamily: Fonts.OSEXTRALIGHT,
                      fontSize: 8,
                      maxWidth: 50,
                      textAlign: "center",
                      opacity: 0.8,
                    }}
                    numberOfLines={1}
                  >
                    {gameNumberLabel}
                  </Text>
                )}
                {gameNumberLabel && (seriesSummary || holidayLabel) && (
                  <View
                    style={{
                      height: 10,
                      width: 1,
                      backgroundColor: "#000",
                      opacity: 0.3,
                    }}
                  />
                )}
                {seriesSummary && (
                  <Text
                    style={{
                      color: dark ? "#000" : "#000",
                      fontFamily: Fonts.OSEXTRALIGHT,
                      fontSize: 8,
                      textAlign: "center",
                      maxWidth: 180,
                      opacity: 0.8,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {seriesSummary}
                  </Text>
                )}
              </View>
            </View>
          )}
        </LinearGradient>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardWrapper}>
            {/* Away team */}
            <View style={styles.teamSection}>
              <View style={styles.teamWrapper}>
                <Image
                  key={awayTeamData?.id ?? awayTeam.name}
                  source={getLogoSource(awayTeamData, awayTeam)}
                  defaultSource={require("../../assets/Logos/NBA.png")}
                  fadeDuration={0}
                  style={styles.logo}
                  accessibilityLabel={`${awayTeam.name} logo`}
                />
                <Text
                  style={[styles.teamName, { color: dark ? "#fff" : "#000" }]}
                >
                  {awayTeamData?.code ?? awayTeam.code ?? awayTeam.name}
                </Text>
              </View>
              {/* Away score or record */}
              <Text
                style={[
                  game.status === "Scheduled" || isCanceled
                    ? styles.teamRecord
                    : styles.teamScore,
                  winnerStyle(awayWins), // was missing or you used finalsScoreStyle in Finals only
                ]}
              >
                {isCanceled
                  ? getTeamRecord(awayTeam, awayTeamData, awayInfo)
                  : game.status === "Scheduled"
                  ? getTeamRecord(awayTeam, awayTeamData, awayInfo)
                  : game.awayScore ?? "-"}
              </Text>
            </View>

            {/* Home team */}
            <View style={styles.teamSection}>
              <View style={styles.teamWrapper}>
                <Image
                  key={homeTeamData?.id ?? homeTeam.name}
                  source={getLogoSource(homeTeamData, homeTeam)}
                  fadeDuration={0}
                  style={styles.logo}
                  accessibilityLabel={`${homeTeam.name} logo`}
                />
                <Text
                  style={[styles.teamName, { color: dark ? "#fff" : "#000" }]}
                >
                  {homeTeamData?.code ?? homeTeam.code ?? homeTeam.name}
                </Text>
              </View>
              <Text
                style={[
                  game.status === "Scheduled" || isCanceled
                    ? styles.teamRecord
                    : styles.teamScore,
                  winnerStyle(homeWins),
                ]}
              >
                {isCanceled
                  ? getTeamRecord(homeTeam, homeTeamData, homeInfo)
                  : game.status === "Scheduled"
                  ? getTeamRecord(homeTeam, homeTeamData, homeInfo)
                  : game.homeScore ?? "-"}
              </Text>
            </View>
          </View>

          {/* Game info */}
          <View style={styles.info}>
            {isCanceled ? (
              <Text style={[styles.finalText]}>Canc.</Text>
            ) : isFinal ? (
              <>
                <Text style={styles.finalText}>Final</Text>
                <Text style={[styles.dateFinal]}>
                  {new Date(game.date).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </Text>
              </>
            ) : game.status === "Scheduled" ? (
              <>
                <Text
                  style={[
                    styles.date,
                    {
                      fontFamily: Fonts.OSMEDIUM,
                      color: isDark ? "#fff" : "#1d1d1d",
                    },
                  ]}
                >
                  {new Date(game.date).toLocaleDateString("en-US", {
                    month: "numeric",
                    day: "numeric",
                  })}
                </Text>
                <Text
                  style={[
                    styles.time,
                    {
                      fontFamily: Fonts.OSREGULAR,
                      color: dark
                        ? "rgba(255,255,255, .5)"
                        : "rgba(0, 0, 0, .5)",
                    },
                  ]}
                >
                  {game.time}
                </Text>
              </>
            ) : inProgress ? (
              <>
                <Text
                  style={[
                    styles.date,
                    {
                      fontFamily: Fonts.OSMEDIUM,
                      color: isDark ? "#fff" : "#1d1d1d",
                    },
                  ]}
                >
                  {(() => {
                    const periodNum = Number(currentPeriod) || 0;

                    if (game.isHalftime) {
                      return "Halftime";
                    }

                    if (isEndOfPeriod) {
                      if (periodNum > 4) {
                        return periodNum === 5
                          ? "End of OT"
                          : `End of ${periodNum - 4}OT`;
                      }
                      return `End of Q${periodNum}`;
                    }

                    if (periodNum > 4) {
                      return periodNum === 5 ? "OT" : `${periodNum - 4}OT`;
                    }

                    return `Q${periodNum || "Live"}`;
                  })()}
                </Text>

                {!game.isHalftime && !isEndOfPeriod && game.clock ? (
                  <Text style={[styles.clock]}>{game.clock}</Text>
                ) : null}
              </>
            ) : null}
          </View>
          {broadcastNetworks && (
            <Text
              style={[
                styles.broadcast,
                {
                  color: dark ? "#fff" : "#000",
                  position: "absolute",
                  top: 2,
                  left: 12,
                },
              ]}
            >
              {broadcastNetworks}
            </Text>
          )}
          {(gameNumberLabel || seriesSummary || holidayLabel) && (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                position: "absolute",
                left: 12,
                bottom: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  flexWrap: "nowrap",
                  gap: 6,
                }}
              >
                {gameNumberLabel && (
                  <Text
                    style={{
                      color: dark ? "#fff" : "#000",
                      fontFamily: Fonts.OSEXTRALIGHT,
                      fontSize: 10,
                      maxWidth: 50,
                      textAlign: "center",
                      opacity: 0.8,
                    }}
                    numberOfLines={1}
                  >
                    {gameNumberLabel}
                  </Text>
                )}
                {gameNumberLabel && (seriesSummary || holidayLabel) && (
                  <View
                    style={{
                      height: 10,
                      width: 1,
                      backgroundColor: dark ? "#fff" : "#000",
                      opacity: 0.3,
                    }}
                  />
                )}
                {seriesSummary && (
                  <Text
                    style={{
                      color: dark ? "#fff" : "#000",
                      fontFamily: Fonts.OSEXTRALIGHT,
                      fontSize: 10,
                      textAlign: "center",
                      maxWidth: 180,
                      opacity: 0.8,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {seriesSummary}
                  </Text>
                )}
                {holidayLabel && (
                  <Text
                    style={{
                      color: dark ? "#fff" : "#000",
                      fontFamily: Fonts.OSEXTRALIGHT,
                      fontSize: 10,
                      textAlign: "center",
                      maxWidth: 180,
                      opacity: 0.8,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {holidayLabel}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export const getStyles = (dark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      height: 120,
      backgroundColor: dark ? "#2e2e2e" : "#eee",
      justifyContent: "space-between",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 16,
    },
    cardWrapper: {
      flexDirection: "column",
      justifyContent: "center",
      borderRightColor: dark ? "#444" : "#888",
      borderRightWidth: 0.5,
      paddingRight: 12,
      gap: 8,
    },
    teamSection: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: 4,
    },

    teamWrapper: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: 8,
      width: 80,
    },

    logo: {
      width: 28,
      height: 28,
      resizeMode: "contain",
    },
    teamName: {
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
      flexShrink: 1,
      color: dark ? "#fff" : "#1d1d1d",
      textAlign: "left",
    },
    teamScore: {
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
      textAlign: "right",
      color: dark ? "#aaa" : "#888",
      width: 40,
    },
    teamRecord: {
      width: 40,
      fontSize: 16,
      fontFamily: Fonts.OSBOLD,
      textAlign: "right",
      marginVertical: 2,
      color: dark ? "#fff" : "#1d1d1d",
    },
    info: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      width: 44,
    },
    finalText: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 16,
      color: dark ? "#ff4444" : "#cc0000",
      fontWeight: "bold",
      textAlign: "center",
      width: 40,
    },
    date: {
      fontSize: 12,
      textAlign: "center",
      color: dark ? "#fff" : "#1d1d1d",
      fontFamily: Fonts.OSMEDIUM,
    },
    dateFinal: {
      fontFamily: Fonts.OSREGULAR,
      color: dark ? "rgba(255,255,255, .5)" : "rgba(0, 0, 0, .5)",
      fontSize: 14,
    },
    time: {
      fontSize: 10,
      fontFamily: Fonts.OSREGULAR,
      textAlign: "center",
      color: dark ? "#ff4444" : "#cc0000",
    },
    clock: {
      fontSize: 14,
      fontFamily: Fonts.OSBOLD,
      textAlign: "center",
      color: dark ? "#ff4444" : "#cc0000",
    },
    broadcast: {
      fontSize: 10,
      fontFamily: Fonts.OSREGULAR,
      textAlign: "center",
      marginTop: 4,
      color: dark ? "#fff" : "#1d1d1d",
      position: "absolute",
      top: 2,
      left: 12,
    },
  });

