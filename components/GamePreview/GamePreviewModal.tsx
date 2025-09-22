import GameTeamStats from "components/GameDetails/GameTeamStats";
import TeamInjuriesTab from "components/GameDetails/TeamInjuries";
import { Fonts } from "constants/fonts";
import { arenaImages, neutralArenas, teams } from "constants/teams";
import { useESPNBroadcasts } from "hooks/useESPNBroadcasts";
import { useGameDetails } from "hooks/useGameDetails";
import { useGameStatistics } from "hooks/useGameStatistics";
import { useLastFiveGames } from "hooks/useLastFiveGames";
import { useFetchPlayoffGames } from "hooks/usePlayoffSeries";
import { useWeatherForecast } from "hooks/useWeather";
import { Game } from "types/types";
import { matchBroadcastToGame } from "utils/matchBroadcast";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import { Dimensions, StyleSheet, View, useColorScheme } from "react-native";
import { GameLeaders } from "../GameDetails";
import BoxScore from "../GameDetails/BoxScore";
import GameOfficials from "../GameDetails/GameOfficials";
import GameUniforms from "../GameDetails/GameUniforms";
import LastFiveGamesSwitcher from "../GameDetails/LastFiveGames";
import LineScore from "../GameDetails/LineScore";
import TeamLocationSection from "../GameDetails/TeamLocationSection";
import Weather from "../GameDetails/Weather";
import CenterInfo from "./CenterInfo";
import TeamInfo from "./TeamInfo";
type Props = {
  visible: boolean;
  game: Game;
  onClose: () => void;
};

const windowHeight = Dimensions.get("window").height;

export default function GamePreviewModal({ visible, game, onClose }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const sheetRef = useRef<BottomSheetModal>(null);

  const { broadcasts } = useESPNBroadcasts();

  const getTeamData = (name: string) =>
    teams.find(
      (t) =>
        t.name === name ||
        t.code === name ||
        t.fullName.includes(name) ||
        name.includes(t.name)
    );

  const home = getTeamData(game?.home?.name ?? "");
  const away = getTeamData(game?.away?.name ?? "");

  const homeId = Number(home?.id) || 0;
  const awayId = Number(away?.id) || 0;

  const { games: playoffGames } = useFetchPlayoffGames(homeId, awayId, 2025);

  const currentPlayoffGame = useMemo(() => {
    if (!playoffGames || !game) return undefined;
    return playoffGames.find((g) => g.id === game.id);
  }, [playoffGames, game]);
  const seriesSummary = currentPlayoffGame?.seriesSummary;

  const gameNumberLabel = currentPlayoffGame?.gameNumber
    ? `Game ${currentPlayoffGame.gameNumber}`
    : undefined;
  const { data: gameStats, loading: statsLoading } = useGameStatistics(
    game?.id ?? 0
  );

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible]);

  const matchedBroadcast = matchBroadcastToGame(game, broadcasts);
  const broadcastNetworks = matchedBroadcast?.broadcasts
    ?.map((b) => b.network)
    .filter(Boolean)
    .join(", ");

  const arenaNameFromGame = game?.arena?.name ?? "";
  const arenaCityFromGame = game?.arena?.city ?? "";
  const neutralArenaData = neutralArenas[arenaNameFromGame];

  const cleanedArenaName = arenaNameFromGame.replace(/\s*\(.*?\)/, "").trim();
  const resolvedArenaName = cleanedArenaName || home?.arenaName || "";
  const resolvedArenaCity = arenaCityFromGame || home?.location || "";
  const resolvedArenaAddress = neutralArenaData?.address || home?.address || "";
  const resolvedArenaCapacity =
    neutralArenaData?.arenaCapacity || home?.arenaCapacity || "";
  const resolvedArenaImage =
    neutralArenaData?.arenaImage ||
    arenaImages[arenaNameFromGame] ||
    arenaImages[arenaCityFromGame] ||
    arenaImages[home?.code ?? ""] ||
    home?.arenaImage;

  const lat =
    neutralArenaData?.latitude ?? home?.latitude ?? home?.latitude ?? null;
  const lon =
    neutralArenaData?.longitude ?? home?.longitude ?? home?.longitude ?? null;

  const homeRecord = game.home.record ?? "";
  const awayRecord = game.away.record ?? "";

  const getTeamColor = (team?: (typeof teams)[number]) => {
    if (!team) return "#444";

    const { code, color, secondaryColor } = team;

    if (code === "SAS") return secondaryColor || "#fff";

    return color || "#444";
  };

  const homeColor = getTeamColor(home);
  const awayColor = getTeamColor(away);
  const homeLastGames = useLastFiveGames(homeId);
  const awayLastGames = useLastFiveGames(awayId);

  const isCanceled = game.status === "Canceled";
  const isFinal = game.status === "Final";
  const homeWins = isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWins = isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0);
  const isPlayoffs = game.stage === 4 || !!seriesSummary; // adjust logic based on your API

  const winnerStyle = (teamWins: boolean) =>
    teamWins
      ? {
          color: isDark ? "#fff" : "#000",
          fontFamily: Fonts.OSBOLD,
        }
      : {};

  const dateObj = new Date(game.date);
  const gameDate = useMemo(
    () => new Date(game.date).toISOString().split("T")[0],
    [game.date]
  );

  const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
  const isNBAFinals =
    dateObj.getMonth() === 5 &&
    dateObj.getDate() >= 5 &&
    dateObj.getDate() <= 22;
  const { weather, loading, error } = useWeatherForecast(
    lat,
    lon,
    dateObj.toISOString()
  );

  const showLiveInfo = game.status !== "Scheduled" && game.status !== "Final";
  const snapPoints = useMemo(() => ["40%", "60%", "80%", "88%", "94%"], []);
  const homeCode = home?.code ?? game.home.code ?? "";
  const awayCode = away?.code ?? game.away.code ?? "";
  const maxHeight = windowHeight * 0.9;
  const currentPeriodRaw = Number(game.periods?.current ?? game.period);
  const totalPeriodsPlayed =
    game.linescore?.home?.length ??
    game.linescore?.away?.length ??
    currentPeriodRaw;

  const { data, detailsLoading, detailsError } = useGameDetails(
    gameDate,
    game.home.name,
    game.away.name
  );



  return (
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      onDismiss={onClose}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={true}
      enableDynamicSizing={false}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      )}
      handleStyle={{
        backgroundColor: "transparent",
        height: 40, // bigger tap target for drag gesture
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        left: 8,
        right: 8,
        top: 0,
      }}
      handleIndicatorStyle={{
        backgroundColor: "#888",
        width: 36,
        height: 4,
        borderRadius: 2,
      }}
      backgroundStyle={{ backgroundColor: "transparent" }}
    >
      <View
        style={{
          flex: 1, // fill all available height inside bottom sheet
          overflow: "hidden",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        {/* Background gradients */}
        <LinearGradient
          colors={
            isNBAFinals
              ? ["#DFBD69", "#CDA765"]
              : [awayColor, awayColor, homeColor, homeColor]
          }
          locations={isNBAFinals ? undefined : [0, 0.4, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]
              : ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.8)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <BlurView
          intensity={100}
          tint={"systemUltraThinMaterialDark"}
          style={{
            flex: 1,
            paddingHorizontal: 12,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 40,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <TeamInfo
              team={away}
              teamName={game.away.name}
              scoreOrRecord={
                game.status === "Scheduled"
                  ? awayRecord
                  : (game.awayScore ?? "-")
              }
              isWinner={awayWins}
              record={awayRecord} // 👈 added
              isDark={isDark}
              isGameOver
              isScheduled
            />

            <CenterInfo
              isNBAFinals={isNBAFinals}
              isFinal={isFinal}
              isCanceled={isCanceled}
              isHalftime={game.isHalftime ?? false}
              broadcastNetworks={broadcastNetworks}
              showLiveInfo={showLiveInfo}
              period={game.periods?.current ?? 0}
              endOfPeriod={game.periods?.endOfPeriod ?? false}
              totalPeriodsPlayed={totalPeriodsPlayed}
              time={game.time}
              clock={game.clock}
              formattedDate={formattedDate}
              isDark={isDark}
              gameNumberLabel={gameNumberLabel}
              seriesSummary={seriesSummary ?? undefined}
              isPlayoffs={isPlayoffs}
            />

            <TeamInfo
              team={home}
              teamName={game.home.name}
              record={homeRecord} // 👈 added
              scoreOrRecord={
                game.status === "Scheduled"
                  ? homeRecord
                  : (game.homeScore ?? "-")
              }
              isWinner={homeWins}
              isDark={isDark}
              isGameOver
              isScheduled
            />
          </View>

          <View style={{ flex: 1, minHeight: 0 }}>
            <BottomSheetScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 100,
                minHeight: 0,
              }}
              style={{ flexGrow: 0 }}
            >
              {game.linescore && (
                <View style={{ marginBottom: 24 }}>
                  <LineScore
                    linescore={game.linescore}
                    homeCode={homeCode}
                    awayCode={awayCode}
                    lighter
                  />
                </View>
              )}

              {/* GameLeaders only if it has leaders */}
              {game.id && gameStats && gameStats.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <GameLeaders
                    gameId={game.id.toString()}
                    awayTeamId={awayId}
                    homeTeamId={homeId}
                  />
                </View>
              )}

              {/* BoxScore only if it has stats */}
              {game.id && gameStats && gameStats.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <BoxScore
                    gameId={game.id.toString()}
                    homeTeamId={homeId}
                    awayTeamId={awayId}
                  />
                </View>
              )}

              {!statsLoading && gameStats && gameStats.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <GameTeamStats stats={gameStats} />
                </View>
              )}

              {data?.officials && data.officials.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <GameOfficials officials={data.officials} />
                </View>
              )}

              {data?.injuries && data.injuries.length > 0 && (
                <View style={{ marginBottom: 24 }}>
                  <TeamInjuriesTab injuries={data.injuries} lighter />
                </View>
              )}

              {(homeLastGames.games.length > 0 ||
                awayLastGames.games.length > 0) && (
                <View style={{ marginBottom: 24 }}>
                  <LastFiveGamesSwitcher
                    isDark={isDark}
                    lighter
                    home={{
                      teamCode: homeCode,
                      teamLogo: home?.logo,
                      teamLogoLight: home?.logoLight,
                      games: homeLastGames.games,
                    }}
                    away={{
                      teamCode: awayCode,
                      teamLogo: away?.logo,
                      teamLogoLight: away?.logoLight,
                      games: awayLastGames.games,
                    }}
                  />
                </View>
              )}

              {homeId && awayId && (
                <View style={{ marginBottom: 24 }}>
                  <GameUniforms
                    homeTeamId={homeId.toString()}
                    awayTeamId={awayId.toString()}
                    lighter
                  />
                </View>
              )}

              {(resolvedArenaImage || resolvedArenaName) && (
                <View style={{ marginBottom: 24 }}>
                  <TeamLocationSection
                    arenaImage={resolvedArenaImage}
                    arenaName={resolvedArenaName}
                    location={resolvedArenaCity}
                    address={resolvedArenaAddress}
                    arenaCapacity={resolvedArenaCapacity}
                    weather={weather}
                    loading={loading}
                    error={error}
                    lighter
                  />
                </View>
              )}

              {weather && (
                <View style={{ marginBottom: 24 }}>
                  <Weather
                    address={resolvedArenaAddress}
                    weather={weather}
                    loading={loading}
                    lighter
                    error={error}
                  />
                </View>
              )}
            </BottomSheetScrollView>
          </View>
        </BlurView>
      </View>
    </BottomSheetModal>
  );
}
