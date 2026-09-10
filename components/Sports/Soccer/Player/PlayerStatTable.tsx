import PillTabs from "@/components/TabBars/PillTabs";
import { getSOCCTeam } from "@/constants/teamsSOCC";
import type {
  SoccerPlayerSeason,
  SoccerTeamOption,
} from "@/hooks/SoccerHooks/usePlayerSeasons";
import { Dropdown, type DropdownOption } from "components/Dropdown";
import HeadingTwo from "components/Headings/HeadingTwo";
import { globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { statsTableStyles } from "styles/PlayerStyles/StatsTableStyles";

type Props = {
  seasons: SoccerPlayerSeason[];
  teamOptions: SoccerTeamOption[];
  selectedTeamId: string | null;
  selectedCompetition: string | null;
  onTeamChange: (teamId: string) => void;
  onCompetitionChange: (competition: string | null) => void;
  loading: boolean;
  error: string | null;
};

type SoccerStatValue = string | number | null | undefined;

type StatColumn = {
  key: string;
  header: string;
};

type GlossaryEntry = {
  abbr: string;
  label: string;
};

const EMPTY_STAT = "-";
const ALL_COMPETITIONS_VALUE = "__all_competitions__";

const chunk = <T,>(items: T[], size: number): T[][] => {
  const result: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }

  return result;
};

const normalizeText = (value: string | null | undefined): string | null => {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
};

const formatKeyLabel = (value: string): string => {
  const spacedValue = value.replace(/[_-]+/g, " ").trim();

  return spacedValue.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const isStatsRecord = (
  value: unknown,
): value is Record<string, string | number | null> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const hasStatKey = (
  stats: Record<string, string | number | null>,
  key: string | null,
): key is string => {
  if (!key) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(stats, key);
};

const getCategoryStats = (
  season: SoccerPlayerSeason,
  category: string | null,
): Record<string, string | number | null> => {
  if (!category) {
    return {};
  }

  const stats = season.stats?.[category];
  const categoryStats = isStatsRecord(stats) ? stats : {};
  const itemStats =
    season.stat_items?.[category]?.reduce<
      Record<string, string | number | null>
    >((record, item) => {
      const key = normalizeText(item.name) ?? normalizeText(item.label);

      if (key) {
        record[key] = item.value;
      }

      return record;
    }, {}) ?? {};

  return {
    ...itemStats,
    ...categoryStats,
  };
};

const getCategoryOptions = (seasons: SoccerPlayerSeason[]) => {
  const categoryKeys: string[] = [];
  const seenCategories = new Set<string>();

  seasons.forEach((season) => {
    const categories = new Set([
      ...Object.keys(season.stats ?? {}),
      ...Object.keys(season.stat_items ?? {}),
    ]);

    categories.forEach((category) => {
      if (seenCategories.has(category)) {
        return;
      }

      const stats = getCategoryStats(season, category);

      if (Object.keys(stats).length === 0) {
        return;
      }

      seenCategories.add(category);
      categoryKeys.push(category);
    });
  });

  return categoryKeys.map((category) => {
    const displayName = seasons
      .map((season) =>
        normalizeText(season.category_metadata?.[category]?.displayName),
      )
      .find(Boolean);

    return {
      label: displayName ?? formatKeyLabel(category),
      value: category,
    };
  });
};

const getMetadataColumns = (
  season: SoccerPlayerSeason,
  category: string,
  stats: Record<string, string | number | null>,
): StatColumn[] => {
  const metadata = season.category_metadata?.[category];
  const names = Array.isArray(metadata?.names) ? metadata.names : [];
  const labels = Array.isArray(metadata?.labels) ? metadata.labels : [];
  const statKeys = Object.keys(stats);
  const columnCount = Math.max(names.length, labels.length);

  if (columnCount === 0) {
    return [];
  }

  const columns: StatColumn[] = [];

  for (let index = 0; index < columnCount; index += 1) {
    const name = normalizeText(names[index]);
    const label = normalizeText(labels[index]);
    const key =
      (hasStatKey(stats, name) ? name : null) ??
      (hasStatKey(stats, label) ? label : null) ??
      statKeys[index] ??
      name ??
      label;

    if (!key) {
      continue;
    }

    columns.push({
      key,
      header: label ?? name ?? key,
    });
  }

  return columns;
};

const getStatItemColumns = (
  season: SoccerPlayerSeason,
  category: string,
): StatColumn[] => {
  const statItems = season.stat_items?.[category];

  if (!Array.isArray(statItems)) {
    return [];
  }

  return statItems
    .map((item) => {
      const key = normalizeText(item.name) ?? normalizeText(item.label);

      if (!key) {
        return null;
      }

      return {
        key,
        header: normalizeText(item.label) ?? key,
      };
    })
    .filter((column): column is StatColumn => column !== null);
};

const getStatColumns = (
  seasons: SoccerPlayerSeason[],
  category: string | null,
): StatColumn[] => {
  if (!category) {
    return [];
  }

  const columns: StatColumn[] = [];
  const seenColumns = new Set<string>();

  const addColumn = (column: StatColumn) => {
    if (seenColumns.has(column.key)) {
      return;
    }

    seenColumns.add(column.key);
    columns.push(column);
  };

  seasons.forEach((season) => {
    const stats = getCategoryStats(season, category);

    if (Object.keys(stats).length === 0) {
      return;
    }

    getMetadataColumns(season, category, stats).forEach(addColumn);
    getStatItemColumns(season, category).forEach(addColumn);

    Object.keys(stats).forEach((key) => {
      addColumn({
        key,
        header: key,
      });
    });
  });

  return columns;
};

const getRowsForCategory = (
  seasons: SoccerPlayerSeason[],
  category: string | null,
): SoccerPlayerSeason[] => {
  if (!category) {
    return [];
  }

  return seasons.filter(
    (season) => Object.keys(getCategoryStats(season, category)).length > 0,
  );
};

const isMissing = (value: SoccerStatValue): boolean => {
  return value === null || value === undefined || String(value).trim() === "";
};

const formatStatValue = (value: SoccerStatValue): string => {
  return isMissing(value) ? EMPTY_STAT : String(value).trim();
};

const toNumericTotalValue = (value: SoccerStatValue): number | null => {
  if (isMissing(value)) {
    return null;
  }

  const normalizedValue = String(value).replace(/,/g, "").trim();

  if (!/^[+-]?\d+(\.\d+)?$/.test(normalizedValue)) {
    return null;
  }

  const numberValue = Number(normalizedValue);

  return Number.isFinite(numberValue) ? numberValue : null;
};

const formatCareerTotal = (value: number): string => {
  const roundedValue = Number(value.toFixed(2));

  if (Object.is(roundedValue, -0)) {
    return "0";
  }

  return String(roundedValue);
};

const getCareerStatCells = (
  rows: SoccerPlayerSeason[],
  columns: StatColumn[],
  category: string | null,
) => {
  if (!category) {
    return [];
  }

  return columns.map((column) => {
    let total = 0;
    let hasNumericValue = false;

    rows.forEach((season) => {
      const numberValue = toNumericTotalValue(
        getCategoryStats(season, category)[column.key],
      );

      if (numberValue === null) {
        return;
      }

      total += numberValue;
      hasNumericValue = true;
    });

    return {
      key: column.key,
      value: hasNumericValue ? formatCareerTotal(total) : EMPTY_STAT,
    };
  });
};

const getTeamCode = (season: SoccerPlayerSeason): string => {
  const team = getSOCCTeam(season.team_id);

  return (
    normalizeText(team?.code) ??
    normalizeText(season.team_name) ??
    normalizeText(season.team_slug) ??
    EMPTY_STAT
  );
};

const getSeasonRowKey = (season: SoccerPlayerSeason, index: number): string => {
  return [
    season.id,
    season.season,
    season.team_id,
    season.league_slug,
    season.season_type_id,
    index,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join("-");
};

const getGlossaryItems = (seasons: SoccerPlayerSeason[]): GlossaryEntry[] => {
  const glossaryItems: GlossaryEntry[] = [];
  const seenAbbreviations = new Set<string>();

  seasons.forEach((season) => {
    season.glossary?.forEach((item) => {
      const abbreviation = normalizeText(item.abbreviation);

      if (!abbreviation) {
        return;
      }

      const dedupeKey = abbreviation.toUpperCase();

      if (seenAbbreviations.has(dedupeKey)) {
        return;
      }

      seenAbbreviations.add(dedupeKey);
      glossaryItems.push({
        abbr: abbreviation,
        label: normalizeText(item.displayName) ?? formatKeyLabel(abbreviation),
      });
    });
  });

  return glossaryItems;
};

const getTeamDropdownOptions = (
  teamOptions: SoccerTeamOption[],
): DropdownOption[] => {
  return teamOptions
    .map((team) => {
      const teamId = normalizeText(team.teamId) ?? normalizeText(team.value);

      if (!teamId) {
        return null;
      }

      return {
        value: teamId,
        label:
          normalizeText(team.label) ??
          normalizeText(team.teamName) ??
          normalizeText(team.teamSlug) ??
          teamId,
      };
    })
    .filter((option): option is DropdownOption => option !== null);
};

const getSelectedTeamOption = (
  teamOptions: SoccerTeamOption[],
  selectedTeamId: string | null,
): SoccerTeamOption | null => {
  if (teamOptions.length === 0) {
    return null;
  }

  const selectedTeam = selectedTeamId
    ? teamOptions.find(
        (team) =>
          String(team.teamId) === String(selectedTeamId) ||
          String(team.value) === String(selectedTeamId),
      )
    : null;

  return selectedTeam ?? teamOptions[0];
};

const getCompetitionDropdownOptions = (
  selectedTeam: SoccerTeamOption | null,
): DropdownOption[] => {
  const options: DropdownOption[] = [
    {
      label: "All Competitions",
      value: ALL_COMPETITIONS_VALUE,
    },
  ];

  const seenValues = new Set([ALL_COMPETITIONS_VALUE]);

  selectedTeam?.competitions?.forEach((competition) => {
    const value = normalizeText(competition.leagueSlug) ?? competition.value;

    if (seenValues.has(value)) {
      return;
    }

    seenValues.add(value);
    options.push({
      value,
      label:
        normalizeText(competition.label) ??
        normalizeText(competition.leagueName) ??
        normalizeText(competition.leagueSlug) ??
        value,
    });
  });

  return options;
};

export default function PlayerStatTable({
  seasons,
  teamOptions,
  selectedTeamId,
  selectedCompetition,
  onTeamChange,
  onCompetitionChange,
  loading,
  error,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = statsTableStyles(isDark);
  const global = globalStyles(isDark);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categoryOptions = useMemo(() => getCategoryOptions(seasons), [seasons]);

  const defaultCategory = categoryOptions[0]?.value ?? null;
  const activeCategory =
    selectedCategory &&
    categoryOptions.some((category) => category.value === selectedCategory)
      ? selectedCategory
      : defaultCategory;

  useEffect(() => {
    if (activeCategory !== selectedCategory) {
      setSelectedCategory(activeCategory);
    }
  }, [activeCategory, selectedCategory]);

  const filteredRows = useMemo(
    () => getRowsForCategory(seasons, activeCategory),
    [seasons, activeCategory],
  );

  const statColumns = useMemo(
    () => getStatColumns(filteredRows, activeCategory),
    [filteredRows, activeCategory],
  );

  const careerStatCells = useMemo(
    () => getCareerStatCells(filteredRows, statColumns, activeCategory),
    [filteredRows, statColumns, activeCategory],
  );

  const glossaryItems = useMemo(() => getGlossaryItems(seasons), [seasons]);

  const teamDropdownOptions = useMemo(
    () => getTeamDropdownOptions(teamOptions),
    [teamOptions],
  );

  const selectedTeam = useMemo(
    () => getSelectedTeamOption(teamOptions, selectedTeamId),
    [teamOptions, selectedTeamId],
  );

  const competitionDropdownOptions = useMemo(
    () => getCompetitionDropdownOptions(selectedTeam),
    [selectedTeam],
  );

  const selectedCompetitionValue =
    selectedCompetition ?? ALL_COMPETITIONS_VALUE;

  const getDataRowStyle = (index: number) => {
    const zebraStyle =
      index % 2 === 1
        ? isDark
          ? styles.rowAltDark
          : styles.rowAltLight
        : null;

    return [styles.row, zebraStyle];
  };

  const renderFilters = () => {
    if (teamDropdownOptions.length === 0) {
      return null;
    }

    return (
      <View style={styles.filtersRow}>
        <Dropdown
          isDark={isDark}
          options={teamDropdownOptions}
          selectedValue={
            selectedTeam
              ? (normalizeText(selectedTeam.teamId) ??
                normalizeText(selectedTeam.value) ??
                undefined)
              : undefined
          }
          onSelect={onTeamChange}
          width={140}
          style={styles.filterDropdown}
        />

        <Dropdown
          isDark={isDark}
          options={competitionDropdownOptions}
          selectedValue={selectedCompetitionValue}
          onSelect={(value) =>
            onCompetitionChange(value === ALL_COMPETITIONS_VALUE ? null : value)
          }
          width={140}
          style={styles.filterDropdown}
        />
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.statsHeader}>
        <HeadingTwo isDark={isDark}>Career Stats</HeadingTwo>
        {renderFilters()}
      </View>

      {activeCategory && categoryOptions.length > 1 ? (
        <PillTabs
          tabs={categoryOptions}
          selectedValue={activeCategory}
          onChange={setSelectedCategory}
          scrollable
          minTabWidth={120}
        />
      ) : null}
    </>
  );

  if (loading) {
    return <View style={styles.container}>{renderHeader()}</View>;
  }

  if (error) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>
          {error || "Failed to load soccer stats"}
        </Text>
      </View>
    );
  }

  const hasRenderableStats =
    Boolean(activeCategory) &&
    filteredRows.length > 0 &&
    statColumns.length > 0;
  const selectedFilterHasNoStats =
    Boolean(selectedTeamId || selectedCompetition) ||
    teamDropdownOptions.length > 0;
  const emptyStatsText = selectedFilterHasNoStats
    ? "No stats for the selected team/competition/category"
    : "No soccer stats available";

  if (seasons.length === 0) {
    return (
      <Text style={[global.emptyText, styles.emptyText]}>{emptyStatsText}</Text>
    );
  }
  if (!hasRenderableStats) {
    return (
      <Text style={[global.emptyText, styles.emptyText]}>
        No stats for the selected team/competition/category
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <View style={styles.tableWrapper}>
        <View style={styles.fixedSection}>
          <View style={styles.seasonColumn}>
            <View style={[styles.row, styles.headerRow, styles.tableHeaderRow]}>
              <Text style={[styles.fixedCell, styles.fixedHeaderCell]}>
                SEASON
              </Text>
            </View>

            {filteredRows.map((season, index) => (
              <View
                key={`${getSeasonRowKey(season, index)}-season`}
                style={getDataRowStyle(index)}
              >
                <Text
                  style={styles.fixedCell}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {season.season}
                </Text>
              </View>
            ))}

            <View style={[styles.row, styles.careerRow, styles.lastRow]}>
              <Text
                style={[
                  styles.fixedCell,
                  styles.fixedHeaderCell,
                  styles.fixedCareerHeaderCell,
                ]}
              >
                CAREER
              </Text>
            </View>
          </View>

          <View style={[styles.teamColumn, styles.compColumn]}>
            <View style={[styles.row, styles.headerRow, styles.tableHeaderRow]}>
              <Text
                style={[
                  styles.fixedTeamCell,
                  styles.fixedHeaderCell,
                  styles.compCell,
                ]}
              >
                TEAM
              </Text>
            </View>

            {filteredRows.map((season, index) => (
              <View
                key={`${getSeasonRowKey(season, index)}-competition`}
                style={getDataRowStyle(index)}
              >
                <Text
                  style={[styles.fixedTeamCell, styles.compCell]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {getTeamCode(season)}
                </Text>
              </View>
            ))}

            <View style={[styles.row, styles.careerRow, styles.lastRow]}>
              <Text style={[styles.fixedCareerCell, styles.compCell]}> </Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollSection}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.statScrollContent}>
            <View style={[styles.row, styles.headerRow, styles.tableHeaderRow]}>
              {statColumns.map((column) => (
                <Text
                  key={column.key}
                  style={[styles.cell, styles.headerCell]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {column.header}
                </Text>
              ))}
            </View>

            {filteredRows.map((season, index) => {
              const categoryStats = getCategoryStats(season, activeCategory);
              const rowKey = getSeasonRowKey(season, index);

              return (
                <View key={`${rowKey}-stats`} style={getDataRowStyle(index)}>
                  {statColumns.map((column) => (
                    <Text key={column.key} style={styles.cell}>
                      {formatStatValue(categoryStats[column.key])}
                    </Text>
                  ))}
                </View>
              );
            })}

            <View style={[styles.row, styles.careerRow, styles.lastRow]}>
              {careerStatCells.map((cell) => (
                <Text key={cell.key} style={styles.careerCell}>
                  {cell.value}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {glossaryItems.length > 0 ? (
        <View style={styles.glossaryContainer}>
          <Text style={styles.headerName}>Stat Glossary</Text>

          {chunk(glossaryItems, 2).map((glossaryRow, rowIndex) => {
            const isAlternateRow = rowIndex % 2 === 1;

            return (
              <View key={`glossary-row-${rowIndex}`} style={styles.glossaryRow}>
                {glossaryRow.map((item, columnIndex) => (
                  <View
                    key={item.abbr}
                    style={[
                      styles.glossaryCell,
                      isAlternateRow && styles.glossaryCellAlt,
                      columnIndex === 0 && styles.glossaryCellWithRightBorder,
                    ]}
                  >
                    <Text style={styles.glossaryAbbr}>
                      {item.abbr}{" "}
                      <Text style={styles.glossaryDisplayName}>
                        {item.label}
                      </Text>
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
