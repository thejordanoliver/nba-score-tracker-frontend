import Football from "assets/icons8/Football.png";
import FootballLight from "assets/icons8/FootballLight.png";
import { getNFLTeamsLogo, getTeamName } from "constants/teamsNFL";
import { LinearGradient } from "expo-linear-gradient";
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
  game: any; // TODO: replace with proper Game type
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
  // --- Determine if Super Bowl ---
  const isSuperBowl =
    game?.game?.week === "Super Bowl" ||
    (gameDate?.getMonth() === 1 && gameDate?.getDate() >= 2); // fallback check for February

  // --- Game status ---
  const status = useMemo(() => {
    const long = game.game.status.long ?? "";
    const short = game.game.status.short?.toLowerCase() ?? "";
    const longLower = long.toLowerCase();

    const wentOT =
      longLower.includes("ot") ||
      longLower.includes("overtime") ||
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

  // --- Team possession ---
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

  // --- Team records ---
  const { record: awayRecord } = useNFLTeamRecord(awayId);
  const { record: homeRecord } = useNFLTeamRecord(homeId);

  // --- Teams with memoization ---
  const awayTeam = useMemo(
    () => ({
      logo: getNFLTeamsLogo(awayId, dark),
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
      name: getTeamName(homeId, "Home"),
      record: homeRecord?.overall ?? "0-0",
      id: homeId,
      hasPossession: String(possessionTeamId) === String(homeId),
    }),
    [homeId, homeRecord?.overall, dark, possessionTeamId]
  );

  // --- Broadcasts ---
  const { broadcasts } = useNFLGameBroadcasts(
    homeTeam.name,
    awayTeam.name,
    gameDateStr
  );

  // --- Format quarter / period ---
  const formatQuarter = (
    short?: string | null,
    long?: string | null
  ): string => {
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

    return val;
  };

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

  // --- Determine winner style ---
  // --- Determine team style (winner/loser, etc.)
  const getTeamStyle = useMemo(
    () =>
      (isHome: boolean): TextStyle => {
        const homeScore = game.scores.home?.total ?? 0;
        const awayScore = game.scores.away?.total ?? 0;
        let isWinner = true;
        if (status.isFinal && homeScore !== awayScore) {
          isWinner = isHome ? homeScore > awayScore : awayScore > homeScore;
        }

        // 🔹 Override to #1d1d1d if Super Bowl
        if (isSuperBowl) {
          return {
            color: "#1d1d1d",
            opacity: isWinner ? 1 : 0.5,
          };
        }

        return {
          color: dark ? "#fff" : "#1d1d1d",
          opacity: isWinner ? 1 : 0.5,
        };
      },
    [dark, status, game.scores, isSuperBowl]
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
      {isSuperBowl ? (
        <LinearGradient
          colors={["#DFBD69", "#CDA765"] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.card}
        >
          {/* Render all card content */}
          <RenderTeamsAndInfo />
        </LinearGradient>
      ) : (
        <View style={styles.card}>
          <RenderTeamsAndInfo />
        </View>
      )}
    </TouchableOpacity>
  );

  function RenderTeamsAndInfo() {
    // --- Render ---
    return (
      <>
        {/* Away Team */}
        <View style={styles.teamSection}>
          {awayTeam.hasPossession && (
            <Image
              source={dark ? FootballLight : Football}
              style={{
                width: 28,
                height: 28,
                resizeMode: "contain",
                position: "absolute",
                right: -80,
                top: 20,
              }}
            />
          )}
          <Image source={awayTeam.logo} style={styles.logo} />
          <Text
            style={[
              styles.teamName,
              isSuperBowl && { color: "#1d1d1d" }, // 🔹 override for Super Bowl
            ]}
          >
            {awayTeam.name}
          </Text>
        </View>

        {/* Away score / record */}
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
          {/* --- Week Label (only postseason rounds) --- */}
          {game?.game?.week &&
            [
              "Wild Card",
              "Divisional Round",
              "Conference Championships",
              "Super Bowl",
            ].includes(game.game.week) && (
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
                <Text
                  style={[
                    styles.seriesStatus,
                    isSuperBowl && { color: "#1d1d1d" },
                    { textAlign: "center", marginBottom: 4 },
                  ]}
                >
                  {game.game.week}
                </Text>
              </View>
            )}

          {status.isScheduled && (
            <>
              <Text style={[styles.date, isSuperBowl && { color: "#1d1d1d" }]}>
                {formattedDate}
              </Text>
              <Text style={[styles.time, isSuperBowl && { color: "#444" }]}>
                {formattedTime}
              </Text>
              {broadcasts.length > 0 && (
                <Text
                  style={[styles.broadcast, isSuperBowl && { color: "#444" }]}
                >
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

          {(status.isLive ||
            status.long.toLowerCase().includes("overtime")) && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Text style={styles.date}>
                  {formatQuarter(status.short, status.long)}
                </Text>
                <View
                  style={{
                    height: 14,
                    width: 1,
                    backgroundColor: dark
                      ? "rgba(255,255,255, 1)"
                      : "rgba(0,0,0,.5)",
                  }}
                />
                <Text style={styles.clock}>
                  {displayClock ?? status.timer ?? ""}
                </Text>
              </View>
              {shortDownDistanceText && (
                <Text style={styles.downDistance}>{shortDownDistanceText}</Text>
              )}
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

        {/* Home score / record */}
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
          {homeTeam.hasPossession && (
            <Image
              source={dark ? FootballLight : Football}
              style={{
                width: 28,
                height: 28,
                resizeMode: "contain",
                position: "absolute",
                left: -80,
                top: 20,
              }}
            />
          )}
          <Image source={homeTeam.logo} style={styles.logo} />
          <Text
            style={[
              styles.teamName,
              isSuperBowl && { color: "#1d1d1d" }, // 🔹 override for Super Bowl
            ]}
          >
            {homeTeam.name}
          </Text>
        </View>
      </>
    );
  }
}

export default memo(NFLGameCard);
