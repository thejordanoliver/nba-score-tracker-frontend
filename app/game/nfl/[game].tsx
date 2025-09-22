import { useNavigation } from "@react-navigation/native";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import FloatingChatButton from "components/FloatingButton";
import { LineScore, TeamLocationSection } from "components/GameDetails";
import Weather from "components/GameDetails/Weather";
import { NFLGameCenterInfo } from "components/NFL/GameDetails/GameInfo";
import NFLGameLeaders from "components/NFL/GameDetails/NFLGameLeaders";
import NFLGameTeamStats from "components/NFL/GameDetails/NFLGameTeamStats";
import NFLInjuries from "components/NFL/GameDetails/NFLInjuries";
import NFLOfficials from "components/NFL/GameDetails/NFLOfficials";
import NFLTeamDrives from "components/NFL/GameDetails/NFLTeamDrives";
import { NFLTeamRow } from "components/NFL/GameDetails/NFLTeamRow";
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
    try {
      const data = JSON.parse(params.game as string);
      if (!data?.game?.id) return;
      setParsedGame(data);
    } catch (e) {
      console.warn("Failed to parse game:", params.game);
    }
  }, [params?.game]);

  const { stats } = useNFLTeamStats(parsedGame?.game?.id);

  const { game: gameInfo, teams: teamsData, scores } = parsedGame || {};
  const home = teamsData?.home;
  const away = teamsData?.away;

  const homeTeam = home ? getTeamInfo(home.id) : null;
  const awayTeam = away ? getTeamInfo(away.id) : null;

  const homeTeamNickname = getTeamInfo(parsedGame?.teams.home.id)?.nickname;
  const awayTeamNickname = getTeamInfo(parsedGame?.teams.away.id)?.nickname;

  const isNeutralSite =
    gameInfo?.venue?.name &&
    ![homeTeam?.stadium, awayTeam?.stadium].includes(gameInfo.venue.name);

  const headerTitle = useMemo(() => {
    if (!parsedGame) return "";
    const homeTeam = getTeamInfo(parsedGame.teams.home.id);
    const awayTeam = getTeamInfo(parsedGame.teams.away.id);
    if (!homeTeam || !awayTeam) return "";

    const separator = isNeutralSite ? " vs " : " @ ";
    return `${awayTeam.code}${separator}${homeTeam.code}`;
  }, [parsedGame, isNeutralSite]);

  useLayoutEffect(() => {
    if (!headerTitle) return;
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          tabName="Game"
          onBack={goBack}
          league="NFL"
          homeTeamCode={homeTeam?.code}
          awayTeamCode={awayTeam?.code}
          isTeamScreen={false}
          isNeutralSite={isNeutralSite} // 👈 add this
        />
      ),
    });
  }, [headerTitle, navigation]);

  const colors = useMemo(
    () => ({
      background: isDark ? "#1d1d1d" : "#ffffff",
      text: isDark ? "#ffffff" : "#000000",
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

  const awayIsWinner =
    gameInfo?.status?.long === "Finished" &&
    (scores?.away?.total ?? 0) > (scores?.home?.total ?? 0);
  const homeIsWinner =
    gameInfo?.status?.long === "Finished" &&
    (scores?.home?.total ?? 0) > (scores?.away?.total ?? 0);

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
    HT: "Halftime",
    FT: "Final",
    AOT: "Final",
    CANC: "Canceled",
    PST: "Postponed",
    DELAYED: "Delayed",
  };

  const rawStatus = (
    gameInfo?.status?.short ||
    gameInfo?.status?.long ||
    ""
  ).toUpperCase();

  const gameStatus: GameStatus = statusMap[rawStatus] ?? "Scheduled";

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

  const {
    possessionTeamId,
    shortDownDistanceText,
    displayClock,
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
              name: getTeamName(away.id, away.nickname),
              logo: getNFLTeamsLogo(away.id, isDark),
              record: awayRecord?.overall ?? "0-0",
            }}
            isDark={isDark}
            isHome={false}
            score={scores?.away?.total}
            isWinner={awayIsWinner}
            colors={colors}
            status={gameStatus}
            possessionTeamId={
              possessionTeamId !== undefined
                ? String(possessionTeamId)
                : undefined
            }
            timeouts={awayTimeouts ?? 0} // ✅ pass awayTimeouts
          />

          <NFLGameCenterInfo
            status={gameStatus}
            date={formattedDate}
            time={formattedTime}
            period={gameInfo?.status?.short}
            clock={displayClock ?? gameInfo?.status?.timer ?? ""}
            colors={colors}
            isDark={isDark}
            playoffInfo={gameInfo?.playoffInfo}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            downAndDistance={shortDownDistanceText ?? ""} // 👈 use real data
          />

          <NFLTeamRow
            team={{
              id: String(homeTeam.id),
              name: getTeamName(home.id, home.nickname),
              logo: getNFLTeamsLogo(home.id, isDark),
              record: homeRecord?.overall ?? "0-0",
            }}
            isDark={isDark}
            isHome
            score={scores?.home?.total}
            isWinner={homeIsWinner}
            colors={colors}
            status={gameStatus}
            possessionTeamId={
              possessionTeamId !== undefined
                ? String(possessionTeamId)
                : undefined
            }
            timeouts={homeTimeouts ?? 0} // ✅ pass homeTimeouts
          />
        </View>

        {/* Lazy-loaded Section */}
        {showDetails && (
          <View style={{ gap: 20, marginTop: 20 }}>
            <LineScore
              linescore={linescore}
              homeCode={homeTeam?.code ?? ""}
              awayCode={awayTeam?.code ?? ""}
            />

            <NFLGameLeaders
              gameId={String(parsedGame.game.id)}
              homeTeamId={String(homeTeam.id)}
              awayTeamId={String(awayTeam.id)}
            />

            <NFLTeamDrives
              previousDrives={previousDrives ?? []}
              currentDrives={currentDrives ?? []}
              awayTeamAbbr={awayTeam?.code} // 👈 use getTeamInfo result
              homeTeamAbbr={homeTeam?.code} // 👈 use getTeamInfo result
            />

            {stats && <NFLGameTeamStats stats={stats} />}

            <NFLInjuries
              injuries={injuries}
              loading={false}
              error={null}
              awayTeamAbbr={awayTeam.code}
              homeTeamAbbr={homeTeam.code}
            />
            <NFLOfficials officials={officials} loading={false} error={null} />

            <TeamLocationSection
              arenaImage={
                isNeutralSite
                  ? stadiumImages[gameInfo?.venue?.name ?? ""] ||
                    arenaImages[gameInfo?.venue?.city ?? ""]
                  : homeTeam?.stadiumImage
              }
              arenaName={
                isNeutralSite
                  ? gameInfo?.venue?.name ?? ""
                  : homeTeam?.stadium ?? ""
              }
              location={
                isNeutralSite
                  ? gameInfo?.venue?.city ?? ""
                  : homeTeam?.location ?? ""
              }
              address={
                isNeutralSite
                  ? neutralStadiums[gameInfo?.venue?.name ?? ""]?.address ?? ""
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

            <Weather
              weather={displayWeather}
              address={stadiumData?.city ?? ""}
              loading={false}
              error={null}
              lighter={false}
            />
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
        <FloatingChatButton gameId={gameInfo.id} openChat={openChat} />
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
