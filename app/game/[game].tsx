import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import FloatingChatButton from "components/FloatingButton";
import {
  BoxScore,
  GameInfo,
  GameLeaders,
  GameTeamStats,
  LastFiveGamesSwitcher,
  LineScore,
  PredictionBar,
  TeamInjuriesTab,
  TeamLocationSection,
  TeamRow,
  Weather,
} from "components/GameDetails";
import GameDetailsSkeleton from "components/GameDetails/GameDetailsSkeleton";
import GameOddsSection from "components/GameDetails/GameOddsSection";
import GameOfficials from "components/GameDetails/GameOfficials";
import GameUniforms from "components/GameDetails/GameUniforms";
import { Fonts } from "constants/fonts";
import { arenaImages, neutralArenas, teams } from "constants/teams";
import { useESPNBroadcasts } from "hooks/useESPNBroadcasts";
import { useGameDetails } from "hooks/useGameDetails";
import { useGameStatistics } from "hooks/useGameStatistics";
import { useLastFiveGames } from "hooks/useLastFiveGames";
import { useFetchPlayoffGames } from "hooks/usePlayoffSeries";
import { useGamePrediction } from "hooks/usePredictions";
import { useWeatherForecast } from "hooks/useWeather";
import { useChatStore } from "store/chatStore";
import { matchBroadcastToGame } from "utils/matchBroadcast";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function GameDetailsScreen() {
  const { game } = useLocalSearchParams();
  const isDark = useColorScheme() === "dark";
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const { openChat, isOpen: isChatOpen } = useChatStore();
  const opacityAnim = useRef(new Animated.Value(isChatOpen ? 0 : 1)).current;
  const isScrollingRef = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScrollStart = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    isScrollingRef.current = true;

    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleScrollEnd = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isScrollingRef.current = false;

      Animated.timing(opacityAnim, {
        toValue: isChatOpen ? 0 : 1,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 1000);
  };

  if (typeof game !== "string") return null;

  let parsedGame: any;
  try {
    parsedGame = JSON.parse(game);
  } catch (e) {
    console.warn("Failed to parse game:", game);
    return null;
  }
  if (!parsedGame?.id) return null;

  const {
    home,
    away,
    date,
    time,
    status,
    homeScore,
    awayScore,
    period,
    clock,
    arena,
    linescore,
    id: gameId,
  } = parsedGame;

  const homeTeamData = teams.find(
    (t) =>
      t.name === home.name || t.code === home.name || t.fullName === home.name
  );
  const awayTeamData = teams.find(
    (t) =>
      t.name === away.name || t.code === away.name || t.fullName === away.name
  );
  if (!homeTeamData || !awayTeamData) return null;

  const homeTeamIdNum = Number(homeTeamData.id);
  const awayTeamIdNum = Number(awayTeamData.id);

  const homeColor = homeTeamData.color || "#007A33";
  const awayColor = awayTeamData.color || "#CE1141";

  const arenaNameFromGame = arena?.name ?? "";
  const arenaCityFromGame = arena?.city ?? "";
  const neutralArenaData = neutralArenas[arenaNameFromGame];

  const cleanedArenaName = arenaNameFromGame.replace(/\s*\(.*?\)/, "").trim();
  const resolvedArenaName = cleanedArenaName || homeTeamData.arenaName;
  const resolvedArenaCity = arenaCityFromGame || homeTeamData.location;
  const resolvedArenaAddress =
    neutralArenaData?.address || homeTeamData.address || "";
  const resolvedArenaCapacity =
    neutralArenaData?.arenaCapacity || homeTeamData.arenaCapacity || "";
  const resolvedArenaImage =
    neutralArenaData?.arenaImage ||
    arenaImages[arenaNameFromGame] ||
    arenaImages[arenaCityFromGame] ||
    arenaImages[homeTeamData.code] ||
    homeTeamData.arenaImage;

  const gameDate = useMemo(
    () => new Date(date).toISOString().split("T")[0],
    [date]
  );
  const awayCode = useMemo(() => awayTeamData.code, [awayTeamData.code]);
  const homeCode = useMemo(() => homeTeamData.code, [homeTeamData.code]);
  const stableGameId = useMemo(() => gameId.toString(), [gameId]);

  const lat =
    neutralArenaData?.latitude ??
    arena?.latitude ??
    homeTeamData.latitude ??
    null;
  const lon =
    neutralArenaData?.longitude ??
    arena?.longitude ??
    homeTeamData.longitude ??
    null;

  const colors = useMemo(
    () => ({
      background: isDark ? "#1d1d1d" : "#ffffff",
      text: isDark ? "#ffffff" : "#000000",
      secondaryText: isDark ? "#aaa" : "#444",
      record: isDark ? "#fff" : "#1d1d1d",
      score: isDark ? "#aaa" : "rgba(0, 0, 0, 0.4)",
      winnerScore: isDark ? "#fff" : "#000",
      live: isDark ? "#0f0" : "#090",
      border: isDark ? "#333" : "#ccc",
      finalText: isDark ? "#ff4c4c" : "#d10000",
    }),
    [isDark]
  );

  const season = 2024;
  const homeLastGames = useLastFiveGames(homeTeamIdNum);
  const awayLastGames = useLastFiveGames(awayTeamIdNum);
  const { data: gameStats, loading: statsLoading } = useGameStatistics(gameId);
  const { games: playoffGames } = useFetchPlayoffGames(
    homeTeamIdNum,
    awayTeamIdNum,
    season
  );
  const {
    data: prediction,
    loading: predictionLoading,
    error: predictionError,
  } = useGamePrediction(homeTeamIdNum, awayTeamIdNum, season);
  const { weather, loading, error } = useWeatherForecast(lat, lon, date);

  const currentPlayoffGame = playoffGames.find((g) => g.id === gameId);
  const awayIsWinner =
    status === "Final" && (awayScore ?? 0) > (homeScore ?? 0);
  const homeIsWinner =
    status === "Final" && (homeScore ?? 0) > (awayScore ?? 0);

  const cleanedArenaNameLower = cleanedArenaName.toLowerCase();
  const homeArenaNameLower = homeTeamData.arenaName.toLowerCase();
  const awayArenaNameLower = awayTeamData.arenaName.toLowerCase();

  const isNeutralSiteByArena =
    cleanedArenaNameLower !== "" &&
    cleanedArenaNameLower !== homeArenaNameLower &&
    cleanedArenaNameLower !== awayArenaNameLower;
  const isHomeSiteByArena = cleanedArenaNameLower === homeArenaNameLower;

  const headerTitle = isNeutralSiteByArena
    ? `${awayTeamData.code} vs ${homeTeamData.code}`
    : isHomeSiteByArena
      ? `${awayTeamData.code} @ ${homeTeamData.code}`
      : `${awayTeamData.code} vs ${homeTeamData.code}`;

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          tabName="Game"
          onBack={goBack}
          homeTeamCode={homeCode}
          awayTeamCode={awayCode}
          isNeutralSite={isNeutralSiteByArena}
        />
      ),
    });
  }, [navigation, headerTitle]);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(timeout);
  }, []);

  const seriesSummary = currentPlayoffGame?.seriesSummary;
  const getGameNumberLabel = () =>
    currentPlayoffGame?.gameNumber
      ? `Game ${currentPlayoffGame.gameNumber}`
      : null;

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
  });

  const { broadcasts } = useESPNBroadcasts();
  const matched = matchBroadcastToGame(
    { date, home: { name: home.name }, away: { name: away.name } },
    broadcasts
  );
  const networkString = matched?.broadcasts
    ?.map((b) => b.network)
    .filter(Boolean)
    .join(", ");

  const { data, detailsLoading, detailsError } = useGameDetails(
    gameDate,
    homeTeamData.name,
    awayTeamData.name
  );

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 140 }]}
        style={{ backgroundColor: colors.background }}
        onScrollBeginDrag={handleScrollStart}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        <View style={[styles.teamsContainer, { borderColor: colors.border }]}>
          <TeamRow
            team={{
              id: awayTeamData.id,
              code: awayTeamData.code,
              name: away.name,
              record: away.record,
              logo:
                isDark && awayTeamData.logoLight
                  ? awayTeamData.logoLight
                  : awayTeamData.logo || require("../../assets/Logos/NBA.png"),
            }}
            isDark={isDark}
            score={awayScore}
            isWinner={awayIsWinner}
            colors={colors}
          />

          <GameInfo
            status={status}
            date={formattedDate}
            time={time}
            clock={clock}
            period={period}
            colors={colors}
            isDark={isDark}
            homeTeam={home.name}
            awayTeam={away.name}
            broadcastNetworks={networkString}
            playoffInfo={[
              getGameNumberLabel() ?? "",
              seriesSummary ?? "",
            ].filter(Boolean)}
          />

          <TeamRow
            team={{
              id: homeTeamData.id,
              code: homeTeamData.code,
              name: home.name,
              record: home.record,
              logo:
                isDark && homeTeamData.logoLight
                  ? homeTeamData.logoLight
                  : homeTeamData.logo || require("../../assets/Logos/NBA.png"),
            }}
            isDark={isDark}
            isHome
            score={homeScore}
            isWinner={homeIsWinner}
            colors={colors}
          />
        </View>

        <View style={{ gap: 20, marginTop: 20 }}>
          {/* {isLoading || detailsLoading ? (
            <GameDetailsSkeleton />
          ) : ( */}
            <>
              {/* --- Odds Section (Upcoming + Historical) --- */}
              {/* <GameOddsSection
                date={date}
                gameDate={gameDate}
                homeCode={homeCode}
                awayCode={awayCode}
                gameId={stableGameId}
              /> */}

              {linescore && (
                <LineScore
                  linescore={linescore}
                  homeCode={homeTeamData.code}
                  awayCode={awayTeamData.code}
                />
              )}

              {/* --- Prediction --- */}
              {prediction && !predictionLoading && !predictionError && (
                <PredictionBar
                  homeWinProbability={prediction.homeWinProbability * 100}
                  awayWinProbability={prediction.awayWinProbability * 100}
                  homeColor={homeColor}
                  awayColor={awayColor}
                  homeSecondaryColor={homeTeamData.secondaryColor}
                  awaySecondaryColor={awayTeamData.secondaryColor}
                  homeTeamId={homeTeamData.id}
                  awayTeamId={awayTeamData.id}
                />
              )}
              {predictionError && (
                <Text style={{ color: "red" }}>{predictionError}</Text>
              )}

              <GameLeaders
                gameId={gameId.toString()}
                awayTeamId={awayTeamIdNum}
                homeTeamId={homeTeamIdNum}
              />

              <BoxScore
                gameId={gameId.toString()}
                homeTeamId={homeTeamIdNum}
                awayTeamId={awayTeamIdNum}
              />
              {!statsLoading && gameStats && (
                <GameTeamStats stats={gameStats} />
              )}

              <GameOfficials officials={data?.officials ?? []} />
              <TeamInjuriesTab injuries={data?.injuries ?? []} />

              <LastFiveGamesSwitcher
                isDark={isDark}
                home={{
                  teamCode: homeTeamData.code,
                  teamLogo: homeTeamData.logo,
                  teamLogoLight: homeTeamData.logoLight,
                  games: homeLastGames.games,
                }}
                away={{
                  teamCode: awayTeamData.code,
                  teamLogo: awayTeamData.logo,
                  teamLogoLight: awayTeamData.logoLight,
                  games: awayLastGames.games,
                }}
              />

              <GameUniforms
                homeTeamId={homeTeamData.id}
                awayTeamId={awayTeamData.id}
              />

              <TeamLocationSection
                arenaImage={resolvedArenaImage}
                arenaName={resolvedArenaName}
                location={resolvedArenaCity}
                address={resolvedArenaAddress}
                arenaCapacity={resolvedArenaCapacity}
                weather={weather}
                loading={loading}
                error={error}
              />
              <Weather
                address={resolvedArenaAddress}
                weather={weather}
                loading={loading}
                error={error}
              />
            </>
          
        </View>
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
        <FloatingChatButton gameId={gameId} openChat={openChat} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    paddingBottom: 60,
  },
  teamsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    paddingBottom: 12,
    position: "relative",
  },
  playoffSummaryContainer: {
    marginHorizontal: 12,
    position: "absolute",
    top: -16,
    borderRadius: 6,
    backgroundColor: "#22222222",
    alignItems: "center",
  },
  playoffSummaryText: {
    fontFamily: Fonts.OSEXTRALIGHT,
    fontSize: 12,
    textAlign: "center",
  },
});
