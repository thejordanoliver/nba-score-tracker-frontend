import Football from "assets/icons8/Football.png";
import FootballLight from "assets/icons8/FootballLight.png";
import { getNFLTeamsLogo, getTeamName } from "constants/teamsNFL";
import { useRouter } from "expo-router";
import { useNFLGameBroadcasts } from "hooks/NFLHooks/useNFLGameBroadcasts";
import { useNFLGamePossession } from "hooks/NFLHooks/useNFLGamePossession";
import { useNFLTeamRecord } from "hooks/NFLHooks/useNFLTeamRecord";
import { memo, useMemo } from "react";
import {
  Image,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { getStyles } from "styles/GameCard.styles";

type Props = {
  game: any; // TODO: replace with proper type
  isDark?: boolean;
};

function NFLGameCard({ game, isDark }: Props) {
  const colorScheme = useColorScheme();
  const dark = isDark ?? colorScheme === "dark";
  const styles = getStyles(dark);
  const router = useRouter();

  const homeId = game?.teams?.home?.id;
  const awayId = game?.teams?.away?.id;

  // Compute game date
  const gameDate = game?.game?.date?.timestamp
    ? new Date(game.game.date.timestamp * 1000)
    : null;
  const gameDateStr = gameDate?.toISOString();

  // Fetch live possession info
  const { possessionTeamId, displayClock } = useNFLGamePossession(
    getTeamName(homeId),
    getTeamName(awayId),
    gameDateStr
  );

  const gameId = game?.game?.id;

  // ✅ Fetch dynamic records for both teams (now from team endpoint)
  const { record: awayRecord } = useNFLTeamRecord(awayId);
  const { record: homeRecord } = useNFLTeamRecord(homeId);

  // Determine which team has possession

  const awayTeam = useMemo(
    () => ({
      logo: getNFLTeamsLogo(awayId, dark),
      name: getTeamName(awayId),
      record: awayRecord.overall ?? "0-0",
      id: awayId,
      hasPossession: String(possessionTeamId) === String(awayId),
    }),
    [awayId, awayRecord.overall, dark, possessionTeamId]
  );

  const homeTeam = useMemo(
    () => ({
      logo: getNFLTeamsLogo(homeId, dark),
      name: getTeamName(homeId),
      record: homeRecord.overall ?? "0-0",
      id: homeId,
      hasPossession: String(possessionTeamId) === String(homeId),
    }),
    [homeId, homeRecord.overall, dark, possessionTeamId]
  );

  // Fetch broadcasts
  const { broadcasts } = useNFLGameBroadcasts(
    homeTeam.name,
    awayTeam.name,
    gameDateStr
  );

  const formatQuarter = (short?: string): string => {
    if (!short) return ""; // <--- guard

    const q = short.toLowerCase();

    if (q.includes("1")) return "1st";
    if (q.includes("2")) return "2nd";
    if (q.includes("3")) return "3rd";
    if (q.includes("4")) return "4th";

    if (q.includes("ot")) return "OT"; // handle overtime
    if (q.includes("half")) return "Halftime";
    if (q.includes("end")) return "End";

    return short; // fallback
  };

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
        {/* Away Team */}
        <View style={styles.teamSection}>
          {/* Possession football on inner side (left for away) */}
          {awayTeam.hasPossession && (
            <Image
              source={dark ? FootballLight : Football}
              style={{
                width: 28,
                height: 28,
                resizeMode: "contain",
                position: "absolute",
                right: -80, // inner side
                top: 20, // center vertically aligned with logo
              }}
            />
          )}
          <Image source={awayTeam.logo} style={styles.logo} />
          <Text style={styles.teamName}>{awayTeam.name}</Text>
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
        {/* Game Info */}
        <View style={styles.info}>
          {status.isScheduled && (
            <>
              <Text style={styles.date}>{formattedDate}</Text>
              <Text style={styles.time}>{formattedTime}</Text>
            </>
          )}
          {status.isLive && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Text style={styles.date}>{formatQuarter(status.short)}</Text>
                <View
                  style={{
                    height: 14,
                    width: 1,
                    backgroundColor: isDark
                      ? "rgba(255,255,255, 1)"
                      : "rgba(0, 0, 0, .5)",
                  }}
                />
                <Text style={styles.clock}>
                  {displayClock ?? status.timer ?? ""}
                </Text>
              </View>
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
            </>
          )}

          {status.isHalftime && (
            <>
              <Text style={styles.date}>{status.long}</Text>
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
            </>
          )}
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
        </View>

        {/* Home record / score */}
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

        {/* Home Team */}
        <View style={styles.teamSection}>
          {/* Possession football on inner side (right for home) */}
          {homeTeam.hasPossession && (
            <Image
              source={dark ? FootballLight : Football}
              style={{
                width: 28,
                height: 28,
                resizeMode: "contain",
                position: "absolute",
                left: -80, // inner side
                top: 20, // center vertically aligned with logo
              }}
            />
          )}
          <Image source={homeTeam.logo} style={styles.logo} />
          <Text style={styles.teamName}>{homeTeam.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(NFLGameCard);
