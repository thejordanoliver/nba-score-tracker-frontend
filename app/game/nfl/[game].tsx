import { useNavigation } from "@react-navigation/native";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import FloatingChatButton from "components/FloatingButton";
import { LineScore, TeamLocationSection } from "components/GameDetails";
import Weather from "components/GameDetails/Weather";
import { NFLGameCenterInfo } from "components/NFL/GameDetails/GameInfo";
import LastPlay from "components/NFL/GameDetails/LastPlay";
import NFLGameLeaders from "components/NFL/GameDetails/NFLGameLeaders";
import NFLGameOddsSection from "components/NFL/GameDetails/NFLGameOddsSection";
import NFLGameTeamStats from "components/NFL/GameDetails/NFLGameTeamStats";
import NFLInjuries from "components/NFL/GameDetails/NFLInjuries";
import NFLOfficials from "components/NFL/GameDetails/NFLOfficials";
import NFLTeamDrives from "components/NFL/GameDetails/NFLTeamDrives";
import { NFLTeamRow } from "components/NFL/GameDetails/NFLTeamRow";
import LastFiveGamesSwitcher from "components/NFL/GameDetails/LastFiveGames";
import { arenaImages } from "constants/teams";
import {
  getNFLTeamsLogo,
  getTeamInfo,
  getTeamName,
  neutralStadiums,
  stadiumImages,
} from "constants/teamsNFL";
import { useLocalSearchParams } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useNFLGamePossession } from "hooks/NFLHooks/useNFLGamePossession";
import { useNFLGameOfficialsAndInjuries } from "hooks/NFLHooks/useNFLOfficials";
import { useLastFiveGames } from "hooks/NFLHooks/useLastFiveGames";

import { useNFLTeamRecord } from "hooks/NFLHooks/useNFLTeamRecord";
import { useNFLTeamStats } from "hooks/NFLHooks/useNFLTeamStats";
import { useWeatherForecast } from "hooks/useWeather";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useChatStore } from "store/chatStore";
import { emptyTeam } from "types/nfl";



export default function NFLGameDetailsScreen() {
  const params = useLocalSearchParams();
  const isDark = useColorScheme() === "dark";
  const navigation = useNavigation();
  const [parsedGame, setParsedGame] = useState<any>(null);
  const { openChat, isOpen: isChatOpen } = useChatStore();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NEW: Lazy load toggle
  const [showDetails, setShowDetails] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setShowDetails(true), 300); // load after 300ms
    return () => clearTimeout(timeout);
  }, []);

  const handleScrollStart = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    setIsScrolling(true);
  };

  const handleScrollEnd = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isChatOpen || isScrolling ? 0 : 1,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isChatOpen, isScrolling]);

  useEffect(() => {
    if (!params?.game) return;
    let data: any = null;

    try {
      if (typeof params.game === "string") {
        data = JSON.parse(params.game);
      } else if (Array.isArray(params.game)) {
        // If router passes an array, use the first element
        data = JSON.parse(params.game[0]);
      }
    } catch (e) {
      console.warn("Failed to parse game:", params.game, e);
    }

    if (!data?.game?.id) {
      console.warn("Game data is missing an ID, showing fallback");
      // provide a fallback object to prevent blank screen
      data = {
        game: {
          id: "0",
          status: { short: "NS", long: "Not Started" },
          week: "",
        },
        teams: {
          home: { id: 0, nickname: "Home" },
          away: { id: 0, nickname: "Away" },
        },
        scores: { home: { total: 0 }, away: { total: 0 } },
      };
    }

    setParsedGame(data);
  }, [params?.game]);

  const { stats } = useNFLTeamStats(parsedGame?.game?.id);

  const { game: gameInfo, teams: teamsData, scores } = parsedGame || {};
  const home = teamsData?.home;
  const away = teamsData?.away;

  const homeTeam = home ? getTeamInfo(home.id) ?? emptyTeam : emptyTeam;
  const awayTeam = away ? getTeamInfo(away.id) ?? emptyTeam : emptyTeam;

  const homeTeamNickname =
    getTeamInfo(parsedGame?.teams?.home?.id ?? 0)?.nickname ?? "Home";
  const awayTeamNickname =
    getTeamInfo(parsedGame?.teams?.away?.id ?? 0)?.nickname ?? "Away";

  const isNeutralSite =
    gameInfo?.venue?.name &&
    ![homeTeam?.stadium, awayTeam?.stadium].includes(gameInfo.venue.name);

  useLayoutEffect(() => {
    const safeHomeCode =
      homeTeam?.code && homeTeam.code !== "UNK" ? homeTeam.code : "HOM";
    const safeAwayCode =
      awayTeam?.code && awayTeam.code !== "UNK" ? awayTeam.code : "AWY";

    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          tabName="Game"
          onBack={goBack}
          league="NFL"
          homeTeamCode={safeHomeCode}
          awayTeamCode={safeAwayCode}
          isTeamScreen={false}
          isNeutralSite={!!isNeutralSite}
        />
      ),
    });
  }, [homeTeam, awayTeam, isNeutralSite, navigation]);

  const colors = useMemo(
    () => ({
      background: isDark ? "#1d1d1d" : "#ffffff",
      text: isDark ? "#ffffff" : "#1d1d1d",
      record: isDark ? "#fff" : "#1d1d1d",
      score: isDark ? "#fff" : "#1d1d1d",
      winnerScore: isDark ? "#fff" : "#000",
      border: isDark ? "#333" : "#ccc",
      secondaryText: isDark ? "#ccc" : "#555",
      finalText: isDark ? "#fff" : "#000",
    }),
    [isDark]
  );

  const { officials, injuries, previousDrives, currentDrives } =
    useNFLGameOfficialsAndInjuries(
      awayTeamNickname ?? "",
      homeTeamNickname ?? "",
      gameInfo?.date?.timestamp
        ? new Date(gameInfo.date.timestamp * 1000).toISOString()
        : ""
    );


  type GameStatus =
    | "Scheduled"
    | "In Progress"
    | "Halftime"
    | "Final"
    | "Canceled"
    | "Postponed"
    | "Delayed";

  const statusMap: Record<string, GameStatus> = {
    NS: "Scheduled",
    Q1: "In Progress",
    Q2: "In Progress",
    Q3: "In Progress",
    Q4: "In Progress",
    OT: "In Progress",
    OVERTIME: "In Progress",
    HT: "Halftime",
    FT: "Final",
    AOT: "Final",
    CANC: "Canceled",
    PST: "Postponed",
    DELAYED: "Delayed",
  };

  const formatPeriod = (raw: string | number | undefined | null) => {
    if (!raw) return "";

    const map: Record<string, string> = {
      Q1: "1st",
      Q2: "2nd",
      Q3: "3rd",
      Q4: "4th",
      OT: "OT",
      OVERTIME: "OT",
      HT: "Halftime",
      FT: "Final",
    };

    if (typeof raw === "string") {
      const normalized = raw.toUpperCase();
      if (map[normalized]) return map[normalized];
    }

    if (typeof raw === "number") {
      if (raw <= 4) {
        const suffix =
          raw === 1 ? "st" : raw === 2 ? "nd" : raw === 3 ? "rd" : "th";
        return `${raw}${suffix}`;
      }
      // Handle OT numbers (5 = OT, 6 = 2OT, 7 = 3OT, etc.)
      const overtimeNumber = raw - 4;
      return overtimeNumber === 1 ? "OT" : `${overtimeNumber}OT`;
    }

    return String(raw);
  };

  const rawStatus = (
    gameInfo?.status?.short ||
    gameInfo?.status?.long ||
    ""
  ).toUpperCase();
  const gameStatus: GameStatus = statusMap[rawStatus] ?? "Scheduled";

  const awayIsWinner =
    gameStatus === "Final" &&
    (scores?.away?.total ?? 0) > (scores?.home?.total ?? 0);

  const homeIsWinner =
    gameStatus === "Final" &&
    (scores?.home?.total ?? 0) > (scores?.away?.total ?? 0);


  const gameDateObj = useMemo(() => {
    if (!gameInfo?.date) return null;
    let raw: string | number | null = null;
    if (typeof gameInfo.date === "object") {
      if (gameInfo.date.timestamp) {
        raw = gameInfo.date.timestamp * 1000;
      } else if (gameInfo.date.date) {
        raw = gameInfo.date.date;
      }
    } else if (typeof gameInfo.date === "string") {
      raw = gameInfo.date;
    }
    const date = raw ? new Date(raw) : null;
    return date && !isNaN(date.getTime()) ? date : null;
  }, [gameInfo?.date]);

  const gameDateStr = gameDateObj?.toISOString() ?? "";

  const { record: awayRecord } = useNFLTeamRecord(away?.id);
  const { record: homeRecord } = useNFLTeamRecord(home?.id);

  const lat = isNeutralSite
    ? neutralStadiums[gameInfo?.venue?.name ?? ""]?.latitude ?? null
    : homeTeam?.latitude ?? null;

  const lon = isNeutralSite
    ? neutralStadiums[gameInfo?.venue?.name ?? ""]?.longitude ?? null
    : homeTeam?.longitude ?? null;

  const stadiumData = isNeutralSite
    ? neutralStadiums[gameInfo?.venue?.name ?? ""]
    : homeTeam;

  const { weather } = useWeatherForecast(
    lat,
    lon,
    gameDateStr,
    stadiumData?.city ?? ""
  );

  const displayWeather = weather
    ? { ...weather, cityName: stadiumData?.city ?? "Unknown" }
    : null;

  const formattedDate = gameDateObj
    ? gameDateObj.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
      })
    : "";

  const formattedTime = gameDateObj
    ? gameDateObj.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  const linescore = useMemo(() => {
    if (!scores) return { home: [], away: [] };
    const homePeriods = [
      scores.home?.quarter_1,
      scores.home?.quarter_2,
      scores.home?.quarter_3,
      scores.home?.quarter_4,
    ];
    const awayPeriods = [
      scores.away?.quarter_1,
      scores.away?.quarter_2,
      scores.away?.quarter_3,
      scores.away?.quarter_4,
    ];
    if (scores.home?.overtime != null) homePeriods.push(scores.home.overtime);
    if (scores.away?.overtime != null) awayPeriods.push(scores.away.overtime);
    return {
      home: homePeriods.map((v) => (v != null ? String(v) : "-")),
      away: awayPeriods.map((v) => (v != null ? String(v) : "-")),
    };
  }, [scores]);

  const homeTeamName = homeTeam?.name ?? ""; // e.g., "Green Bay Packers"
  const awayTeamName = awayTeam?.name ?? ""; // e.g., "Washington Commanders"
    const homeTeamIdNum = Number(homeTeam.id);
  const awayTeamIdNum = Number(awayTeam.id);
  const homeLastGames = useLastFiveGames(homeTeamIdNum);
  const awayLastGames = useLastFiveGames(awayTeamIdNum);
  const {
    possessionTeamId,
    shortDownDistanceText,
    downDistanceText,
    lastPlay,
    displayClock,
    period,
    homeTimeouts,
    awayTimeouts,
    loading: possessionLoading,
  } = useNFLGamePossession(homeTeamName, awayTeamName, gameDateStr);

  if (!parsedGame || !homeTeam || !awayTeam) return <View />;

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 140 }]}
        style={{ backgroundColor: colors.background }}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {/* Teams & Score Section */}
        <View style={[styles.teamsContainer, { borderColor: colors.border }]}>
          <NFLTeamRow
            team={{
              id: String(awayTeam.id),
              name:
                getTeamName(away.id, away.nickname) || away.nickname || "Away",
              logo: getNFLTeamsLogo(away.id, isDark),
              record: awayRecord?.overall ?? "0-0",
            }}
            isDark={isDark}
            isHome={false}
            score={scores?.away?.total}
            opponentScore={scores?.home?.total} // 👈 add this
            isWinner={awayIsWinner}
            colors={colors}
            status={gameStatus}
            possessionTeamId={
              possessionTeamId !== undefined
                ? String(possessionTeamId)
                : undefined
            }
            timeouts={awayTimeouts ?? 0}
          />

          <NFLGameCenterInfo
            status={gameStatus}
            date={formattedDate}
            time={formattedTime}
            period={formatPeriod(period ?? gameInfo?.status?.short ?? "")}
            clock={displayClock ?? gameInfo?.status?.timer ?? ""}
            colors={colors}
            isDark={isDark}
            playoffInfo={gameInfo?.week}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            downAndDistance={shortDownDistanceText ?? ""}
          />

          <NFLTeamRow
            team={{
              id: String(homeTeam.id),
              name:
                getTeamName(home.id, home.nickname) || home.nickname || "Home",
              logo: getNFLTeamsLogo(home.id, isDark),
              record: homeRecord?.overall ?? "0-0",
            }}
            isDark={isDark}
            isHome
            score={scores?.home?.total}
            opponentScore={scores?.away?.total}
            isWinner={homeIsWinner}
            colors={colors}
            status={gameStatus}
            possessionTeamId={
              possessionTeamId !== undefined
                ? String(possessionTeamId)
                : undefined
            }
            timeouts={homeTimeouts ?? 0}
          />
        </View>

        {/* Lazy-loaded Section */}
        {showDetails && (
          <View style={{ gap: 20, marginTop: 20 }}>
            {/* Last Play Section */}
            <LastPlay lastPlay={lastPlay} isDark={isDark} />

            <LineScore
              linescore={linescore}
              homeCode={
                homeTeam?.code && homeTeam.code !== "UNK"
                  ? homeTeam.code
                  : "HOM"
              }
              awayCode={
                awayTeam?.code && awayTeam.code !== "UNK"
                  ? awayTeam.code
                  : "AWY"
              }
            />

            {/* Odds */}
            {homeTeam?.code && awayTeam?.code && gameDateStr ? (
              <NFLGameOddsSection
                date={gameDateStr}
                gameDate={gameDateStr}
                homeCode={homeTeam.code}
                awayCode={awayTeam.code}
              />
            ) : null}

            <NFLTeamDrives
              previousDrives={previousDrives ?? []}
              currentDrives={currentDrives ?? []}
              awayTeamAbbr={awayTeam?.code}
              homeTeamAbbr={homeTeam?.code}
            />

            {/* Game Leaders - only when game is live */}
            {(gameStatus === "In Progress" || gameStatus === "Halftime") && (
              <NFLGameLeaders
                gameId={String(parsedGame.game.id)}
                homeTeamId={String(homeTeam.id)}
                awayTeamId={String(awayTeam.id)}
              />
            )}

            {stats && <NFLGameTeamStats stats={stats} />}


            <LastFiveGamesSwitcher
                          isDark={isDark}
                          home={{
                            teamCode: homeTeam.code,
                            teamLogo: homeTeam.logo,
                            teamLogoLight: homeTeam.logoLight,
                            games: homeLastGames.games,
                          }}
                          away={{
                            teamCode: awayTeam.code,
                            teamLogo: awayTeam.logo,
                            teamLogoLight: awayTeam.logoLight,
                            games: awayLastGames.games,
                          }}
                        />

            <NFLInjuries
              injuries={injuries}
              loading={false}
              error={null}
              awayTeamAbbr={awayTeam.code}
              homeTeamAbbr={homeTeam.code}
            />
            <NFLOfficials officials={officials} loading={false} error={null} />

            {/* Location */}
            {(
              isNeutralSite
                ? gameInfo?.venue?.name || gameInfo?.venue?.city
                : homeTeam?.stadium || homeTeam?.location
            ) ? (
              <TeamLocationSection
                arenaImage={
                  isNeutralSite
                    ? stadiumImages[gameInfo?.venue?.name ?? ""] ||
                      arenaImages[gameInfo?.venue?.city ?? ""]
                    : homeTeam?.stadiumImage
                }
                arenaName={
                  isNeutralSite
                    ? neutralStadiums[gameInfo?.venue?.name ?? ""]?.name ?? ""
                    : homeTeam?.stadium ?? ""
                }
                location={
                  isNeutralSite
                    ? gameInfo?.venue?.city ?? ""
                    : homeTeam?.location ?? ""
                }
                address={
                  isNeutralSite
                    ? neutralStadiums[gameInfo?.venue?.name ?? ""]?.address ??
                      ""
                    : homeTeam?.address ?? ""
                }
                arenaCapacity={
                  isNeutralSite
                    ? neutralStadiums[gameInfo?.venue?.name ?? ""]
                        ?.stadiumCapacity ?? ""
                    : homeTeam?.stadiumCapacity ?? ""
                }
                loading={false}
                error={null}
                lighter={false}
              />
            ) : null}

            {/* Weather */}
            {displayWeather ? (
              <Weather
                weather={displayWeather}
                address={stadiumData?.city ?? ""}
                loading={false}
                error={null}
                lighter={false}
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      <Animated.View
        style={{
          opacity: opacityAnim,
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
        }}
        pointerEvents={isChatOpen ? "none" : "auto"}
      >
        {parsedGame?.game?.id &&
        homeTeam?.id &&
        homeTeam?.id !== 0 &&
        awayTeam?.id &&
        awayTeam?.id !== 0 ? (
          <FloatingChatButton gameId={parsedGame.game.id} openChat={openChat} />
        ) : null}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    paddingBottom: 12,
    position: "relative",
  },
});
