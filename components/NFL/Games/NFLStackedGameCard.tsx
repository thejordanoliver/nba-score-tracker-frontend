import { Fonts } from "constants/fonts";
import {
  getNFLTeamsLogo,
  getTeamAbbreviation,
  getTeamName,
} from "constants/teamsNFL";
import { useNFLGameBroadcasts } from "hooks/NFLHooks/useNFLGameBroadcasts";
import { useNFLTeamRecord } from "hooks/NFLHooks/useNFLTeamRecord";
import { Game } from "types/nfl";
import { useRouter } from "expo-router";
import { memo, useMemo } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type Props = {
  game: any;
  isDark?: boolean;
  broadcasts?: string[];
  loadingBroadcasts?: boolean;
};

function NFLStackedGameCard({ game, isDark }: Props) {
  const colorScheme = useColorScheme();
  const dark = isDark ?? colorScheme === "dark";
  const styles = getStyles(dark);
  const router = useRouter();

  const homeId = String(game?.teams?.home?.id);
  const awayId = String(game?.teams?.away?.id);

  const gameId = game?.game?.id;

  console.log(`Game ID: ${gameId}`);

  // Compute game date
  const gameDate = useMemo(() => {
    return game?.game?.date?.timestamp
      ? new Date(game.game.date.timestamp * 1000)
      : null;
  }, [game?.game?.date?.timestamp]);
  const gameDateStr = gameDate?.toISOString();

  // ✅ Fetch dynamic records for both teams (now from team endpoint)
  const { record: awayRecord } = useNFLTeamRecord(awayId);
  const { record: homeRecord } = useNFLTeamRecord(homeId);

  const awayTeam = useMemo(() => {
    return {
      logo: getNFLTeamsLogo(awayId, dark),
      name: getTeamName(awayId),
      code: getTeamAbbreviation(awayId),
      record: awayRecord.overall ?? "0-0",
    };
  }, [awayId, awayRecord.overall, dark]);

  const homeTeam = useMemo(() => {
    return {
      logo: getNFLTeamsLogo(homeId, dark),
      name: getTeamName(homeId),
      code: getTeamAbbreviation(homeId),
      record: homeRecord.overall ?? "0-0",
    };
  }, [homeId, homeRecord.overall, dark]);

  // Fetch broadcasts
  const { broadcasts } = useNFLGameBroadcasts(
    homeTeam.name,
    awayTeam.name,
    gameDateStr
  );

  const status = useMemo(() => {
    const long = game.game.status.long ?? "";
    const short = game.game.status.short?.toLowerCase() ?? "";
    const longLower = long.toLowerCase();

    const wentOT =
      longLower.includes("ot") ||
      longLower.includes("over time") ||
      short.includes("ot");

    const isFinal =
      long === "Finished" ||
      longLower.includes("final") ||
      longLower.includes("after over") ||
      longLower.includes("aot") ||
      short.includes("ft");

    const live = ![
      "Not Started",
      "Finished",
      "Canceled",
      "Delayed",
      "Postponed",
      "Halftime",
    ].includes(long);

    return {
      isScheduled: long === "Not Started",
      isFinal,
      wentOT,
      isCanceled: long === "Canceled",
      isDelayed: long === "Delayed",
      isPostponed: long === "Postponed",
      isHalftime: long === "Halftime",
      isLive: live && !isFinal,
      short: game.game.status.short,
      long,
      timer: game.game.status.timer,
    };
  }, [game.game.status]);

  const formattedDate = gameDate
    ? gameDate.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })
    : "";

  const formattedTime = gameDate
    ? gameDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const getTeamStyle = useMemo(
    () =>
      (isHome: boolean): TextStyle => {
        const homeScore = game.scores.home?.total ?? 0;
        const awayScore = game.scores.away?.total ?? 0;
        let isWinner = true;

        if (status.isFinal) {
          if (homeScore !== awayScore) {
            isWinner = isHome ? homeScore > awayScore : awayScore > homeScore;
          }
        }

        return {
          color: dark ? "#fff" : "#1d1d1d",
          opacity: isWinner ? 1 : 0.5,
        };
      },
    [dark, status, game.scores]
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/game/nfl/[game]",
          params: { game: JSON.stringify(game) },
        })
      }
    >
      <View style={styles.card}>
        <View style={styles.cardWrapper}>
          {/* Away Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamWrapper}>
              <Image source={awayTeam.logo} style={styles.logo} />
              <Text style={styles.teamName}>{awayTeam.code}</Text>
            </View>

            {/* Away record / score */}
            <Text
              style={[
                status.isScheduled || status.isCanceled || status.isPostponed
                  ? styles.teamRecord
                  : styles.teamScore,
                getTeamStyle(false),
              ]}
            >
              {status.isScheduled || status.isCanceled || status.isPostponed
                ? awayTeam.record
                : game.scores.away?.total}
            </Text>
          </View>

          <View style={styles.teamSection}>
            {/* Home record / score */}
            <View style={styles.teamWrapper}>
              {/* Home Team */}
              <Image source={homeTeam.logo} style={styles.logo} />
              <Text style={styles.teamName}>{homeTeam.code}</Text>
            </View>
            <Text
              style={[
                status.isScheduled || status.isCanceled || status.isPostponed
                  ? styles.teamRecord
                  : styles.teamScore,
                getTeamStyle(true),
              ]}
            >
              {status.isScheduled || status.isCanceled || status.isPostponed
                ? homeTeam.record
                : game.scores.home?.total}
            </Text>
          </View>
        </View>

        {/* Game Info */}
        <View style={styles.info}>
          {status.isScheduled && (
            <>
              <Text style={styles.date}>{formattedDate}</Text>
              <Text
                style={[styles.time, { color: isDark ? "#fff" : "#1d1d1d" }]}
              >
                {formattedTime}
              </Text>
            </>
          )}
          {status.isLive && (
            <>
              <Text style={styles.date}>{status.short}</Text>
              <Text style={styles.clock}>{status.timer}</Text>
            </>
          )}
          {status.isHalftime && <Text style={styles.date}>{status.long}</Text>}
        {status.isFinal && (
            <>
              <Text style={styles.finalText}>
                {status.wentOT ? "Final/OT" : "Final"}
              </Text>
              <Text style={styles.dateFinal}>{formattedDate}</Text>
            </>
          )}

          {status.isCanceled && <Text style={styles.finalText}>Cancelled</Text>}
          {status.isDelayed && <Text style={styles.finalText}>Delayed</Text>}
          {broadcasts.length > 0 && (
            <Text style={styles.broadcast}>
              {broadcasts
                .map((b) =>
                  Array.isArray(b.names)
                    ? b.names.join("/")
                    : b.name || b.shortName || ""
                )
                .filter(Boolean)
                .join("/")}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
export default memo(NFLStackedGameCard);

export const getStyles = (dark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      flex: 1,
      height: 110,
      backgroundColor: dark ? "#2e2e2e" : "#eee",
      justifyContent: "space-between",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 12,
    },
    cardWrapper: {
      flexDirection: "column",
      justifyContent: "center",
      borderRightColor: dark ? "#444" : "#888",
      borderRightWidth: 0.5,
      paddingRight: 12,
      gap: 4,
      flex: 1,
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
      flex: 1,
      paddingLeft: 4,
    },
    logo: {
      width: 28,
      height: 28,
      resizeMode: "contain",
    },
    teamName: {
      fontSize: 18,
      fontFamily: Fonts.OSREGULAR,
      flexShrink: 1,
      color: dark ? "#fff" : "#1d1d1d",
      textAlign: "left",
    },
    teamScore: {
      fontSize: 18,
      fontFamily: Fonts.OSBOLD,
      textAlign: "right",
      color: dark ? "#aaa" : "#888",
    },
    teamRecord: {
      fontSize: 18,
      fontFamily: Fonts.OSBOLD,
      textAlign: "right",
      color: dark ? "#aaa" : "#888",
    },
    info: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 30,
      width: 100,
    },
    finalText: {
      fontFamily: Fonts.OSMEDIUM,
      fontSize: 16,
      color: dark ? "#ff4444" : "#cc0000",
      textAlign: "center",
      width: 80,
    },
    date: {
      fontSize: 12,
      fontFamily: Fonts.OSEXTRALIGHT,
      textAlign: "center",
      color: dark ? "#fff" : "#000",
    },
    dateFinal: {
      fontFamily: Fonts.OSREGULAR,
      color: dark ? "#fff" : "#1d1d1d",
      fontSize: 14,
    },
    time: {
      fontSize: 12,
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
      fontSize: 12,
      fontFamily: Fonts.OSREGULAR,
      textAlign: "center",
      color: dark ? "rgba(255,255,255, .5)" : "rgba(0, 0, 0, 0.5)",
    },
  });
