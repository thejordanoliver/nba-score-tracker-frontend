//./NFL/GamePreview/NFLGamePreviewModal.tsx
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { TeamLocationSection } from "components/GameDetails";
import LineScore from "components/GameDetails/LineScore";
import Weather from "components/GameDetails/Weather";
import { NFLGameCenterInfo } from "components/NFL/GamePreview/GameCenterInfo";
import { arenaImages } from "constants/teams";
import { neutralStadiums, stadiumImages, teams } from "constants/teamsNFL";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useNFLGamePossession } from "hooks/NFLHooks/useNFLGamePossession";
import { useNFLGameOfficialsAndInjuries } from "hooks/NFLHooks/useNFLOfficials";
import { useNFLTeamRecord } from "hooks/NFLHooks/useNFLTeamRecord";
import { useWeatherForecast } from "hooks/useWeather";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { Game } from "types/nfl";
import NFLGameLeaders from "../GameDetails/NFLGameLeaders";
import NFLInjuries from "../GameDetails/NFLInjuries";
import NFLOfficials from "../GameDetails/NFLOfficials";
import NFLTeamDrives from "../GameDetails/NFLTeamDrives";
import TeamInfo from "./TeamInfo";

type Props = {
  game: Game; // ✅ normalized type, consistent with NBA + Summer League
  visible: boolean;
  onClose: () => void;
};

export default function NFLGamePreviewModal({ game, visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const sheetRef = useRef<BottomSheetModal>(null);

  const gameInfo = game.game;
  const home = game.teams.home;
  const away = game.teams.away;
  const scores = game.scores;

  // Ensure timestamp is a number
  const timestampNum = Number(gameInfo.date.timestamp);
  const apiDateStr = new Date(timestampNum * 1000).toISOString().split("T")[0]; // ✅ for API hooks
  const displayDateStr = new Date(timestampNum * 1000).toLocaleDateString(
    "en-us",
    {
      month: "numeric",
      day: "numeric",
    }
  ); // ✅ for UI
  const displayTimeStr = new Date(timestampNum * 1000).toLocaleTimeString(
    "en-us",
    {
      hour: "numeric",
      minute: "numeric",
    }
  );
  const isSuperBowl = gameInfo.week?.includes("Super Bowl"); // ✅ adjust based on your API
  const playoffKeywords = [
    "Super Bowl",
    "Wild Card",
    "Divisional Round",
    "Conference Championship",
  ];
  const isPlayoff = playoffKeywords.some((keyword) =>
    gameInfo.week?.includes(keyword)
  );

  // Status mapping
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
    gameInfo.status.short ||
    gameInfo.status.long ||
    ""
  ).toUpperCase();
  const gameStatus: GameStatus = statusMap[rawStatus] ?? "Scheduled";

  // Linescore
  const linescore = useMemo(() => {
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

  const homeTeamData = teams.find((t) => t.id === home.id) ?? home;
  const awayTeamData = teams.find((t) => t.id === away.id) ?? away;

  // Weather
  const isNeutralSite =
    gameInfo.venue?.name &&
    ![homeTeamData?.stadium, awayTeamData?.stadium].includes(
      gameInfo.venue?.name ?? ""
    );

  const stadiumData = isNeutralSite
    ? neutralStadiums[gameInfo.venue?.name ?? ""]
    : homeTeamData;

  const lat = isNeutralSite
    ? neutralStadiums[gameInfo.venue?.name ?? ""]?.latitude ?? null
    : home.latitude;
  const lon = isNeutralSite
    ? neutralStadiums[gameInfo.venue?.name ?? ""]?.longitude ?? null
    : home.longitude;

  const { weather } = useWeatherForecast(
    lat,
    lon,
    apiDateStr,
    stadiumData?.city ?? ""
  );

  const displayWeather = weather
    ? { ...weather, cityName: stadiumData?.city ?? "Unknown" }
    : null;

  // Snap points
  const snapPoints = useMemo(() => ["40%", "60%", "80%", "94%"], []);

  // Modal open/close
  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  // Colors for NFLGameCenterInfo
  const colorsRecord = useMemo(
    () => ({
      text: "",
      record: "",
      score: "",
      winnerScore: "",
    }),
    []
  );

  // Records
  const { record: awayRecord } = useNFLTeamRecord(String(awayTeamData.id));
  const { record: homeRecord } = useNFLTeamRecord(String(homeTeamData.id));

  // Officials & Injuries
  const { officials, injuries, previousDrives, currentDrives } =
    useNFLGameOfficialsAndInjuries(
      homeTeamData.name ?? "",
      awayTeamData.name ?? "",
      gameInfo?.date?.timestamp
        ? new Date(gameInfo.date.timestamp * 1000).toISOString()
        : ""
    );

  const formatPeriod = (raw: string | number | undefined | null) => {
    if (!raw) return "";
    const map: Record<string, string> = {
      Q1: "1st",
      Q2: "2nd",
      Q3: "3rd",
      Q4: "4th",
      OT: "OT",
      HT: "Halftime",
      FT: "Final",
    };

    // If it matches keys (Q1..OT) use map
    if (typeof raw === "string" && map[raw]) {
      return map[raw];
    }

    // If it’s a number, format with ordinal suffix
    if (typeof raw === "number") {
      const suffix =
        raw === 1 ? "st" : raw === 2 ? "nd" : raw === 3 ? "rd" : "th";
      return `${raw}${suffix}`;
    }

    return String(raw);
  };

  const isLive =
    gameStatus === "In Progress" ||
    gameStatus === "Halftime" ||
    gameStatus === "Delayed";

  const possessionData = isLive
    ? useNFLGamePossession(
        homeTeamData.name ?? "",
        awayTeamData?.name ?? "",
        apiDateStr
      )
    : {
        possessionTeamId: undefined,
        shortDownDistanceText: "",
        displayClock: gameInfo?.status?.timer ?? "",
        period: gameInfo?.status?.short ?? "",
        homeTimeouts: 0,
        awayTimeouts: 0,
        loading: false,
      };

  const {
    possessionTeamId,
    shortDownDistanceText,
    displayClock,
    period,
    homeTimeouts,
    awayTimeouts,
    loading: possessionLoading,
  } = possessionData;

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      onDismiss={onClose}
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
        height: 40,
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
          flex: 1,
          overflow: "hidden",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        {isSuperBowl ? (
          <>
            <LinearGradient
              colors={["#DFBD69", "#CDA765"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]
                  : ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, .8)"]
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
                padding: 12,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 40,
              }}
            >
              {/* Teams + Center Info */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <TeamInfo
                  team={awayTeamData}
                  teamName={awayTeamData.name ?? "Away"}
                  score={scores?.away?.total ?? 0}
                  opponentScore={scores?.home?.total ?? 0} // 👈 add this
                  record={awayRecord?.overall ?? "0-0"}
                  isDark={isDark}
                  isGameOver={
                    gameStatus === "Final" ||
                    gameStatus === "Canceled" ||
                    gameStatus === "Postponed"
                  }
                  hasStarted={gameStatus !== "Scheduled"}
                  possessionTeamId={
                    possessionTeamId !== undefined
                      ? String(possessionTeamId)
                      : undefined
                  }
                  side="away"
                  timeouts={awayTimeouts ?? 0} // ✅ fallback to 0
                />

                <NFLGameCenterInfo
                  isPlayoff={true}
                  week={`${gameInfo.week} LX`}
                  status={gameStatus}
                  date={displayDateStr}
                  time={displayTimeStr}
                  period={formatPeriod(period ?? gameInfo.status.short ?? "")}
                  clock={displayClock ?? gameInfo?.status?.timer ?? ""} // ✅ main clock: displayClock, fallback: timer
                  isDark={isDark}
                  homeTeam={homeTeamData} // ✅ must have .code
                  awayTeam={awayTeamData} // ✅ must have .code
                  colors={colorsRecord}
                  lighter
                  apiDate={apiDateStr}
                  downAndDistance={shortDownDistanceText ?? ""} // 👈 use real data
                />

                <TeamInfo
                  team={homeTeamData}
                  teamName={homeTeamData.name ?? "Home"}
                  score={scores?.home?.total ?? 0}
                  opponentScore={scores?.away?.total ?? 0} // 👈 add this
                  record={homeRecord?.overall ?? "0-0"}
                  isDark={isDark}
                  isGameOver={
                    gameStatus === "Final" ||
                    gameStatus === "Canceled" ||
                    gameStatus === "Postponed"
                  }
                  hasStarted={gameStatus !== "Scheduled"}
                  possessionTeamId={
                    possessionTeamId !== undefined
                      ? String(possessionTeamId)
                      : undefined
                  }
                  side="home"
                  timeouts={homeTimeouts ?? 0}
                />
              </View>

              {/* Scrollable Details */}
              <BottomSheetScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                style={{ flex: 1 }}
              >
                <View style={{ gap: 20 }}>
                  <LineScore
                    linescore={linescore}
                    homeCode={homeTeamData.code ?? "HOM"}
                    awayCode={awayTeamData.code ?? "AWY"}
                    lighter
                  />

             
                  {homeTeamData &&
                    awayTeamData &&
                    gameStatus !== "Scheduled" && (
                      <NFLGameLeaders
                        gameId={String(gameInfo.id)}
                        homeTeamId={String(homeTeamData.id)}
                        awayTeamId={String(awayTeamData.id)}
                        lighter
                      />
                    )}

                  <NFLTeamDrives
                    previousDrives={previousDrives ?? []}
                    currentDrives={currentDrives ?? []}
                    awayTeamAbbr={awayTeamData?.code} // 👈 use getTeamInfo result
                    homeTeamAbbr={homeTeamData?.code} // 👈 use getTeamInfo result
                    lighter
                  />
                  
                  <NFLInjuries
                    injuries={injuries}
                    loading={false}
                    error={null}
                    awayTeamAbbr={awayTeamData.code}
                    homeTeamAbbr={homeTeamData.code}
                    lighter
                  />
                  {gameStatus !== "Scheduled" && (
                  <NFLOfficials
                    officials={officials}
                    loading={false}
                    error={null}
                    lighter
                  />
                   )}
                    {gameStatus !== "Scheduled" && (
                  <TeamLocationSection
                    arenaImage={
                      isNeutralSite
                        ? neutralStadiums[gameInfo?.venue?.name ?? ""]
                            ?.stadiumImage ||
                          stadiumImages[gameInfo?.venue?.name ?? ""] ||
                          arenaImages[gameInfo?.venue?.city ?? ""]
                        : homeTeamData?.stadiumImage
                    }
                    arenaName={
                      isNeutralSite
                        ? gameInfo?.venue?.name ?? ""
                        : homeTeamData?.stadium ?? ""
                    }
                    location={
                      isNeutralSite
                        ? gameInfo?.venue?.city ?? ""
                        : homeTeamData?.location ?? ""
                    }
                    address={
                      isNeutralSite
                        ? neutralStadiums[gameInfo?.venue?.name ?? ""]
                            ?.address ?? ""
                        : homeTeamData?.address ?? ""
                    }
                    arenaCapacity={
                      isNeutralSite
                        ? neutralStadiums[gameInfo?.venue?.name ?? ""]
                            ?.stadiumCapacity ?? ""
                        : homeTeamData?.stadiumCapacity ?? ""
                    }
                    loading={false}
                    error={null}
                    lighter
                  />  
                   )}
                  {gameStatus !== "Scheduled" && (
                  <Weather
                    weather={displayWeather}
                    address={stadiumData?.city ?? ""}
                    loading={false}
                    error={null}
                    lighter
                  />
                  )}
                </View>
              </BottomSheetScrollView>
            </BlurView>
          </>
        ) : (
          <>
            <LinearGradient
              colors={[
                awayTeamData.color ?? "#888",
                homeTeamData.color ?? "#888",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]
                  : ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, .8)"]
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
                padding: 12,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingTop: 40,
              }}
            >
              {/* Teams + Center Info */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <TeamInfo
                  team={awayTeamData}
                  teamName={awayTeamData.name ?? "Away"}
                  score={scores?.away?.total ?? 0}
                  opponentScore={scores?.home?.total ?? 0} // 👈 add this
                  record={awayRecord?.overall ?? "0-0"}
                  isDark={isDark}
                  isGameOver={
                    gameStatus === "Final" ||
                    gameStatus === "Canceled" ||
                    gameStatus === "Postponed"
                  }
                  hasStarted={gameStatus !== "Scheduled"}
                  possessionTeamId={
                    possessionTeamId !== undefined
                      ? String(possessionTeamId)
                      : undefined
                  }
                  side="away"
                  timeouts={awayTimeouts ?? 0} // ✅ fallback to 0
                />

                <NFLGameCenterInfo
                  isPlayoff={isPlayoff}
                  week={gameInfo.week}
                  status={gameStatus}
                  date={displayDateStr}
                  time={displayTimeStr}
                  period={formatPeriod(period ?? gameInfo.status.short ?? "")}
                  clock={displayClock ?? gameInfo?.status?.timer ?? ""}
                  isDark={isDark}
                  homeTeam={homeTeamData}
                  awayTeam={awayTeamData}
                  colors={colorsRecord}
                  lighter
                  apiDate={apiDateStr}
                  downAndDistance={shortDownDistanceText ?? ""}
                />

                <TeamInfo
                  team={homeTeamData}
                  teamName={homeTeamData.name ?? "Home"}
                  score={scores?.home?.total ?? 0}
                  opponentScore={scores?.away?.total ?? 0} // 👈 add this
                  record={homeRecord?.overall ?? "0-0"}
                  isDark={isDark}
                  isGameOver={
                    gameStatus === "Final" ||
                    gameStatus === "Canceled" ||
                    gameStatus === "Postponed"
                  }
                  hasStarted={gameStatus !== "Scheduled"}
                  possessionTeamId={
                    possessionTeamId !== undefined
                      ? String(possessionTeamId)
                      : undefined
                  }
                  side="home"
                  timeouts={homeTimeouts ?? 0}
                />
              </View>

              {/* Scrollable Details */}
              <BottomSheetScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                style={{ flex: 1 }}
              >
                <View style={{ gap: 20 }}>
                  <LineScore
                    linescore={linescore}
                    homeCode={homeTeamData.code ?? "HOM"}
                    awayCode={awayTeamData.code ?? "AWY"}
                    lighter
                  />

                  {homeTeamData &&
                    awayTeamData &&
                    gameStatus !== "Scheduled" && (
                      <NFLGameLeaders
                        gameId={String(gameInfo.id)}
                        homeTeamId={String(homeTeamData.id)}
                        awayTeamId={String(awayTeamData.id)}
                        lighter
                      />
                    )}

                  <NFLTeamDrives
                    previousDrives={previousDrives ?? []}
                    currentDrives={currentDrives ?? []}
                    awayTeamAbbr={awayTeamData?.code} // 👈 use getTeamInfo result
                    homeTeamAbbr={homeTeamData?.code} // 👈 use getTeamInfo result
                    lighter
                  />
                  <NFLInjuries
                    injuries={injuries}
                    loading={false}
                    error={null}
                    awayTeamAbbr={awayTeamData.code}
                    homeTeamAbbr={homeTeamData.code}
                    lighter
                  />
                  {gameStatus !== "Scheduled" && (
                    <NFLOfficials
                      officials={officials}
                      loading={false}
                      error={null}
                      lighter
                    />
                  )}
                  
                    <TeamLocationSection
                      arenaImage={
                        isNeutralSite
                          ? neutralStadiums[gameInfo?.venue?.name ?? ""]
                              ?.stadiumImage ||
                            stadiumImages[gameInfo?.venue?.name ?? ""] ||
                            arenaImages[gameInfo?.venue?.city ?? ""]
                          : homeTeamData?.stadiumImage
                      }
                      arenaName={
                        isNeutralSite
                          ? gameInfo?.venue?.name ?? ""
                          : homeTeamData?.stadium ?? ""
                      }
                      location={
                        isNeutralSite
                          ? gameInfo?.venue?.city ?? ""
                          : homeTeamData?.location ?? ""
                      }
                      address={
                        isNeutralSite
                          ? neutralStadiums[gameInfo?.venue?.name ?? ""]
                              ?.address ?? ""
                          : homeTeamData?.address ?? ""
                      }
                      arenaCapacity={
                        isNeutralSite
                          ? neutralStadiums[gameInfo?.venue?.name ?? ""]
                              ?.stadiumCapacity ?? ""
                          : homeTeamData?.stadiumCapacity ?? ""
                      }
                      loading={false}
                      error={null}
                      lighter
                    />
                  
              
                    <Weather
                      weather={displayWeather}
                      address={stadiumData?.city ?? ""}
                      loading={false}
                      error={null}
                      lighter
                    />
               
                </View>
              </BottomSheetScrollView>
            </BlurView>
          </>
        )}
      </View>
    </BottomSheetModal>
  );
}
