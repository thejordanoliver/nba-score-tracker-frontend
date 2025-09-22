import { teams } from "constants/teams";
import { teams as nflTeams } from "constants/teamsNFL";
import { useNFLGameOfficialsAndInjuries } from "hooks/NFLHooks/useNFLOfficials";
import { useNFLTeamRecord } from "hooks/NFLHooks/useNFLTeamRecord";
import { useESPNBroadcasts } from "hooks/useESPNBroadcasts";
import { useGameStatistics } from "hooks/useGameStatistics";
import { useSummerLeagueStandings } from "hooks/useSummerLeagueStandings";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { ReactElement, useEffect, useMemo, useRef } from "react";
import { Dimensions, StyleSheet, useColorScheme, View } from "react-native";

import { matchBroadcastToGame } from "utils/matchBroadcast";
import { GameLeaders } from "./GameDetails";
import GameTeamStats from "./GameDetails/GameTeamStats";
import LineScore from "./GameDetails/LineScore";
import CenterInfo from "./GamePreview/CenterInfo";
import TeamInfo from "./GamePreview/TeamInfo";
import NFLGameLeaders from "./NFL/GameDetails/NFLGameLeaders";
import NFLInjuries from "./NFL/GameDetails/NFLInjuries";
import NFLOfficials from "./NFL/GameDetails/NFLOfficials";
import NFLTeamDrives from "./NFL/GameDetails/NFLTeamDrives";

const windowHeight = Dimensions.get("window").height;

type League = "NBA" | "SL" | "NFL";

type Props = {
  league: League;
  game: any;
  visible: boolean;
  onClose: () => void;
};

export default function CombinedGamePreviewModal({
  league,
  game,
  visible,
  onClose,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const sheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ["40%", "60%", "80%", "94%"], []);

  // === Hooks per league ===
  const { broadcasts } = useESPNBroadcasts();
  const { standings } = useSummerLeagueStandings();
  const { data: gameStats, loading: statsLoading } =
    league === "SL" || league === "NBA"
      ? useGameStatistics(game.id)
      : { data: null, loading: false };

  const homeTeam = useMemo(() => {
    if (league === "NFL")
      return (
        nflTeams.find((t) => t.id === game.teams.home.id) ?? game.teams.home
      );
    return teams.find((t) => t.name === game.home?.name) ?? game.home;
  }, [game, league]);

  const awayTeam = useMemo(() => {
    if (league === "NFL")
      return (
        nflTeams.find((t) => t.id === game.teams.away.id) ?? game.teams.away
      );
    return teams.find((t) => t.name === game.away?.name) ?? game.away;
  }, [game, league]);

  // === Records ===
  let homeRecord = "";
  let awayRecord = "";

  if (league === "SL" || league === "NBA") {
    const getRecord = (teamName: string) => {
      if (!standings || !teamName) return "";
      const lower = teamName.toLowerCase().replace(/\s+/g, "");
      for (const [key, value] of standings.entries()) {
        const cleanedKey = key.toLowerCase().replace(/\s+/g, "");
        if (
          cleanedKey === lower ||
          cleanedKey.includes(lower) ||
          lower.includes(cleanedKey)
        ) {
          return value;
        }
      }
      return "";
    };
    homeRecord = getRecord(game.home.name);
    awayRecord = getRecord(game.away.name);
  }

  if (league === "NFL") {
    const { record: homeRec } = useNFLTeamRecord(String(homeTeam.id));
    const { record: awayRec } = useNFLTeamRecord(String(awayTeam.id));
    homeRecord = homeRec?.overall ?? "0-0";
    awayRecord = awayRec?.overall ?? "0-0";
  }

  // === Status & Winners ===
  const isFinal =
    league === "NFL"
      ? game.game.status.long === "Finished"
      : game.status === "Final" || game.status === "Game Finished";
  const isCanceled =
    league === "NFL"
      ? game.game.status.long === "Canceled"
      : game.status === "Canceled";

  const homeWins = isFinal
    ? (league === "NFL" ? game.scores.home?.total : game.homeScore) >
      (league === "NFL" ? game.scores.away?.total : game.awayScore)
    : false;

  const awayWins = isFinal
    ? (league === "NFL" ? game.scores.away?.total : game.awayScore) >
      (league === "NFL" ? game.scores.home?.total : game.homeScore)
    : false;

  // === Center Info ===
  const matchedBroadcast =
    league !== "NFL" ? matchBroadcastToGame(game, broadcasts) : null;
  const broadcastNetworks = matchedBroadcast?.broadcasts
    ?.map((b) => b.network)
    .join(", ");

  // === Colors & Gradient ===
  const getTeamColor = (team: any) => team?.color ?? "#444";
  const homeColor = getTeamColor(homeTeam);
  const awayColor = getTeamColor(awayTeam);

  // === Modal Open/Close ===
  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  // === NFL Specific Data ===
  let linescore = null;
let nflExtras: ReactElement | null = null;

  if (league === "NFL") {
    const homePeriods = [
      game.scores.home?.quarter_1,
      game.scores.home?.quarter_2,
      game.scores.home?.quarter_3,
      game.scores.home?.quarter_4,
    ];
    const awayPeriods = [
      game.scores.away?.quarter_1,
      game.scores.away?.quarter_2,
      game.scores.away?.quarter_3,
      game.scores.away?.quarter_4,
    ];
    if (game.scores.home?.overtime != null)
      homePeriods.push(game.scores.home.overtime);
    if (game.scores.away?.overtime != null)
      awayPeriods.push(game.scores.away.overtime);
    linescore = {
      home: homePeriods.map((v) => (v != null ? String(v) : "-")),
      away: awayPeriods.map((v) => (v != null ? String(v) : "-")),
    };

    const { officials, injuries, previousDrives, currentDrives } =
      useNFLGameOfficialsAndInjuries(
        homeTeam.nickname ?? "",
        awayTeam.nickname ?? "",
        game.game?.date?.timestamp
          ? new Date(game.game.date.timestamp * 1000).toISOString()
          : ""
      );

    nflExtras = (
      <>
        <NFLGameLeaders
          gameId={String(game.game.id)}
          homeTeamId={String(homeTeam.id)}
          awayTeamId={String(awayTeam.id)}
          lighter
        />
        <NFLTeamDrives
          previousDrives={previousDrives ?? []}
          currentDrives={currentDrives ?? []}
          homeTeamAbbr={homeTeam.code}
          awayTeamAbbr={awayTeam.code}
          lighter
        />
        <NFLInjuries
          injuries={injuries}
          loading={false}
          error={null}
          homeTeamAbbr={homeTeam.code}
          awayTeamAbbr={awayTeam.code}
          lighter
        />
        <NFLOfficials
          officials={officials}
          loading={false}
          error={null}
          lighter
        />
      </>
    );
  }

  const dateObj = new Date(
    league === "NFL" ? game.game.date.timestamp * 1000 : game.date
  );
  const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
  const displayTimeStr = dateObj.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

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
          colors={[awayColor, homeColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={
            isDark
              ? ["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]
              : ["rgba(255,255,255,0)", "rgba(255,255,255,0.9)"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <BlurView
          intensity={100}
          tint={
            isDark
              ? "systemUltraThinMaterialDark"
              : "systemUltraThinMaterialLight"
          }
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
              team={awayTeam}
              teamName={awayTeam.name ?? awayTeam.nickname}
              scoreOrRecord={
                league === "NFL"
                  ? game.scores.away?.total
                  : (game.awayScore ?? awayRecord)
              }
              isWinner={awayWins}
              isDark={isDark}
              isGameOver={isFinal || isCanceled}
            />
            <CenterInfo
              isDark={isDark}
              broadcastNetworks={broadcastNetworks}
              period={game.periods?.current ?? game.period ?? ""}
              clock={game.clock ?? ""}
              time={displayTimeStr}
              formattedDate={formattedDate}
              isFinal={isFinal}
              isCanceled={isCanceled}
              showLiveInfo={!isFinal && !isCanceled}
              isNBAFinals={league === "NBA" && game.isNBAFinals}
            />

            <TeamInfo
              team={homeTeam}
              teamName={homeTeam.name ?? homeTeam.nickname}
              scoreOrRecord={
                league === "NFL"
                  ? game.scores.home?.total
                  : (game.homeScore ?? homeRecord)
              }
              isWinner={homeWins}
              isDark={isDark}
              isGameOver={isFinal || isCanceled}
            />
          </View>

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            {linescore && (
              <LineScore
                linescore={linescore}
                homeCode={homeTeam.code}
                awayCode={awayTeam.code}
                lighter
              />
            )}
            {league !== "NFL" && game?.id && (
              <GameLeaders
                gameId={game.id.toString()}
                homeTeamId={homeTeam.id}
                awayTeamId={awayTeam.id}
                lighter
              />
            )}
            {!statsLoading && gameStats && league !== "NFL" && (
              <GameTeamStats stats={gameStats} lighter />
            )}
            {nflExtras}
          </BottomSheetScrollView>
        </BlurView>
      </View>
    </BottomSheetModal>
  );
}