import { Ionicons } from "@expo/vector-icons";
import Dropdown from "components/Dropdown";
import SearchBar from "components/SearchBars/AnimatedSearchBar";
import { Colors, Fonts, globalStyles } from "constants/styles";
import { teams } from "constants/teams";
import { nflTeams } from "constants/teamsNFL";
import { wnbaTeams } from "constants/teamsWNBA";
import { usePreferences } from "contexts/PreferencesContext";
import dayjs from "dayjs";
import { useDraft } from "hooks/LeagueHooks/useLeagueDraft";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraftCardSkeleton from "../../Skeletons/DraftCardSkeleton";
import DraftCard, { DraftPick } from "./DraftCard";

type Props = {
  year: string;
  team: string;
  round: string;
  view?: "players" | "teams";
  onYearChange: (y: string) => void;
  onTeamChange: (t: string) => void;
  onRoundChange: (r: string) => void;
  onViewChange?: (v: "players" | "teams") => void;
  league: string;
};

const CHUNK_SIZE = 20;

const POSITION_MAP: Record<string, string> = {
  "1": "Point Guard",
  "2": "Shooting Guard",
  "3": "Guard",
  "5": "Small Forward",
  "6": "Power Forward",
  "7": "Forward",
  "9": "Center",
};

const NFL_POSITION_MAP: Record<string, string> = {
  "8": "Quarterback",
  "9": "Running Back",
  "1": "Wide Receiver",
  "7": "Tight End",
  "10": "Fullback",
  "46": "Offensive Tackle",
  "47": "Offensive Guard",
  "91": "Center",
  "32": "Defensive Tackle",
  "30": "Linebacker",
  "264": "EDGE",
  "29": "Cornerback",
  "36": "Safety",
  "96": "Long Snapper",
  "80": "Place Kicker",
  "94": "Punter",
};

export const getDefaultDraftYear = (league: string) => {
  const now = dayjs();
  const year = now.year();

  if (league === "nfl") {
    return now.month() >= 3 ? year : year - 1;
  }

  if (league === "nba") {
    return now.month() >= 5 ? year : year - 1;
  }

  return year;
};

export default function DraftList({
  year,
  team,
  round,
  league,
  onYearChange,
  onTeamChange,
  onRoundChange,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = draftListStyles(isDark);
  const global = globalStyles(isDark);
  const listRef = useRef<FlatList<DraftPick>>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);

  const toggleSearch = () => {
    setSearchOpen((prev) => !prev);
  };

  const selectedYear = year;
  const selectedTeam = team;
  const selectedRound = round;

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [selectedYear, selectedRound, selectedTeam, search, league]);

  const yearOptions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    let maxSeason: number;

    if (league === "nfl") {
      const seasonHasStarted = now.getMonth() >= 3;
      maxSeason = seasonHasStarted ? currentYear : currentYear - 1;
    } else if (league === "nba") {
      const seasonHasStarted = now.getMonth() >= 5;
      maxSeason = seasonHasStarted ? currentYear : currentYear - 1;
    } else {
      maxSeason = currentYear;
    }

    const arr = [];

    for (let y = maxSeason; y >= maxSeason - 24; y--) {
      arr.push({ label: String(y), value: String(y) });
    }

    return arr;
  }, [league]);

  const getDraftSeasonYear = (draftLeague: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (draftLeague === "nfl") {
      const isNewSeason = now.getMonth() >= 3;
      return isNewSeason ? currentYear : currentYear - 1;
    }

    if (draftLeague === "nba") {
      const isNewSeason =
        now.getMonth() > 5 || (now.getMonth() === 5 && now.getDate() >= 20);

      return isNewSeason ? currentYear : currentYear - 1;
    }

    return currentYear;
  };

  const defaultYear = getDraftSeasonYear(league);
  const safeYear = year || String(defaultYear);

  useEffect(() => {
    if (!year) {
      onYearChange(String(defaultYear));
    }
  }, [defaultYear, year, onYearChange]);

  const { draft, loading, error, refreshing, onRefresh } = useDraft(
    league,
    Number(safeYear),
  );

  const picks = useMemo(() => draft?.picks ?? [], [draft?.picks]);
  const draftPickId = draft?.current?.pickId;

  const currentPickId = useMemo(() => {
    if (draftPickId !== undefined && draftPickId !== null) {
      return draftPickId;
    }

    return picks.find(
      (pick) => pick.status === "ON_THE_CLOCK" && pick.athlete === null,
    )?.overall;
  }, [draftPickId, picks]);

  const roundOptions = useMemo(() => {
    if (!picks.length) return [{ label: "All Rounds", value: "all" }];

    const uniqueRounds = Array.from(
      new Set<number>(picks.map((p: DraftPick) => p.round)),
    ).sort((a, b) => a - b);

    return [
      { label: "All Rounds", value: "all" },
      ...uniqueRounds.map((r) => ({
        label: `Round ${r}`,
        value: String(r),
      })),
    ];
  }, [picks]);

  const teamList = useMemo(() => {
    if (league === "nba") return teams;
    if (league === "wnba") return wnbaTeams;

    return nflTeams;
  }, [league]);

  const teamOptions = useMemo(() => {
    const formatted = teamList
      .map((t) => ({
        label: t.name,
        value: String(t.espnId),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [{ label: "All Teams", value: "all" }, ...formatted];
  }, [teamList]);

  const teamNameMap = useMemo(() => {
    const map: Record<string, string> = {};

    teamList.forEach((t) => {
      map[String(t.espnId)] = t.name.toLowerCase();
    });

    return map;
  }, [teamList]);

  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [selectedYear, selectedTeam, selectedRound, search, league]);

  const filteredPicks = useMemo(() => {
    if (!picks.length) return [];

    let list = picks;

    if (selectedRound !== "all") {
      list = list.filter((p: DraftPick) => String(p.round) === selectedRound);
    }

    if (selectedTeam !== "all") {
      list = list.filter((p: DraftPick) => String(p.teamId) === selectedTeam);
    }

    if (search.trim().length > 0) {
      const s = search.toLowerCase();

      const positionLookup = league === "nfl" ? NFL_POSITION_MAP : POSITION_MAP;

      list = list.filter((p: DraftPick) => {
        const nameMatch = p.athlete?.name?.toLowerCase().includes(s);

        const positionId = p.athlete?.positionId;
        const position = positionId
          ? (positionLookup[String(positionId)] ?? "")
          : "";
        const positionMatch = position.toLowerCase().includes(s);

        const teamName = teamNameMap[String(p.teamId)];
        const teamMatch = teamName?.includes(s);

        return nameMatch || positionMatch || teamMatch;
      });
    }

    return list;
  }, [picks, selectedRound, selectedTeam, search, league, teamNameMap]);

  const visiblePicks = useMemo(
    () => filteredPicks.slice(0, visibleCount),
    [filteredPicks, visibleCount],
  );

  if (error) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>Error: {String(error)}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <>
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons
                name={searchOpen ? "close" : "search"}
                size={22}
                color={isDark ? Colors.lightGray : Colors.darkGray}
              />
            </TouchableOpacity>

            <View style={styles.dropdownRow}>
              <Dropdown
                options={yearOptions}
                selectedValue={safeYear}
                onSelect={onYearChange}
                isDark={isDark}
                width={100}
              />

              <Dropdown
                options={roundOptions}
                selectedValue={round}
                onSelect={onRoundChange}
                isDark={isDark}
                width={100}
              />

              <Dropdown
                options={teamOptions}
                selectedValue={team}
                onSelect={onTeamChange}
                isDark={isDark}
                width={100}
              />
            </View>
          </View>

          <SearchBar
            value={search}
            onChangeText={setSearch}
            visible={searchOpen}
            placeholder="Search players..."
          />
        </View>

        <FlatList
          data={Array.from({ length: 10 })}
          keyExtractor={(_, i) => `skel-${i}`}
          renderItem={() => <DraftCardSkeleton />}
        />
      </>
    );
  }

  if (filteredPicks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownWrapper}>
            <TouchableOpacity onPress={toggleSearch}>
              <Ionicons
                name={searchOpen ? "close" : "search"}
                size={22}
                color={isDark ? Colors.lightGray : Colors.darkGray}
              />
            </TouchableOpacity>

            <View style={styles.dropdownRow}>
              <Dropdown
                options={yearOptions}
                selectedValue={safeYear}
                onSelect={onYearChange}
                isDark={isDark}
                width={100}
              />

              <Dropdown
                options={roundOptions}
                selectedValue={round}
                onSelect={onRoundChange}
                isDark={isDark}
                width={100}
              />

              <Dropdown
                options={teamOptions}
                selectedValue={team}
                onSelect={onTeamChange}
                isDark={isDark}
                width={100}
              />
            </View>
          </View>

          <SearchBar
            value={search}
            onChangeText={setSearch}
            visible={searchOpen}
            placeholder="Search players..."
          />
        </View>

        <Text style={global.emptyText}>No results found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.dropdownContainer}>
        <View style={styles.dropdownWrapper}>
          <TouchableOpacity onPress={toggleSearch}>
            <Ionicons
              name={searchOpen ? "close" : "search"}
              size={22}
              color={isDark ? Colors.lightGray : Colors.darkGray}
            />
          </TouchableOpacity>

          <View style={styles.dropdownRow}>
            <Dropdown
              options={yearOptions}
              selectedValue={safeYear}
              onSelect={onYearChange}
              isDark={isDark}
              width={100}
            />

            <Dropdown
              options={roundOptions}
              selectedValue={round}
              onSelect={onRoundChange}
              isDark={isDark}
              width={120}
            />

            <Dropdown
              options={teamOptions}
              selectedValue={team}
              onSelect={onTeamChange}
              isDark={isDark}
              width={120}
            />
          </View>
        </View>

        <SearchBar
          value={search}
          onChangeText={setSearch}
          visible={searchOpen}
          placeholder="Search players..."
        />
      </View>

      <FlatList
        ref={listRef}
        data={visiblePicks}
        keyExtractor={(item) => `${item.overall}`}
        renderItem={({ item, index }) => (
          <DraftCard
            player={item}
            index={index}
            league={league}
            isFirstOnTheClock={
              currentPickId !== undefined &&
              Number(item.overall) === Number(currentPickId)
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? Colors.lightGray : Colors.darkGray}
          />
        }
        onEndReachedThreshold={0.2}
        onEndReached={() => {
          if (visibleCount < filteredPicks.length) {
            setVisibleCount((prev) => prev + CHUNK_SIZE);
          }
        }}
        ListFooterComponent={
          visibleCount < filteredPicks.length ? (
            <View style={styles.footerLoader}>
              <Text style={styles.footerLoaderText}>Loading more…</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

export const draftListStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingBottom: 80,
    },
    dropdownContainer: {
      marginVertical: 12,
      paddingHorizontal: 12,
    },
    dropdownWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 8,
    },
    dropdownRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 4,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 40,
    },
    errorText: {
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
    },
    emptyText: {
      marginTop: 20,
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    footerLoader: {
      alignItems: "center",
      padding: 20,
    },
    footerLoaderText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
  });
