import { Fonts } from "constants/fonts";
import {
  getNFLTeamsLogo,
  getTeamAbbreviation,
  getTeamName,
} from "constants/teamsNFL";
import { useRouter } from "expo-router";
import { useNFLGameBroadcasts } from "hooks/NFLHooks/useNFLGameBroadcasts";
import { useNFLGamePossession } from "hooks/NFLHooks/useNFLGamePossession";
import { useNFLTeamRecord } from "hooks/NFLHooks/useNFLTeamRecord";
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
  game: any; // TODO: replace with proper type
  isDark?: boolean;
};

function NFLGameSquareCard({ game, isDark }: Props) {
  const colorScheme = useColorScheme();
  const dark = isDark ?? colorScheme === "dark";
  const styles = getStyles(dark);
  const router = useRouter();

  const homeId = String(game?.teams?.home?.id);
  const awayId = String(game?.teams?.away?.id);
  const gameId = game?.game?.id;

  // Compute game date
  const gameDate = useMemo(() => {
    return game?.game?.date?.timestamp
      ? new Date(game.game.date.timestamp * 1000)
      : null;
  }, [game?.game?.date?.timestamp]);
  const gameDateStr = gameDate?.toISOString();

  // ✅ Fetch dynamic records for both teams
  const { record: awayRecord } = useNFLTeamRecord(awayId);
  const { record: homeRecord } = useNFLTeamRecord(homeId);

  // ✅ Status builder with OT handling
  const status = useMemo(() => {
    const long = game.game.status.long ?? "";
    const short = game.game.status.short?.toLowerCase() ?? "";
    const longLower = long.toLowerCase();

    const wentOT =
      longLower.includes("ot") ||
      longLower.includes("over time") ||
      longLower.includes("after over") ||
      longLower.includes("aot") ||
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



    const possession = status.isLive
      ? useNFLGamePossession(
          getTeamName(homeId, "Home"),
          getTeamName(awayId, "Away"),
          gameDateStr
        )
      : {
          possessionTeamId: undefined,
          displayClock: undefined,
          shortDownDistanceText: undefined,
          downDistanceText: undefined,
          period: undefined,
          refresh: () => {},
        };
  
    const { possessionTeamId, displayClock, shortDownDistanceText } = possession;
  

const awayTeam = useMemo(
    () => ({
      logo: getNFLTeamsLogo(awayId, dark),
      code: getTeamAbbreviation(awayId, "AWY"),
      name: getTeamName(awayId, "Away"),
      record: awayRecord?.overall ?? "0-0",
      id: awayId,
      hasPossession: String(possessionTeamId) === String(awayId),
    }),
    [awayId, awayRecord?.overall, dark, possessionTeamId]
  );

  const homeTeam = useMemo(
    () => ({
      logo: getNFLTeamsLogo(homeId, dark),
      code: getTeamAbbreviation(homeId, "HME"),
      name: getTeamName(homeId, "Home"),
      record: homeRecord?.overall ?? "0-0",
      id: homeId,
      hasPossession: String(possessionTeamId) === String(homeId),
    }),
    [homeId, homeRecord?.overall, dark, possessionTeamId]
  );


  // Fetch broadcasts
  const { broadcasts } = useNFLGameBroadcasts(
    homeTeam.name,
    awayTeam.name,
    gameDateStr
  );


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

  // ✅ Quarter formatter with live OT handling
  const formatQuarter = (short?: string | null, long?: string | null): string => {
    const val = short && short.trim() !== "" ? short : long ?? "";
    if (!val) return "";

    const q = val.toLowerCase();

    if (q.includes("1")) return "1st";
    if (q.includes("2")) return "2nd";
    if (q.includes("3")) return "3rd";
    if (q.includes("4")) return "4th";

    if (q.includes("ot") || q.includes("overtime")) return "OT";
    if (q.includes("half")) return "Halftime";
    if (q.includes("end")) return "End";

    const asNumber = Number(val);
    if (!isNaN(asNumber)) {
      if (asNumber === 5) return "OT";
      if (asNumber > 5) return `${asNumber - 4}OT`;
    }

    return val; // fallback
  };

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

          {/* Home Team */}
          <View style={styles.teamSection}>
            <View style={styles.teamWrapper}>
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
                style={[
                  styles.time,
                  {
                    fontFamily: Fonts.OSREGULAR,
                    color: isDark
                      ? "rgba(255,255,255, .5)"
                      : "rgba(0, 0, 0, .5)",
                  },
                ]}
              >
                {formattedTime}
              </Text>
            </>
          )}
          {status.isLive && (
            <>
              <Text style={[styles.date, { fontSize: 14 }]}>
                {formatQuarter(status.short, status.long)}
              </Text>
              <Text style={styles.clock}>{status.timer}</Text>
            </>
          )}
          {status.isHalftime && (
            <Text style={[styles.date, { fontSize: 14 }]}>{status.short}</Text>
          )}
          {status.isFinal && (
            <>
              <Text style={styles.finalText}>
                {status.wentOT ? "F/OT" : "Final"}
              </Text>
              <Text style={styles.dateFinal}>{formattedDate}</Text>
            </>
          )}
          {status.isCanceled && <Text style={styles.finalText}>Cancelled</Text>}
          {status.isDelayed && <Text style={styles.finalText}>Delayed</Text>}
        </View>

        {/* Broadcasts */}
        {broadcasts.length > 0 &&
          (() => {
            const names = broadcasts
              .map((b) =>
                Array.isArray(b.names)
                  ? b.names.join("/")
                  : b.name || b.shortName || ""
              )
              .filter(Boolean);

            let display = "";
            if (names.includes("ESPN") && names.includes("ABC")) {
              display = "ESPN/ABC";
            } else {
              display = names[0];
            }

            return <Text style={styles.broadcast}>{display}</Text>;
          })()}
      </View>
    </TouchableOpacity>
  );
}

export default memo(NFLGameSquareCard);

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
      color: dark ? "#aaa" : "#888",
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
