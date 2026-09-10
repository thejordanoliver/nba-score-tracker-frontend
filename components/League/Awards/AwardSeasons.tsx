import { Dropdown } from "components/Dropdown";
import { Colors } from "constants/styles";
import { getNBATeamLogo } from "constants/teams";
import { getCBBTeamLogo } from "constants/teamsCBB";
import { getCFBTeamLogo } from "constants/teamsCFB";
import { getMLBTeamLogo } from "constants/teamsMLB";
import { getNFLTeamLogo } from "constants/teamsNFL";
import { getNHLTeamLogo } from "constants/teamsNHL";
import { getWCBBTeamLogo } from "constants/teamsWCBB";
import { getWNBATeamLogo } from "constants/teamsWNBA";
import { usePreferences } from "contexts/PreferencesContext";
import { useAwardSchools } from "hooks/LeagueHooks/useAwardSchools";
import { useAwardSeasons } from "hooks/LeagueHooks/useAwardSeasons";
import { useChampionTeams } from "hooks/LeagueHooks/useChampionTeams";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { awardTableStyles } from "styles/LeagueStyles/AwardTableSyles";
import { AWARD_CONFIG, AwardCategory } from "types/types";
import AwardSchoolsTable from "./AwardSchoolsTable";
import { AwardSeasonsTable } from "./AwardSeasonsTable";
import ChampionsTable from "./ChampionsTable";
import TopThreeTeams from "./TopThreeTeams";
type ViewMode = "champions" | "players" | "teams";

const LEAGUE_CHAMPIONS_TITLE: Partial<Record<string, string>> = {
  cfb: "College Football Champions",
  wnba: "WNBA Champions",
  cbb: "Men's College Basketball Champions",
  wcbb: "Women's College Basketball Champions",
  nba: "NBA Champions",
  nfl: "Super Bowl Champions",
  mlb: "World Series Champions",
  nhl: "Stanley Cup Champions",
};

type Props = {
  league: string;
};

export default function AwardSeasons({ league }: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = useMemo(() => awardTableStyles(isDark), [isDark]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [selectedAward, setSelectedAward] = useState<AwardCategory>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("players");

  const VIEW_MODE_OPTIONS = [
    { label: "Championships", value: "champions" },
    { label: "Players", value: "players" },

    // Only show "Teams" for CFB, CBB, WCBB
    ...(league === "cfb" || league === "cbb" || league === "wcbb"
      ? [{ label: "Teams", value: "teams" }]
      : []),
  ];

  const apiLeague = useMemo(() => {
    switch (league) {
      case "cfb":
        return "cfb";
      case "cbb":
        return "cbb";
      case "wcbb":
        return "wcbb";

      default:
        return undefined;
    }
  }, [league]);

  const { data, loading, error, refetch } = useAwardSeasons({
    league,
  });
  const showAwardTopThree =
    (league === "cfb" || league === "cbb" || league === "wcbb") &&
    viewMode === "teams";
  const {
    data: awardSchools,
    loading: awardSchoolsLoading,
    error: awardSchoolsError,
  } = useAwardSchools({
    league: apiLeague,
    category: selectedAward,
    enabled: showAwardTopThree,
  });

  const dataByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};

    data.forEach((row) => {
      const key = row.award_type;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    });

    return grouped;
  }, [data]);
  /* ------------------------------------------------ */
  /* League → API mapping (FIXED + SAFE)             */
  /* ------------------------------------------------ */

  /* ------------------------------------------------ */
  /* Award Teams Hook                                */
  /* ------------------------------------------------ */

  /* ------------------------------------------------ */
  /* Champion Teams Hook                             */
  /* ------------------------------------------------ */

  const showChampionTopThree = viewMode === "champions";
  const supportsChampionTeams =
    league === "nhl" ||
    league === "mlb" ||
    league === "cfb" ||
    league === "cbb" ||
    league === "wcbb" ||
    league === "wnba" ||
    league === "nba" ||
    league === "nfl";

  const championTeamsResult = useChampionTeams({
    league,
    enabled: supportsChampionTeams && showChampionTopThree,
  });

  const championTeams = supportsChampionTeams ? championTeamsResult.data : [];
  const awards = AWARD_CONFIG[league] ?? [];

  /* ------------------------------------------------ */
  /* Refresh                                          */
  /* ------------------------------------------------ */
  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // This tells child hooks/tables to refresh
      setRefreshSignal((prev) => prev + 1);

      // This refreshes player awards
      await Promise.all([refetch()]);
    } finally {
      setRefreshing(false);
    }
  };
  /* ------------------------------------------------ */
  /* Render                                           */
  /* ------------------------------------------------ */

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={isDark ? Colors.white : Colors.black}
        />
      }
      contentContainerStyle={styles.contentContainerStyle}
    >
      <View style={styles.dropdownRow}>
        {viewMode !== "champions" && awards.length > 0 && (
          <Dropdown
            options={awards.map(({ label, value }) => ({ label, value }))}
            selectedValue={selectedAward}
            onSelect={(val) => setSelectedAward(val as AwardCategory)}
            isDark={isDark}
            width={120}
          />
        )}

        <Dropdown
          options={VIEW_MODE_OPTIONS}
          selectedValue={viewMode}
          onSelect={(val) => setViewMode(val as ViewMode)}
          isDark={isDark}
          width={160}
        />
      </View>

      {/* ------------------------------------------------ */}
      {/* Champion Top 3                                   */}
      {/* ------------------------------------------------ */}

      {showChampionTopThree && championTeams.length > 0 && (
        <TopThreeTeams
          teams={championTeams.map((t) => ({
            team: t.team,
            value: t.total_championships,
            logo:
              league === "nba"
                ? getNBATeamLogo(t.team.id, isDark)
                : league === "wnba"
                  ? getWNBATeamLogo(t.team.id, isDark)
                  : league === "cfb"
                    ? getCFBTeamLogo(t.team.id, isDark)
                    : league === "cbb"
                      ? getCBBTeamLogo(t.team.id, isDark)
                      : league === "wcbb"
                        ? getWCBBTeamLogo(t.team.id, isDark)
                        : league === "mlb"
                          ? getMLBTeamLogo(t.team.id, isDark)
                          : league === "nhl"
                            ? getNHLTeamLogo(t.team.id, isDark)
                            : getNFLTeamLogo(t.team.id, isDark),
          }))}
        />
      )}

      {/* ------------------------------------------------ */}
      {/* Award Top 3 (CFB / CBB / WCBB)                  */}
      {/* ------------------------------------------------ */}

      {showAwardTopThree && awardSchools.length > 0 && league && (
        <TopThreeTeams
          limit={3}
          teams={awardSchools.map((t) => ({
            team: t.team,
            value: t.total_awards,
            logo:
              league === "cfb"
                ? getCFBTeamLogo(t.team.id, isDark)
                : league === "wcbb"
                  ? getWCBBTeamLogo(t.team.id, isDark)
                  : getCBBTeamLogo(t.team.id, isDark),
          }))}
        />
      )}

      {/* ------------------------------------------------ */}
      {/* Champions Table                                  */}
      {/* ------------------------------------------------ */}

      {viewMode === "champions" && (
        <ChampionsTable
          key={`${league}-champions`}
          title={LEAGUE_CHAMPIONS_TITLE[league] ?? "Champions"}
          league={league}
          refreshSignal={refreshSignal}
        />
      )}

      {/* ------------------------------------------------ */}
      {/* Teams Table (Unified)                            */}
      {/* ------------------------------------------------ */}

      {(league === "cfb" || league === "cbb" || league === "wcbb") &&
        viewMode === "teams" &&
        awards.map(({ value, title }) => {
          if (value === "all") return null;

          if (selectedAward !== "all" && selectedAward !== value) return null;

          return (
            <AwardSchoolsTable
              key={`${league}-teams-${value}`}
              league={league}
              category={value}
              title={title}
              data={awardSchools}
              loading={awardSchoolsLoading}
              error={awardSchoolsError}
            />
          );
        })}

      {/* ------------------------------------------------ */}
      {/* Players Table                                    */}
      {/* ------------------------------------------------ */}

      {viewMode === "players" &&
        (league === "nba" ||
          league === "wnba" ||
          league === "nfl" ||
          league === "cfb" ||
          league === "cbb" ||
          league === "nhl" ||
          league === "mlb" ||
          league === "wcbb") &&
        awards.map(({ value, title }) => {
          if (value === "all") return null;

          if (selectedAward !== "all" && selectedAward !== value) return null;

          return (
            <AwardSeasonsTable
              key={`${league}-${value}`}
              category={value}
              title={title}
              data={dataByCategory[value]}
              loading={loading}
              error={error}
            />
          );
        })}
    </ScrollView>
  );
}
