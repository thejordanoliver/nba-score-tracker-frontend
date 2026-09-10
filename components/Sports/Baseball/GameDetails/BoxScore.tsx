import HeadingTwo from "components/Headings/HeadingTwo";
import { activeOpacity, Colors, Fonts, globalStyles } from "constants/styles";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

const COLUMN_WIDTH = 50;
const NAME_COLUMN_WIDTH = 160;
const PLAYER_ROW_HEIGHT = 36;
const COLLAPSED_ROWS = 5;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type LogoSource = ImageSourcePropType | string | null | undefined;

type StatSectionType = "batting" | "pitching" | "fielding";

type TeamInfo = {
  id?: number | string | null;
  teamId?: number | string | null;
  espnId?: number | string | null;
  code?: string | null;
  name?: string | null;
  fullName?: string | null;
};

type MlbAthleteInfo = {
  id?: number | string | null;
  playerId?: number | string | null;
  espnId?: number | string | null;
  espn_id?: number | string | null;
  teamId?: number | string | null;
  team_id?: number | string | null;
  team?: TeamInfo | null;
  displayName?: string | null;
  shortName?: string | null;
  short_name?: string | null;
  fullName?: string | null;
  name?: string | null;
  headshot?:
    | string
    | {
        href?: string | null;
        alt?: string | null;
      }
    | null;
};

type PlayerStatItem = {
  key?: string;
  name?: string;
  label?: string;
  description?: string | null;
  value?: string | number | null;
};

type MlbPlayerStat = {
  active?: boolean | null;
  starter?: boolean;
  batOrder?: number | null;
  didNotPlay?: boolean;
  reason?: string | null;
  position?: {
    id?: string | number | null;
    name?: string | null;
    displayName?: string | null;
    abbreviation?: string | null;
  } | null;
  athlete?: MlbAthleteInfo | null;
  stats?: (string | number | null | undefined)[];
  notes?: {
    type?: string;
    text?: string;
  }[];

  id?: number | string | null;
  uid?: string | null;
  guid?: string | null;
  displayName?: string | null;
  shortName?: string | null;
  headshot?: string | null;
  statsByKey?: Record<string, string | number | null>;
  statItems?: PlayerStatItem[];
  atBats?: any[];
};

type StatSection = {
  type?: string | null;
  name?: string | null;
  displayName?: string | null;
  names?: string[];
  keys?: string[];
  labels?: string[];
  descriptions?: string[];
  totals?: (string | number | null | undefined)[];
  totalsByKey?: Record<string, string | number | null>;
  totalItems?: PlayerStatItem[];
  athletes?: MlbPlayerStat[];
};

type TeamBlock = StatSection & {
  homeAway?: "home" | "away" | string;
  displayOrder?: number | null;
  team: TeamInfo;

  statistics?: StatSection[];

  statBlocks?: StatSection[];
  statBlocksByType?: Record<string, StatSection>;
  batting?: StatSection | null;
  pitching?: StatSection | null;
  fielding?: StatSection | null;
};

type TeamGroup = {
  homeAway?: "home" | "away" | string;
  displayOrder?: number | null;
  team: TeamInfo;
  statBlocks?: StatSection[];
  statBlocksByType?: Record<string, StatSection>;
  batting?: StatSection | null;
  pitching?: StatSection | null;
  fielding?: StatSection | null;
};

type BoxscoreShape = {
  players?: TeamBlock[];
  teams?: TeamBlock[];
};

type ScoreShape = {
  playerStats?: TeamBlock[];
  teamStats?: TeamBlock[];
  boxscore?: BoxscoreShape;
  boxScore?: BoxscoreShape;

  status?: string;
  gameStatusDescription?: string;

  homeTeamId?: number | string | null;
  awayTeamId?: number | string | null;

  homeTeam?: string | null;
  awayTeam?: string | null;

  homeTeamCode?: string | null;
  awayTeamCode?: string | null;
  homeTeamAbbreviation?: string | null;
  awayTeamAbbreviation?: string | null;

  homeTeamLogo?: LogoSource;
  awayTeamLogo?: LogoSource;
};

type ApiResponseShape = {
  score?: ScoreShape | null;
  details?: unknown;
};

type Props = {
  score?: ScoreShape | ApiResponseShape | null;

  homeTeamId?: number | string | null;
  awayTeamId?: number | string | null;
  homeName?: string | null;
  awayName?: string | null;
  homeLogo?: LogoSource;
  awayLogo?: LogoSource;

  playerStats?: unknown;
  stats?: unknown;

  isLoading?: boolean;
  isError?: boolean;
  isDark: boolean;
  league?: string;
  state?: string | null;
};

const BATTING_FALLBACK_LABELS = [
  "H-AB",
  "AB",
  "R",
  "H",
  "RBI",
  "HR",
  "BB",
  "K",
  "#P",
  "AVG",
  "OBP",
  "SLG",
];

const PITCHING_FALLBACK_LABELS = [
  "IP",
  "H",
  "R",
  "ER",
  "BB",
  "K",
  "HR",
  "PC-ST",
  "ERA",
  "PC",
];

const FIELDING_FALLBACK_LABELS = ["PO", "A", "E", "DP"];

// ---------------------------------------------------------------------------
// Data normalization helpers
// (unchanged behavior — only grouped together for readability)
// ---------------------------------------------------------------------------

const normalizeIdentifier = (value: unknown) => {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const isRecord = (value: unknown): value is Record<string, any> => {
  return typeof value === "object" && value !== null;
};

const isScoreShape = (value: unknown): value is ScoreShape => {
  if (!isRecord(value)) return false;

  return (
    Array.isArray(value.playerStats) ||
    Array.isArray(value.teamStats) ||
    Array.isArray(value.boxscore?.players) ||
    Array.isArray(value.boxScore?.players) ||
    Boolean(value.status) ||
    Boolean(value.homeTeam) ||
    Boolean(value.awayTeam) ||
    Boolean(value.homeTeamId) ||
    Boolean(value.awayTeamId)
  );
};

const resolveScoreShape = (value: unknown): ScoreShape | null => {
  if (!isRecord(value)) return null;

  if (isScoreShape(value)) {
    return value;
  }

  if (isScoreShape(value.score)) {
    return value.score;
  }

  return null;
};

const collectTeamIdentifiers = (team?: TeamInfo | null) => {
  const values = [team?.id, team?.teamId, team?.espnId];

  return values
    .map(normalizeIdentifier)
    .filter((value): value is string => Boolean(value));
};

const getPlayerStatsArray = (input: unknown): TeamBlock[] => {
  if (Array.isArray(input)) {
    return input.filter(Boolean) as TeamBlock[];
  }

  if (!isRecord(input)) {
    return [];
  }

  if (Array.isArray(input.boxscore?.players)) {
    return input.boxscore.players.filter(Boolean);
  }

  if (Array.isArray(input.boxScore?.players)) {
    return input.boxScore.players.filter(Boolean);
  }

  if (Array.isArray(input.score?.boxscore?.players)) {
    return input.score.boxscore.players.filter(Boolean);
  }

  if (Array.isArray(input.score?.boxScore?.players)) {
    return input.score.boxScore.players.filter(Boolean);
  }

  if (Array.isArray(input.players)) {
    return input.players.filter(Boolean);
  }

  if (Array.isArray(input.playerStats)) {
    return input.playerStats.filter(Boolean);
  }

  if (Array.isArray(input.score?.playerStats)) {
    return input.score.playerStats.filter(Boolean);
  }

  if (Array.isArray(input.teamStats)) {
    return input.teamStats.filter(Boolean);
  }

  if (Array.isArray(input.score?.teamStats)) {
    return input.score.teamStats.filter(Boolean);
  }

  if (Array.isArray(input.boxscore?.teams)) {
    return input.boxscore.teams.filter(Boolean);
  }

  if (Array.isArray(input.boxScore?.teams)) {
    return input.boxScore.teams.filter(Boolean);
  }

  if (Array.isArray(input.teams)) {
    return input.teams.filter(Boolean);
  }

  return [];
};

const getAthleteId = (athlete?: MlbAthleteInfo | null) => {
  return (
    athlete?.playerId ?? athlete?.id ?? athlete?.espnId ?? athlete?.espn_id
  );
};

const getPlayerId = (player: MlbPlayerStat) => {
  return player.id ?? getAthleteId(player.athlete);
};

const getAthleteTeamId = (
  athlete?: MlbAthleteInfo | null,
  fallbackTeamId?: number | string | null,
) => {
  return (
    athlete?.teamId ??
    athlete?.team_id ??
    athlete?.team?.id ??
    athlete?.team?.teamId ??
    fallbackTeamId
  );
};

const getPlayerTeamId = (
  player: MlbPlayerStat,
  fallbackTeamId?: number | string | null,
) => {
  return getAthleteTeamId(player.athlete, fallbackTeamId);
};

const getAthleteName = (athlete?: MlbAthleteInfo | null) => {
  return (
    athlete?.shortName ??
    athlete?.short_name ??
    athlete?.displayName ??
    athlete?.fullName ??
    athlete?.name ??
    null
  );
};

const getPlayerName = (player: MlbPlayerStat) => {
  return (
    player.shortName ??
    player.displayName ??
    getAthleteName(player.athlete) ??
    "Player"
  );
};

const getSectionValues = (section: StatSection) => {
  const rawType = String(
    section.type ?? section.name ?? section.displayName ?? "",
  ).toLowerCase();

  const keys = Array.isArray(section.keys)
    ? section.keys.map((key) => String(key).toLowerCase())
    : [];

  const labels = Array.isArray(section.labels)
    ? section.labels.map((label) => String(label).toLowerCase())
    : [];

  const names = Array.isArray(section.names)
    ? section.names.map((name) => String(name).toLowerCase())
    : [];

  return [rawType, ...keys, ...labels, ...names].filter(Boolean);
};

const inferSectionType = (section: StatSection): StatSectionType => {
  const values = getSectionValues(section);

  if (values.some((value) => value.includes("pitch"))) {
    return "pitching";
  }

  if (values.some((value) => value.includes("field"))) {
    return "fielding";
  }

  if (values.some((value) => value.includes("bat"))) {
    return "batting";
  }

  const hasPitchingKey = values.some((value) =>
    [
      "fullinnings.partinnings",
      "fullinnings",
      "partinnings",
      "innings",
      "inningspitched",
      "ip",
      "earnedruns",
      "er",
      "era",
      "pitches-strikes",
      "pc-st",
      "pitches",
      "pc",
    ].includes(value),
  );

  if (hasPitchingKey) return "pitching";

  const hasFieldingKey = values.some((value) =>
    [
      "putouts",
      "po",
      "assists",
      "a",
      "errors",
      "e",
      "doubleplays",
      "dp",
      "passedballs",
      "pb",
    ].includes(value),
  );

  if (hasFieldingKey) return "fielding";

  return "batting";
};

const toTopLevelSection = (block: TeamBlock): StatSection => {
  return {
    type: block.type,
    name: block.name,
    displayName: block.displayName,
    names: block.names,
    keys: block.keys,
    labels: block.labels,
    descriptions: block.descriptions,
    totals: block.totals,
    totalsByKey: block.totalsByKey,
    totalItems: block.totalItems,
    athletes: block.athletes,
  };
};

const hasSectionContent = (section?: StatSection | null) => {
  return Array.isArray(section?.athletes) && section.athletes.length > 0;
};

const hasSectionTotals = (section?: StatSection | null) => {
  return (
    Array.isArray(section?.totals) &&
    section.totals.some((item) => {
      return item !== null && item !== undefined && String(item).trim() !== "";
    })
  );
};

const hasRenderableSection = (section?: StatSection | null) => {
  return hasSectionContent(section) || hasSectionTotals(section);
};

const hasExpandableSection = (section?: StatSection | null) => {
  return (section?.athletes?.length ?? 0) > COLLAPSED_ROWS;
};

const getTeamGroupKey = (block: TeamBlock, index: number) => {
  const identifiers = collectTeamIdentifiers(block.team);
  return identifiers[0] ?? `team-${index}`;
};

const assignSectionToGroup = (
  group: TeamGroup,
  section: StatSection | null | undefined,
  explicitType?: StatSectionType,
) => {
  if (!section) return;

  const sectionType = explicitType ?? inferSectionType(section);

  if (!group.statBlocks) {
    group.statBlocks = [];
  }

  if (!group.statBlocksByType) {
    group.statBlocksByType = {};
  }

  const normalizedSection: StatSection = {
    ...section,
    type: section.type ?? sectionType,
  };

  group.statBlocks.push(normalizedSection);
  group.statBlocksByType[sectionType] = normalizedSection;

  if (sectionType === "pitching") {
    group.pitching = normalizedSection;
    return;
  }

  if (sectionType === "fielding") {
    group.fielding = normalizedSection;
    return;
  }

  group.batting = normalizedSection;
};

const assignStatBlocksByTypeToGroup = (
  group: TeamGroup,
  statBlocksByType?: Record<string, StatSection>,
) => {
  if (!isRecord(statBlocksByType)) return false;

  let assigned = false;

  Object.entries(statBlocksByType).forEach(([type, section]) => {
    const normalizedType = String(type).toLowerCase();

    if (normalizedType.includes("pitch")) {
      assignSectionToGroup(group, section, "pitching");
      assigned = true;
      return;
    }

    if (normalizedType.includes("field")) {
      assignSectionToGroup(group, section, "fielding");
      assigned = true;
      return;
    }

    if (normalizedType.includes("bat")) {
      assignSectionToGroup(group, section, "batting");
      assigned = true;
      return;
    }

    assignSectionToGroup(group, section);
    assigned = true;
  });

  return assigned;
};

const getTeamGroups = (blocks: TeamBlock[]) => {
  const groups: TeamGroup[] = [];
  const groupMap = new Map<string, TeamGroup>();

  blocks.forEach((block, index) => {
    const groupKey = getTeamGroupKey(block, index);

    let group = groupMap.get(groupKey);

    if (!group) {
      group = {
        homeAway: block.homeAway,
        displayOrder: block.displayOrder,
        team: block.team,
        statBlocks: [],
        statBlocksByType: {},
      };

      groupMap.set(groupKey, group);
      groups.push(group);
    }

    if (!group.homeAway && block.homeAway) {
      group.homeAway = block.homeAway;
    }

    if (
      (group.displayOrder === undefined || group.displayOrder === null) &&
      block.displayOrder !== undefined
    ) {
      group.displayOrder = block.displayOrder;
    }

    let assigned = false;

    if (block.batting) {
      assignSectionToGroup(group, block.batting, "batting");
      assigned = true;
    }

    if (block.pitching) {
      assignSectionToGroup(group, block.pitching, "pitching");
      assigned = true;
    }

    if (block.fielding) {
      assignSectionToGroup(group, block.fielding, "fielding");
      assigned = true;
    }

    if (assignStatBlocksByTypeToGroup(group, block.statBlocksByType)) {
      assigned = true;
    }

    if (Array.isArray(block.statBlocks) && block.statBlocks.length > 0) {
      block.statBlocks.forEach((section) => {
        assignSectionToGroup(group, section);
      });

      assigned = true;
    }

    if (Array.isArray(block.statistics) && block.statistics.length > 0) {
      block.statistics.forEach((section) => {
        assignSectionToGroup(group, section);
      });

      assigned = true;
    }

    if (
      !assigned &&
      (Array.isArray(block.athletes) || Array.isArray(block.keys))
    ) {
      assignSectionToGroup(group, toTopLevelSection(block));
    }
  });

  return groups.sort((a, b) => {
    const aOrder = Number(a.displayOrder ?? 999);
    const bOrder = Number(b.displayOrder ?? 999);
    return aOrder - bOrder;
  });
};

const getTeamIdFromGroup = (
  teamGroup: TeamGroup | null,
  fallbackTeamId?: number | string | null,
) => {
  return fallbackTeamId ?? teamGroup?.team?.id ?? teamGroup?.team?.espnId;
};

const getDisplayLabels = (
  section: StatSection | null | undefined,
  sectionType: StatSectionType,
) => {
  const labels = Array.isArray(section?.labels) ? section.labels : [];
  const names = Array.isArray(section?.names) ? section.names : [];
  const keys = Array.isArray(section?.keys) ? section.keys : [];

  if (labels.length > 0) return labels;
  if (names.length > 0) return names;
  if (keys.length > 0) return keys;

  if (sectionType === "pitching") return PITCHING_FALLBACK_LABELS;
  if (sectionType === "fielding") return FIELDING_FALLBACK_LABELS;

  return BATTING_FALLBACK_LABELS;
};

const getStatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value);
};

const getDidNotPlayText = (player: MlbPlayerStat) => {
  if (!player.didNotPlay) return null;

  if (player.reason) {
    return `DID NOT PLAY: ${String(player.reason).toUpperCase()}`;
  }

  return "DID NOT PLAY";
};

// ---------------------------------------------------------------------------
// Presentational subcomponents
// Pulled out of the parent so they get real memoization (previously these
// were re-declared as closures on every BoxScore render, which meant React
// could never bail out of re-rendering them).
// ---------------------------------------------------------------------------

type Styles = ReturnType<typeof boxScoreStyles>;

const rowStyle = (styles: Styles, index: number) => [
  styles.tableRow,
  index % 2 === 1 ? styles.rowAlt : null,
];

const PlayerNameRow = memo(function PlayerNameRow({
  styles,
  index,
  playerName,
  onPress,
}: {
  styles: Styles;
  index: number;
  playerName: string;
  onPress: () => void;
}) {
  return (
    <View style={rowStyle(styles, index)}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <Text style={styles.cellName} numberOfLines={1}>
          {playerName}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const PlayerStatRow = memo(function PlayerStatRow({
  styles,
  index,
  labels,
  values,
  didNotPlayText,
}: {
  styles: Styles;
  index: number;
  labels: string[];
  values: (string | number | null | undefined)[];
  didNotPlayText: string | null;
}) {
  return (
    <View style={rowStyle(styles, index)}>
      {didNotPlayText ? (
        <View
          style={[
            styles.didNotPlayerRow,
            { minWidth: labels.length * COLUMN_WIDTH },
          ]}
        >
          <Text style={styles.didNotPlayCell} numberOfLines={1}>
            {didNotPlayText}
          </Text>
        </View>
      ) : (
        labels.map((_, statIndex) => (
          <View key={statIndex} style={styles.cellContainer}>
            <Text style={styles.cell}>{getStatValue(values[statIndex])}</Text>
          </View>
        ))
      )}
    </View>
  );
});

const TotalsRow = memo(function TotalsRow({
  styles,
  labels,
  totals,
  variant,
}: {
  styles: Styles;
  labels: string[];
  totals: (string | number | null | undefined)[];
  variant: "name" | "stats";
}) {
  if (variant === "name") {
    return (
      <View style={[styles.tableRow, styles.totalsRow]}>
        <Text style={styles.cellName} numberOfLines={1}>
          Total
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.tableRow, styles.totalsRow]}>
      {labels.map((_, statIndex) => (
        <View key={statIndex} style={styles.cellContainer}>
          <Text style={styles.cell}>{getStatValue(totals[statIndex])}</Text>
        </View>
      ))}
    </View>
  );
});

const StatSectionTable = memo(function StatSectionTable({
  styles,
  sectionKey,
  title,
  sectionType,
  teamId,
  section,
  isExpanded,
  heightAnim,
  onPlayerPress,
}: {
  styles: Styles;
  sectionKey: string;
  title: string;
  sectionType: StatSectionType;
  teamId?: number | string | null;
  section?: StatSection | null;
  isExpanded: boolean;
  heightAnim: Animated.Value;
  onPlayerPress: (
    playerId: number | string | undefined | null,
    teamId: number | string | undefined | null,
  ) => void;
}) {
  const hasPlayers = hasSectionContent(section);
  const players =
    hasPlayers && Array.isArray(section?.athletes) ? section.athletes : [];

  const labels = getDisplayLabels(section, sectionType);

  const visiblePlayers = isExpanded
    ? players
    : players.slice(0, COLLAPSED_ROWS);

  const emptyText =
    sectionType === "pitching"
      ? "No pitching stats available."
      : sectionType === "fielding"
        ? "No fielding stats available."
        : "No batting stats available.";

  const shouldRenderTotals = hasSectionTotals(section);
  const animatedStyle = { maxHeight: heightAnim, overflow: "hidden" as const };

  return (
    <View style={styles.section}>
      <Text style={styles.categoryLabel}>{title}</Text>

      <View style={styles.playerColumn}>
        {/* Sticky player name column */}
        <View style={styles.playerNameColumn}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellName}>Player</Text>
          </View>

          <Animated.View style={animatedStyle}>
            {hasPlayers ? (
              <>
                {visiblePlayers.map((player, index) => {
                  const playerId = getPlayerId(player);
                  const playerTeamId = getPlayerTeamId(player, teamId);

                  return (
                    <PlayerNameRow
                      key={`${sectionKey}-name-${playerId ?? index}`}
                      styles={styles}
                      index={index}
                      playerName={getPlayerName(player)}
                      onPress={() => onPlayerPress(playerId, playerTeamId)}
                    />
                  );
                })}

                {shouldRenderTotals ? (
                  <TotalsRow
                    styles={styles}
                    labels={labels}
                    totals={section?.totals ?? []}
                    variant="name"
                  />
                ) : null}
              </>
            ) : (
              <View style={rowStyle(styles, 0)}>
                <Text style={styles.cellName} numberOfLines={1}>
                  —
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        {/* Scrollable stat columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View
              style={[
                styles.tableHeader,
                { minWidth: labels.length * COLUMN_WIDTH },
              ]}
            >
              {labels.map((label, index) => (
                <Text key={`${label}-${index}`} style={styles.cell}>
                  {label}
                </Text>
              ))}
            </View>

            <Animated.View style={animatedStyle}>
              {hasPlayers ? (
                <>
                  {visiblePlayers.map((player, index) => {
                    const playerId = getPlayerId(player);

                    return (
                      <PlayerStatRow
                        key={`${sectionKey}-stats-${playerId ?? index}`}
                        styles={styles}
                        index={index}
                        labels={labels}
                        values={Array.isArray(player.stats) ? player.stats : []}
                        didNotPlayText={getDidNotPlayText(player)}
                      />
                    );
                  })}

                  {shouldRenderTotals ? (
                    <TotalsRow
                      styles={styles}
                      labels={labels}
                      totals={section?.totals ?? []}
                      variant="stats"
                    />
                  ) : null}
                </>
              ) : (
                <View style={rowStyle(styles, 0)}>
                  <View
                    style={[
                      styles.didNotPlayerRow,
                      { minWidth: labels.length * COLUMN_WIDTH },
                    ]}
                  >
                    <Text style={styles.didNotPlayCell}>{emptyText}</Text>
                  </View>
                </View>
              )}
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
});

const TeamHeader = memo(function TeamHeader({
  styles,
  teamName,
  teamLogo,
}: {
  styles: Styles;
  teamName?: string | null;
  teamLogo?: any;
}) {
  return (
    <View style={styles.teamHeader}>
      {teamLogo ? (
        <Image source={teamLogo} style={styles.teamLogo} resizeMode="contain" />
      ) : null}
      <Text style={styles.teamLabel} numberOfLines={1}>
        {teamName}
      </Text>
    </View>
  );
});

const ExpandToggle = memo(function ExpandToggle({
  styles,
  expanded,
  onPress,
}: {
  styles: Styles;
  expanded: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      style={styles.showMoreLessButton}
    >
      <Text style={styles.showMoreLess}>
        {expanded ? "Show Less" : "Show More"}
      </Text>
    </TouchableOpacity>
  );
});

const TeamBox = memo(function TeamBox({
  styles,
  sectionKey,
  teamId,
  teamName,
  teamLogo,
  teamGroup,
  expandedSections,
  heightAnims,
  onTogglePlayerSection,
  onPlayerPress,
}: {
  styles: Styles;
  sectionKey: "away" | "home";
  teamId?: number | string | null;
  teamName?: string | null;
  teamLogo?: any;
  teamGroup: TeamGroup | null;
  expandedSections: Record<string, boolean>;
  heightAnims: Record<string, Animated.Value>;
  onTogglePlayerSection: (
    teamKey: "away" | "home",
    teamGroup: TeamGroup,
  ) => void;
  onPlayerPress: (
    playerId: number | string | undefined | null,
    teamId: number | string | undefined | null,
  ) => void;
}) {
  if (!teamGroup) return null;

  const resolvedTeamId = getTeamIdFromGroup(teamGroup, teamId);

  const sectionConfigs: {
    key: string;
    title: string;
    type: StatSectionType;
    section?: StatSection | null;
  }[] = [
    {
      key: `${sectionKey}-batting`,
      title: "Batting",
      type: "batting",
      section: teamGroup.batting,
    },
    {
      key: `${sectionKey}-pitching`,
      title: "Pitching",
      type: "pitching",
      section: teamGroup.pitching,
    },
  ];

  if (hasRenderableSection(teamGroup.fielding)) {
    sectionConfigs.push({
      key: `${sectionKey}-fielding`,
      title: "Fielding",
      type: "fielding",
      section: teamGroup.fielding,
    });
  }

  const expandableKeys = sectionConfigs
    .filter(({ section }) => hasExpandableSection(section))
    .map(({ key }) => key);

  const canExpandTeam = expandableKeys.length > 0;
  const teamExpanded =
    canExpandTeam && expandableKeys.every((key) => expandedSections[key]);

  return (
    <View style={styles.teamContainer}>
      <TeamHeader styles={styles} teamName={teamName} teamLogo={teamLogo} />

      {sectionConfigs.map(({ key, title, type, section }) => (
        <StatSectionTable
          key={key}
          styles={styles}
          sectionKey={key}
          title={title}
          sectionType={type}
          teamId={resolvedTeamId}
          section={section}
          isExpanded={expandedSections[key] ?? false}
          heightAnim={heightAnims[key]}
          onPlayerPress={onPlayerPress}
        />
      ))}

      {canExpandTeam ? (
        <ExpandToggle
          styles={styles}
          expanded={teamExpanded}
          onPress={() => onTogglePlayerSection(sectionKey, teamGroup)}
        />
      ) : null}
    </View>
  );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function BoxScore({
  score,
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  playerStats,
  stats,
  isLoading = false,
  isError = false,
  league = "mlb",
  isDark,
  state,
}: Props) {
  const styles = useMemo(() => boxScoreStyles(isDark), [isDark]);
  const global = useMemo(() => globalStyles(isDark), [isDark]);

  const heightAnimMap = useRef<Record<string, Animated.Value>>({});
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const resolvedScore = useMemo(() => resolveScoreShape(score), [score]);

  const resolvedState = state ?? resolvedScore?.status;

  const resolvedPlayerStats = useMemo(() => {
    return getPlayerStatsArray(playerStats ?? stats ?? resolvedScore ?? score);
  }, [playerStats, resolvedScore, score, stats]);

  const teamGroups = useMemo(() => {
    return getTeamGroups(resolvedPlayerStats);
  }, [resolvedPlayerStats]);

  const getHeightAnim = useCallback((sectionKey: string) => {
    if (!heightAnimMap.current[sectionKey]) {
      heightAnimMap.current[sectionKey] = new Animated.Value(PLAYER_ROW_HEIGHT);
    }

    return heightAnimMap.current[sectionKey];
  }, []);

  const findTeamGroup = useCallback(
    (
      targetTeamId?: number | string | null,
      targetTeamCode?: string | null,
      targetHomeAway?: "home" | "away",
      fallbackIndex?: number,
    ) => {
      const targetIdentifier = normalizeIdentifier(targetTeamId);
      const targetCodeIdentifier = normalizeIdentifier(targetTeamCode);

      const byHomeAway = teamGroups.find((group) => {
        return targetHomeAway && group.homeAway === targetHomeAway;
      });

      if (byHomeAway) return byHomeAway;

      if (targetIdentifier || targetCodeIdentifier) {
        const matchedGroup = teamGroups.find((group) => {
          const groupIdentifiers = collectTeamIdentifiers(group.team);

          return (
            Boolean(
              targetIdentifier && groupIdentifiers.includes(targetIdentifier),
            ) ||
            Boolean(
              targetCodeIdentifier &&
              groupIdentifiers.includes(targetCodeIdentifier),
            )
          );
        });

        if (matchedGroup) return matchedGroup;
      }

      if (
        typeof fallbackIndex === "number" &&
        teamGroups.length > fallbackIndex
      ) {
        return teamGroups[fallbackIndex];
      }

      return null;
    },
    [teamGroups],
  );

  const awayTeamGroup = useMemo(
    () => findTeamGroup(awayTeamId, awayName, "away", 0),
    [findTeamGroup, awayName, awayTeamId],
  );

  const homeTeamGroup = useMemo(
    () => findTeamGroup(homeTeamId, homeName, "home", 1),
    [findTeamGroup, homeName, homeTeamId],
  );

  const getTeamSectionKeys = useCallback(
    (teamKey: "away" | "home", teamGroup: TeamGroup | null) => {
      if (!teamGroup) return [];

      const sectionConfigs = [
        { key: `${teamKey}-batting`, section: teamGroup.batting },
        { key: `${teamKey}-pitching`, section: teamGroup.pitching },
        { key: `${teamKey}-fielding`, section: teamGroup.fielding },
      ];

      return sectionConfigs
        .filter(({ section }) => hasExpandableSection(section))
        .map(({ key }) => key);
    },
    [],
  );

  const toggleTeamExpand = useCallback(
    (teamKey: "away" | "home", teamGroup: TeamGroup) => {
      const sectionKeys = getTeamSectionKeys(teamKey, teamGroup);

      if (sectionKeys.length === 0) return;

      setExpandedSections((prev) => {
        const shouldCollapse = sectionKeys.every((key) => prev[key]);
        const next = { ...prev };

        sectionKeys.forEach((key) => {
          next[key] = !shouldCollapse;
        });

        return next;
      });
    },
    [getTeamSectionKeys],
  );

  // Pre-create animated values for every section so child components can
  // receive a stable Animated.Value reference as a prop.
  const heightAnims = useMemo(() => {
    const keys = [
      "away-batting",
      "away-pitching",
      "away-fielding",
      "home-batting",
      "home-pitching",
      "home-fielding",
    ];

    return keys.reduce<Record<string, Animated.Value>>((acc, key) => {
      acc[key] = getHeightAnim(key);
      return acc;
    }, {});
  }, [getHeightAnim]);

  useEffect(() => {
    const sections = [
      { key: "away-batting", section: awayTeamGroup?.batting },
      { key: "away-pitching", section: awayTeamGroup?.pitching },
      { key: "away-fielding", section: awayTeamGroup?.fielding },
      { key: "home-batting", section: homeTeamGroup?.batting },
      { key: "home-pitching", section: homeTeamGroup?.pitching },
      { key: "home-fielding", section: homeTeamGroup?.fielding },
    ];

    sections.forEach(({ key, section }) => {
      const isExpanded = expandedSections[key] ?? false;
      const playerCount = section?.athletes?.length ?? 0;
      const totalRowCount = hasSectionTotals(section) ? 1 : 0;
      const fallbackRowCount = playerCount === 0 ? 1 : 0;
      const rowCount = playerCount + totalRowCount + fallbackRowCount;

      const targetHeight = isExpanded
        ? rowCount * PLAYER_ROW_HEIGHT
        : Math.min(rowCount, COLLAPSED_ROWS + totalRowCount) *
          PLAYER_ROW_HEIGHT;

      Animated.timing(heightAnims[key], {
        toValue: targetHeight,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [awayTeamGroup, expandedSections, heightAnims, homeTeamGroup]);

  const handlePlayerPress = useCallback(
    (
      playerId: number | string | undefined | null,
      teamId: number | string | undefined | null,
    ) => {
      if (!playerId || !teamId) return;

      router.push({
        pathname: "/player/baseball/[id]",
        params: {
          id: String(playerId),
          teamId: String(teamId),
          league,
        },
      });
    },
    [league],
  );

  if (resolvedState === "pre" || resolvedState === "scheduled") {
    return null;
  }

  if (isLoading) {
    return (
      <ScrollView>
        <HeadingTwo isDark={isDark}>Box Score</HeadingTwo>
        <Text style={global.errorText}>Loading box score...</Text>
      </ScrollView>
    );
  }

  if (isError) {
    return (
      <ScrollView>
        <HeadingTwo isDark={isDark}>Box Score</HeadingTwo>
        <Text style={global.errorText}>Failed to load box score.</Text>
      </ScrollView>
    );
  }

  if (!awayTeamGroup && !homeTeamGroup) {
    return null;
  }

  return (
    <ScrollView>
      <HeadingTwo isDark={isDark}>Box Score</HeadingTwo>

      <TeamBox
        styles={styles}
        sectionKey="away"
        teamId={awayTeamId}
        teamName={awayName}
        teamLogo={awayLogo}
        teamGroup={awayTeamGroup}
        expandedSections={expandedSections}
        heightAnims={heightAnims}
        onTogglePlayerSection={toggleTeamExpand}
        onPlayerPress={handlePlayerPress}
      />

      <View style={styles.teamGap} />

      <TeamBox
        styles={styles}
        sectionKey="home"
        teamId={homeTeamId}
        teamName={homeName}
        teamLogo={homeLogo}
        teamGroup={homeTeamGroup}
        expandedSections={expandedSections}
        heightAnims={heightAnims}
        onTogglePlayerSection={toggleTeamExpand}
        onPlayerPress={handlePlayerPress}
      />
    </ScrollView>
  );
}

export const boxScoreStyles = (isDark: boolean) =>
  StyleSheet.create({
    playerColumn: {
      flexDirection: "row",
      width: "100%",
    },
    loading: {
      padding: 20,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    error: {
      padding: 20,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
      textAlign: "center",
    },
    teamGap: { height: 24 },
    teamContainer: {
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 12,
      overflow: "hidden",
    },
    teamHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.midTone,
    },
    teamLabel: {
      flexShrink: 1,
      fontFamily: Fonts.BOLD,
      fontSize: 18,
      color: isDark ? Colors.white : Colors.black,
    },
    section: {
      paddingTop: 10,
      paddingBottom: 2,
    },
    categoryLabel: {
      marginBottom: 4,
      paddingHorizontal: 8,
      fontFamily: Fonts.BOLD,
      fontSize: 12,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    playerNameColumn: {
      width: NAME_COLUMN_WIDTH,
    },
    tableHeader: {
      flexDirection: "row",
      height: 40,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderColor: isDark ? Colors.lightGray : Colors.darkGray,
    },
    tableRow: {
      flexDirection: "row",
      height: PLAYER_ROW_HEIGHT,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.midTone,
    },
    rowAlt: {
      backgroundColor: isDark
        ? Colors.transparentDarkGray
        : Colors.transparentLightGray,
    },
    totalsRow: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.midTone,
    },
    cellName: {
      width: NAME_COLUMN_WIDTH,
      paddingHorizontal: 8,
      fontFamily: Fonts.BOLD,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },
    cell: {
      width: COLUMN_WIDTH,
      paddingHorizontal: 4,
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    didNotPlayerRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    didNotPlayCell: {
      flex: 1,
      fontFamily: Fonts.MEDIUM,
      fontSize: 12,
      color: Colors.midTone,
      textAlign: "center",
    },
    cellHeader: {
      width: COLUMN_WIDTH,
      paddingHorizontal: 4,
      fontFamily: Fonts.MEDIUM,
      fontSize: 13,
      color: isDark ? Colors.white : Colors.black,
      textAlign: "center",
    },
    cellContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    teamLogo: {
      width: 28,
      height: 28,
    },
    showMoreLessButton: {
      alignItems: "center",
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.midTone,
    },
    showMoreLess: {
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },
  });
