import { useAllRecruits } from "@/hooks/RecruitHooks/useAllRecruits";
import {
  RecruitTeamRanking,
  useTeamRecruitingRankings,
} from "@/hooks/RecruitHooks/useTeamRecruitingRankings";
import { Recruit } from "@/types/recruiting/players";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "components/Dropdown";
import SearchBar from "components/SearchBars/AnimatedSearchBar";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RecruitCardSkeleton from "../../Skeletons/RecruitCardSkeleton";
import TeamRankCardSkeleton from "../../Skeletons/TeamRankCardSkeleton";
import RecruitCard from "./RecruitCard";
import TeamRankCard from "./TeamRankCard";

type Props = {
  year: string;
  team: string;
  league: "cbb" | "cfb";
  view: "players" | "teams";
  onYearChange: (y: string) => void;
  onTeamChange: (t: string) => void;
  onViewChange: (v: "players" | "teams") => void;
};

type DropdownOption = {
  label: string;
  value: string;
};

type RecruitsHeaderProps = {
  isDark: boolean;
  styles: ReturnType<typeof recruitListStyles>;
  year: string;
  team: string;
  view: "players" | "teams";
  search: string;
  searchOpen: boolean;
  yearOptions: DropdownOption[];
  teamOptions: DropdownOption[];
  viewOptions: DropdownOption[];
  onYearChange: (y: string) => void;
  onTeamChange: (t: string) => void;
  onViewChange: (v: "players" | "teams") => void;
  onSearchChange: (value: string) => void;
  onToggleSearch: () => void;
};

const CHUNK_SIZE = 20;

function getErrorMessage(error: unknown) {
  if (!error) return "Something went wrong.";
  if (error instanceof Error) return error.message;
  return String(error);
}

function normalizeSearchValue(value: string | number | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

const RecruitsHeader = memo(function RecruitsHeader({
  isDark,
  styles,
  year,
  team,
  view,
  search,
  searchOpen,
  yearOptions,
  teamOptions,
  viewOptions,
  onYearChange,
  onTeamChange,
  onViewChange,
  onSearchChange,
  onToggleSearch,
}: RecruitsHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.filterRow}>
        <TouchableOpacity onPress={onToggleSearch} hitSlop={10}>
          <Ionicons
            name={searchOpen ? "close" : "search"}
            size={22}
            color={isDark ? Colors.lightGray : Colors.darkGray}
          />
        </TouchableOpacity>

        <View style={styles.dropdownGroup}>
          <Dropdown
            options={yearOptions}
            selectedValue={year}
            onSelect={onYearChange}
            isDark={isDark}
            width={100}
          />

          {view === "players" && (
            <Dropdown
              options={teamOptions}
              selectedValue={team}
              onSelect={onTeamChange}
              isDark={isDark}
              width={120}
            />
          )}

          <Dropdown
            options={viewOptions}
            selectedValue={view}
            onSelect={(v) => onViewChange(v as "players" | "teams")}
            isDark={isDark}
            width={120}
          />
        </View>
      </View>

      <SearchBar
        value={search}
        onChangeText={onSearchChange}
        visible={searchOpen}
        placeholder={
          view === "players" ? "Search players..." : "Search teams..."
        }
      />
    </View>
  );
});

export default function RecruitsList({
  year,
  team,
  view,
  onYearChange,
  onTeamChange,
  onViewChange,
  league,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = useMemo(() => recruitListStyles(isDark), [isDark]);

  const listRef = useRef<FlatList<any>>(null);

  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [refreshingTeamRankings, setRefreshingTeamRankings] = useState(false);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    setVisibleCount(CHUNK_SIZE);
  }, [year, team, view]);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [search]);

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();

    return Array.from({ length: 19 }, (_, i) => {
      const y = now + 2 - i;
      return { label: String(y), value: String(y) };
    });
  }, []);

  const viewOptions = useMemo(
    () => [
      { label: "Players", value: "players" },
      { label: "Teams", value: "teams" },
    ],
    [],
  );

  const {
    data: playerData = [],
    loading: loadingPlayers,
    error: errorPlayers,
    refreshing: refreshingPlayers = false,
    refresh: refreshPlayers,
  } = useAllRecruits(Number(year), league);

  const {
    rankings: teamRankings = [],
    loading: loadingTeams,
    error: errorTeams,
    refetch: refetchTeamRankings,
  } = useTeamRecruitingRankings(Number(year), league);

  const loading = view === "players" ? loadingPlayers : loadingTeams;
  const refreshing =
    view === "players" ? refreshingPlayers : refreshingTeamRankings;
  const error = view === "players" ? errorPlayers : errorTeams;

  const onRefresh = useCallback(async () => {
    if (view === "players") {
      refreshPlayers?.();
      return;
    }

    try {
      setRefreshingTeamRankings(true);
      await refetchTeamRankings();
    } finally {
      setRefreshingTeamRankings(false);
    }
  }, [refetchTeamRankings, refreshPlayers, view]);

  const teamOptions = useMemo(() => {
    const uniqueTeams = Array.from(
      new Set(
        playerData
          .map((r: Recruit) => r.predicted_team_name)
          .filter((t): t is string => Boolean(t)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { label: "All Teams", value: "all" },
      ...uniqueTeams.map((t) => ({ label: t, value: t })),
    ];
  }, [playerData]);

  const toggleSearch = useCallback(() => {
    setSearchOpen((prev) => !prev);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const filteredPlayers = useMemo(() => {
    let list = playerData;

    if (team !== "all") {
      list = list.filter((r: Recruit) => {
        return r.predicted_team_name === team;
      });
    }

    const query = search.trim().toLowerCase();

    if (query.length > 0) {
      list = list.filter((p: Recruit) => {
        const predictionMatches = p.predicted_schools?.some((prediction) =>
          prediction.team_name?.toLowerCase().includes(query),
        );

        return (
          p.name?.toLowerCase().includes(query) ||
          p.position?.toLowerCase().includes(query) ||
          p.predicted_team_name?.toLowerCase().includes(query) ||
          p.high_school?.toLowerCase().includes(query) ||
          p.hometown?.toLowerCase().includes(query) ||
          predictionMatches
        );
      });
    }

    return list;
  }, [playerData, team, search]);

  const filteredTeamRankings = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return teamRankings;

    return teamRankings.filter((ranking: RecruitTeamRanking) => {
      return (
        normalizeSearchValue(ranking.team_name).includes(query) ||
        normalizeSearchValue(ranking.team_slug).includes(query) ||
        normalizeSearchValue(ranking.rank).includes(query) ||
        normalizeSearchValue(ranking.previous_rank).includes(query) ||
        normalizeSearchValue(ranking.total_commits).includes(query) ||
        normalizeSearchValue(ranking.five_stars).includes(query) ||
        normalizeSearchValue(ranking.four_stars).includes(query) ||
        normalizeSearchValue(ranking.three_stars).includes(query) ||
        normalizeSearchValue(ranking.average_rating).includes(query) ||
        normalizeSearchValue(ranking.points).includes(query)
      );
    });
  }, [search, teamRankings]);

  const activeFilteredLength =
    view === "players" ? filteredPlayers.length : filteredTeamRankings.length;

  const loadMore = useCallback(() => {
    if (visibleCount < activeFilteredLength) {
      setVisibleCount((prev) => prev + CHUNK_SIZE);
    }
  }, [activeFilteredLength, visibleCount]);

  const visiblePlayers = useMemo(
    () => filteredPlayers.slice(0, visibleCount),
    [filteredPlayers, visibleCount],
  );

  const visibleTeamRankings = useMemo(
    () => filteredTeamRankings.slice(0, visibleCount),
    [filteredTeamRankings, visibleCount],
  );

  const listHeaderComponent = useMemo(
    () => (
      <RecruitsHeader
        isDark={isDark}
        styles={styles}
        year={year}
        team={team}
        view={view}
        search={search}
        searchOpen={searchOpen}
        yearOptions={yearOptions}
        teamOptions={teamOptions}
        viewOptions={viewOptions}
        onYearChange={onYearChange}
        onTeamChange={onTeamChange}
        onViewChange={onViewChange}
        onSearchChange={handleSearchChange}
        onToggleSearch={toggleSearch}
      />
    ),
    [
      handleSearchChange,
      isDark,
      onTeamChange,
      onViewChange,
      onYearChange,
      search,
      searchOpen,
      styles,
      team,
      teamOptions,
      toggleSearch,
      view,
      viewOptions,
      year,
      yearOptions,
    ],
  );

  const emptyTitle = useMemo(() => {
    if (search.trim()) {
      return view === "players"
        ? "No recruits match your search"
        : "No teams match your search";
    }

    return view === "players"
      ? `No recruits found for ${year}`
      : `No team rankings found for ${year}`;
  }, [search, view, year]);

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerLayer}>{listHeaderComponent}</View>

        <FlatList
          ref={listRef}
          data={Array.from({ length: 10 })}
          keyExtractor={(_, i) => `skel-${i}`}
          renderItem={() =>
            view === "players" ? (
              <RecruitCardSkeleton />
            ) : (
              <TeamRankCardSkeleton />
            )
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerLayer}>{listHeaderComponent}</View>

        <FlatList
          ref={listRef}
          data={[]}
          keyExtractor={(_, i) => `error-${i}`}
          ListHeaderComponent={
            <View style={styles.center}>
              <Text style={styles.errorText}>
                Error: {getErrorMessage(error)}
              </Text>
              <Text style={styles.helperText}>Pull down to try again.</Text>
            </View>
          }
          renderItem={() => null}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }

  if (activeFilteredLength === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerLayer}>{listHeaderComponent}</View>

        <FlatList
          ref={listRef}
          data={[]}
          keyExtractor={(_, i) => `empty-${i}`}
          ListHeaderComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>{emptyTitle}</Text>
              <Text style={styles.helperText}>Pull down to refresh.</Text>
            </View>
          }
          renderItem={() => null}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerLayer}>{listHeaderComponent}</View>

      {view === "players" ? (
        <FlatList
          ref={listRef}
          data={visiblePlayers}
          keyExtractor={(item, index) =>
            `recruit-${item.year ?? year}-${item.id ?? index}`
          }
          renderItem={({ item, index }) => (
            <RecruitCard recruit={item} index={index} league={league} />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          style={styles.list}
          ListFooterComponent={
            visibleCount < activeFilteredLength ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Loading more…</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          ref={listRef}
          data={visibleTeamRankings}
          keyExtractor={(item, index) =>
            `team-ranking-${item.year}-${item.team_id ?? item.id ?? index}`
          }
          renderItem={({ item, index }) => (
            <TeamRankCard item={item} index={index} league={league} />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          style={styles.list}
          ListFooterComponent={
            visibleCount < activeFilteredLength ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Loading more…</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const recruitListStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginTop: 14,
    },
    listContent: {
      paddingBottom: 100,
    },
    headerLayer: {
      position: "relative",
      zIndex: 1000,
      backgroundColor: isDark
        ? Colors.dark.background
        : Colors.light.background,
      elevation: 1000,
    },
    list: {
      zIndex: 1,
      elevation: 1,
    },
    headerContainer: {
      position: "relative",
      zIndex: 1000,
      marginBottom: 12,
      paddingHorizontal: 12,
      overflow: "visible",
      elevation: 1000,
    },
    filterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    dropdownGroup: {
      position: "relative",
      zIndex: 1001,
      flexDirection: "row",
      gap: 8,
      overflow: "visible",
      elevation: 1001,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 40,
      paddingHorizontal: 20,
    },
    errorText: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
      textAlign: "center",
    },
    emptyText: {
      marginTop: 20,
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },
    helperText: {
      marginTop: 8,
      fontFamily: Fonts.REGULAR,
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },
    footer: {
      paddingVertical: 20,
    },
    footerText: {
      color: Colors.lightGray,
      textAlign: "center",
    },
  });
