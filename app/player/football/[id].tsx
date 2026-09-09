import { CustomHeader } from "@/components/CustomHeader";
import LatestGame from "@/components/Sports/Basketball/Player/LatestGame";
import SeasonStatCard from "@/components/Sports/Football/Player/SeasonStatCard";
import { getCFBTeam, getCFBTeamLogo } from "@/constants/teamsCFB";
import {
  FootballPlayerSeason,
  usePlayerSeasons,
} from "@/hooks/FootballHooks/usePlayerSeasons";
import { useTeamLatestGame } from "@/hooks/FootballHooks/useTeamLatestGame";
import { usePlayerById } from "@/hooks/LeagueHooks/usePlayerById";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import PlayerHeader from "components/Sports/Football/Player/PlayerHeader";
import PlayerStatTable from "components/Sports/Football/Player/PlayerStatTable";
import { Colors, globalStyles } from "constants/styles";
import { getNFLTeam, getNFLTeamLogo } from "constants/teamsNFL";
import { usePreferences } from "contexts/PreferencesContext";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useLayoutEffect, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { playerScreenStyles } from "styles/PlayerStyles/PlayerScreenStyles";

function getSeasonNumber(season: FootballPlayerSeason) {
  const rawSeason = season.season ?? season.year ?? season.displaySeason;
  const parsed = Number(rawSeason);

  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const match = String(rawSeason ?? "").match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

function getLatestPlayerSeason(seasons: FootballPlayerSeason[]) {
  if (!seasons.length) {
    return null;
  }

  const regularSeasonRows = seasons.filter(
    (season) => season.seasonType !== "postseason",
  );

  const rowsToUse = regularSeasonRows.length ? regularSeasonRows : seasons;

  return [...rowsToUse].sort((a, b) => {
    const seasonCompare = getSeasonNumber(b) - getSeasonNumber(a);

    if (seasonCompare !== 0) {
      return seasonCompare;
    }

    return String(a.teamId).localeCompare(String(b.teamId));
  })[0];
}

export default function PlayerDetailScreen() {
  const { id, teamId, league } = useLocalSearchParams<{
    id?: string;
    teamId: string;
    league: any;
  }>();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const global = globalStyles(isDark);
  const navigation = useNavigation();
  const isNFL = league === "nfl";
  const isCFB = league === "cfb";
  const styles = playerScreenStyles;
  const playerId = Number(id);
 
  const { player, loading, error } = usePlayerById(playerId, league);
  const isActive = player?.active;
  const team = isNFL ? getNFLTeam(teamId) : getCFBTeam(teamId);
  const teamColor = team?.color ?? Colors.midTone;
  const teamLogo = isNFL
    ? getNFLTeamLogo(teamId, true)
    : getCFBTeamLogo(teamId, true);

  /* ---------------- Last game ---------------- */
  const {
    game,
    loading: gameLoading,
    error: gameError,
  } = useTeamLatestGame(league, teamId);

  const {
    data: seasons,
    loading: seasonsLoading,
    error: seasonsError,
  } = usePlayerSeasons(playerId, league);

  const latestSeason = useMemo(() => {
    return getLatestPlayerSeason(seasons);
  }, [seasons]);

  /* ---------------- Header ---------------- */
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader
          logo={teamLogo}
          teamColor={teamColor}
          onBack={() => navigation.goBack()}
          isTeamScreen
          isPlayerScreen
        />
      ),
    });
  }, [navigation, teamLogo, teamColor]);

  if (loading || !player)
    return (
      <View style={global.emptyContainer}>
        <CustomActivityIndicator />
      </View>
    );

  if (error || !player)
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>{error}</Text>
      </View>
    );

  /* ---------------- Render ---------------- */
  return (
    <ScrollView contentContainerStyle={styles.contentContainerStyle}>
      <PlayerHeader player={player} isDark={isDark} isCFB={isCFB} />

      <SeasonStatCard
        season={latestSeason}
        loading={seasonsLoading}
        error={seasonsError}
        player={player}
      />

      {isActive && (
        <LatestGame
          game={game}
          loading={gameLoading}
          error={gameError}
          isDark={isDark}
          league={league}
          isNFL={isNFL}
          isCFB={isCFB}
        />
      )}
      <PlayerStatTable
        data={seasons}
        loading={seasonsLoading}
        error={seasonsError}
        position={player.position}
        league={league}
      />
    </ScrollView>
  );
}
