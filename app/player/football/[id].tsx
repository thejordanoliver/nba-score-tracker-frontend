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

type FootballRouteLeague = "nfl" | "cfb";
type FootballStatsLeague = "NFL" | "CFB";

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

  const rowsToUse = regularSeasonRows.length > 0 ? regularSeasonRows : seasons;

  return [...rowsToUse].sort((a, b) => {
    const seasonCompare = getSeasonNumber(b) - getSeasonNumber(a);

    if (seasonCompare !== 0) {
      return seasonCompare;
    }

    return String(a.teamId).localeCompare(String(b.teamId));
  })[0];
}

function normalizeFootballLeague(league: unknown): FootballRouteLeague {
  return String(league).toLowerCase() === "nfl" ? "nfl" : "cfb";
}

function toStatsLeague(league: FootballRouteLeague): FootballStatsLeague {
  return league === "nfl" ? "NFL" : "CFB";
}

export default function PlayerDetailScreen() {
  const {
    id,
    teamId: routeTeamId,
    league,
  } = useLocalSearchParams<{
    id?: string;
    teamId?: string;
    league?: string;
  }>();

  const { resolvedColorScheme } = usePreferences();

  const isDark = resolvedColorScheme === "dark";

  const global = globalStyles(isDark);

  const navigation = useNavigation();

  const styles = playerScreenStyles;

  /**
   * =========================================
   * REQUESTED PLAYER
   * =========================================
   *
   * This is the league/id that came from the URL.
   *
   * Example:
   *
   * /player/football/4430841?league=cfb
   *
   * may later resolve to NFL.
   */

  const requestedLeague = normalizeFootballLeague(league);

  const requestedStatsLeague = toStatsLeague(requestedLeague);

  const requestedPlayerId = Number(id);

  /**
   * =========================================
   * PLAYER STATS + CANONICAL RESOLUTION
   * =========================================
   *
   * This request happens first because the backend
   * can tell us whether a CFB player should actually
   * resolve to an NFL profile.
   */

  const {
    data,
    collegeData,
    player: statsPlayer,
    resolvedLeague,
    canonicalProfile,
    loading: seasonsLoading,
    error: seasonsError,
  } = usePlayerSeasons(requestedPlayerId, requestedStatsLeague);

  /**
   * =========================================
   * CANONICAL PLAYER ID
   * =========================================
   *
   * Example:
   *
   * requested:
   * CFB Carson Beck
   *
   * resolved:
   * NFL Carson Beck
   */

  const canonicalPlayerId = useMemo(() => {
    const resolvedId =
      canonicalProfile?.playerId ?? statsPlayer?.id ?? requestedPlayerId;

    const parsed = Number(resolvedId);

    return Number.isFinite(parsed) ? parsed : requestedPlayerId;
  }, [canonicalProfile?.playerId, requestedPlayerId, statsPlayer?.id]);

  /**
   * =========================================
   * CANONICAL LEAGUE
   * =========================================
   */

  const canonicalLeague: FootballRouteLeague =
    resolvedLeague === "nfl" ? "nfl" : "cfb";

  const isNFL = canonicalLeague === "nfl";

  const isCFB = canonicalLeague === "cfb";

  /**
   * =========================================
   * CANONICAL PLAYER PROFILE
   * =========================================
   *
   * IMPORTANT:
   *
   * We fetch the player AFTER canonical resolution.
   *
   * That means a player who has become an NFL player
   * will use nfl_players rather than cfb_players.
   */

  const { player, loading, error } = usePlayerById(
    canonicalPlayerId,
    canonicalLeague,
  );

  /**
   * =========================================
   * CURRENT TEAM
   * =========================================
   *
   * Prefer the canonical pro player's current team.
   *
   * Fall back to:
   *
   * 1. stats response team
   * 2. route team ID
   */

  const currentTeamId = useMemo(() => {
    const profileTeamId = player?.team_id;

    if (profileTeamId !== null && profileTeamId !== undefined) {
      return String(profileTeamId);
    }

    if (statsPlayer?.teamId !== null && statsPlayer?.teamId !== undefined) {
      return String(statsPlayer.teamId);
    }

    if (routeTeamId) {
      return String(routeTeamId);
    }

    return "";
  }, [player?.team_id, routeTeamId, statsPlayer?.teamId]);

  /**
   * =========================================
   * TEAM
   * =========================================
   */

  const team = useMemo(() => {
    if (!currentTeamId) {
      return null;
    }

    return isNFL ? getNFLTeam(currentTeamId) : getCFBTeam(currentTeamId);
  }, [currentTeamId, isNFL]);

  const teamColor = team?.color ?? Colors.midTone;

  const teamLogo = useMemo(() => {
    if (!currentTeamId) {
      return undefined;
    }

    return isNFL
      ? getNFLTeamLogo(currentTeamId, true)
      : getCFBTeamLogo(currentTeamId, true);
  }, [currentTeamId, isNFL]);

  /**
   * =========================================
   * LAST GAME
   * =========================================
   *
   * Uses the canonical/current league and team.
   *
   * Carson Beck:
   *
   * CFB route
   * -> resolves NFL
   * -> NFL team latest game
   */

  const {
    game,
    loading: gameLoading,
    error: gameError,
  } = useTeamLatestGame(canonicalLeague, currentTeamId);

  /**
   * =========================================
   * LATEST CURRENT-LEAGUE SEASON
   * =========================================
   *
   * IMPORTANT:
   *
   * Use `data`, NOT `rawSeasons`.
   *
   * data = FootballPlayerSeason[]
   * rawSeasons = ApiSeason[]
   */

  const latestSeason = useMemo(() => {
    return getLatestPlayerSeason(data);
  }, [data]);

  /**
   * =========================================
   * ACTIVE STATUS
   * =========================================
   */

  const isActive = player?.active === true;

  /**
   * =========================================
   * HEADER
   * =========================================
   */

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

  /**
   * =========================================
   * LOADING
   * =========================================
   *
   * Wait for canonical resolution before rendering
   * the profile.
   *
   * This avoids briefly showing the CFB profile
   * before switching to NFL.
   */

  if (seasonsLoading || loading) {
    return (
      <View style={global.emptyContainer}>
        <CustomActivityIndicator />
      </View>
    );
  }

  /**
   * =========================================
   * ERROR
   * =========================================
   */

  if (seasonsError || error) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>
          {seasonsError || error || "Failed to load player"}
        </Text>
      </View>
    );
  }

  /**
   * =========================================
   * PLAYER NOT FOUND
   * =========================================
   */

  if (!player) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>Player not found</Text>
      </View>
    );
  }

  /**
   * =========================================
   * RENDER
   * =========================================
   */

  return (
    <ScrollView contentContainerStyle={styles.contentContainerStyle}>
      {/* =====================================
          CANONICAL PLAYER PROFILE
         ===================================== */}

      <PlayerHeader player={player} isDark={isDark} isCFB={isCFB} />

      {/* =====================================
          CURRENT / PRO SEASON
         ===================================== */}

      <SeasonStatCard
        season={latestSeason}
        loading={seasonsLoading}
        error={seasonsError}
        player={player}
      />

      {/* =====================================
          LATEST GAME

          Only current active players.
         ===================================== */}

      {isActive && currentTeamId ? (
        <LatestGame
          game={game}
          loading={gameLoading}
          error={gameError}
          isDark={isDark}
          league={canonicalLeague}
          isNFL={isNFL}
          isCFB={isCFB}
        />
      ) : null}

      {/* =====================================
          CAREER STATS

          NFL player:
          NFL | College

          CFB-only player:
          College stats only
         ===================================== */}

      <PlayerStatTable
        data={data}
        collegeData={collegeData}
        loading={seasonsLoading}
        error={seasonsError}
        position={player.position}
        league={canonicalLeague}
      />
    </ScrollView>
  );
}
