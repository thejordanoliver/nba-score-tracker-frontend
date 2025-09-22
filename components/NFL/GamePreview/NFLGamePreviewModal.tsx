// components/NFL/Games/NFLGamePreviewModal.tsx
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
import { NFLGame } from "types/nfl";
import NFLGameLeaders from "../GameDetails/NFLGameLeaders";
import NFLInjuries from "../GameDetails/NFLInjuries";
import NFLOfficials from "../GameDetails/NFLOfficials";
import NFLTeamDrives from "../GameDetails/NFLTeamDrives";
import TeamInfo from "./TeamInfo";

type Props = {
  game: NFLGame;
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

  // Determine winner
  const awayIsWinner =
    gameInfo.status.long === "Finished" &&
    (scores.away?.total ?? 0) > (scores.home?.total ?? 0);
  const homeIsWinner =
    gameInfo.status.long === "Finished" &&
    (scores.home?.total ?? 0) > (scores.away?.total ?? 0);

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
      homeTeamData.nickname ?? "",
      awayTeamData.nickname ?? "",
      gameInfo?.date?.timestamp
        ? new Date(gameInfo.date.timestamp * 1000).toISOString()
        : ""
    );

  const {
    possessionTeamId,
    shortDownDistanceText,
    displayClock,
    homeTimeouts,
    awayTimeouts,
    loading: possessionLoading,
  } = useNFLGamePossession(
    homeTeamData.name ?? "",
    awayTeamData?.name ?? "",
    apiDateStr
  );

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
        <LinearGradient
          colors={[awayTeamData.color ?? "#444", homeTeamData.color ?? "#444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]
              : ["rgba(0, 0, 0, 0)", "rgba(255,255,255,0.9)"]
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
              teamName={awayTeamData.nickname}
              score={scores?.away?.total ?? 0}
              record={awayRecord?.overall ?? "0-0"}
              isWinner={awayIsWinner}
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
              status={gameStatus}
              date={displayDateStr}
              time={displayTimeStr}
              period={gameInfo.status.short}
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
              teamName={homeTeamData.nickname}
              score={scores?.home?.total ?? 0}
              record={homeRecord?.overall ?? "0-0"}
              isWinner={homeIsWinner}
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
                homeCode={homeTeamData.code}
                awayCode={awayTeamData.code}
                lighter
              />
              <NFLGameLeaders
                gameId={String(gameInfo.id)}
                homeTeamId={String(homeTeamData.id)}
                awayTeamId={String(awayTeamData.id)}
                lighter
              />

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
              <NFLOfficials
                officials={officials}
                loading={false}
                error={null}
                lighter
              />
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
                    ? neutralStadiums[gameInfo?.venue?.name ?? ""]?.address ??
                      ""
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
      </View>
    </BottomSheetModal>
  );
}
