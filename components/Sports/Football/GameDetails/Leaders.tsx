// components/Sports/Football/GameDetails/GameLeaders.tsx

import type {
  Athlete,
  LeaderCategory,
  LeaderEntry,
  TeamLeaders,
} from "@/hooks/FootballHooks/useFootballGameDetails";
import Placeholder from "assets/Placeholders/playerPlaceholder.png";
import HeadingTwo from "components/Headings/HeadingTwo";
import GameLeadersSkeleton from "components/Skeletons/GameDetails/GameLeadersSkeleton";
import MainScrollTabBar from "components/TabBars/MainTabScrollBar";
import { Colors, Fonts, globalStyles } from "constants/styles";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from "react-native";
import { LeadersStyles } from "styles/GameDetailStyles/GameLeadersStyles";

const GAME_CATEGORIES = [
  "Passing",
  "Rushing",
  "Receiving",
  "Defensive",
  "Kicking",
  "Punting",
] as const;

type Category = (typeof GAME_CATEGORIES)[number];

type Side = "away" | "home";

type Props = {
  leaders?: TeamLeaders[];
  awayLogo: ImageSourcePropType | null;
  homeLogo: ImageSourcePropType | null;
  awayCode: string;
  homeCode: string;
  homeId: string | number;
  awayId: string | number;
  isDark: boolean;
  league: string;
  state?: string | null;
  loading?: boolean;
  error?: boolean;
};

type DisplayLeader = {
  side: Side;
  category: LeaderCategory;
  entry: LeaderEntry;
};

type StatDefinition = {
  label: string;
  index: number;
};

type DisplayStat = {
  label: string;
  value: string | number;
};

const CATEGORY_KEYS: Record<Category, string[]> = {
  Passing: ["passing", "passingyards"],
  Rushing: ["rushing", "rushingyards"],
  Receiving: ["receiving", "receivingyards"],
  Defensive: ["defensive", "defense", "totaltackles", "sacks", "interceptions"],
  Kicking: [
    "kicking",
    "fieldgoalsmade",
    "fieldgoals",
    "kickingpoints",
    "extrapointsmade",
  ],
  Punting: ["punting", "puntyards", "punts", "grossavgpuntyards"],
};

/*
 * These indexes match the order of the stats arrays returned
 * by the football game-details API.
 */
const STAT_DEFINITIONS: Record<string, StatDefinition[]> = {
  passing: [
    { label: "CMP/ATT", index: 0 },
    { label: "YDS", index: 1 },
    { label: "TD", index: 3 },
    { label: "AVG", index: 2 },
  ],

  passingyards: [
    { label: "CMP/ATT", index: 0 },
    { label: "YDS", index: 1 },
    { label: "TD", index: 3 },
    { label: "AVG", index: 2 },
  ],

  rushing: [
    { label: "CAR", index: 0 },
    { label: "YDS", index: 1 },
    { label: "TD", index: 3 },
    { label: "AVG", index: 2 },
  ],

  rushingyards: [
    { label: "CAR", index: 0 },
    { label: "YDS", index: 1 },
    { label: "TD", index: 3 },
    { label: "AVG", index: 2 },
  ],

  receiving: [
    { label: "REC", index: 0 },
    { label: "YDS", index: 1 },
    { label: "TD", index: 3 },
    { label: "AVG", index: 2 },
  ],

  receivingyards: [
    { label: "REC", index: 0 },
    { label: "YDS", index: 1 },
    { label: "TD", index: 3 },
    { label: "AVG", index: 2 },
  ],

  defensive: [
    { label: "TOT", index: 0 },
    { label: "SOLO", index: 1 },
    { label: "SACKS", index: 2 },
    { label: "TFL", index: 3 },
  ],

  defense: [
    { label: "TOT", index: 0 },
    { label: "SOLO", index: 1 },
    { label: "SACKS", index: 2 },
    { label: "TFL", index: 3 },
  ],

  totaltackles: [
    { label: "TOT", index: 0 },
    { label: "SOLO", index: 1 },
    { label: "SACKS", index: 2 },
    { label: "TFL", index: 3 },
  ],

  interceptions: [
    { label: "INT", index: 0 },
    { label: "YDS", index: 1 },
    { label: "AVG", index: 2 },
    { label: "TD", index: 4 },
  ],

  kicking: [
    { label: "FG", index: 0 },
    { label: "XP", index: 3 },
    { label: "LONG", index: 2 },
    { label: "PTS", index: 4 },
  ],

  fieldgoalsmade: [
    { label: "FG", index: 0 },
    { label: "XP", index: 3 },
    { label: "LONG", index: 2 },
    { label: "PTS", index: 4 },
  ],

  fieldgoals: [
    { label: "FG", index: 0 },
    { label: "XP", index: 3 },
    { label: "LONG", index: 2 },
    { label: "PTS", index: 4 },
  ],

  punting: [
    { label: "NO", index: 0 },
    { label: "YDS", index: 1 },
    { label: "AVG", index: 2 },
    { label: "LONG", index: 5 },
  ],

  puntyards: [
    { label: "NO", index: 0 },
    { label: "YDS", index: 1 },
    { label: "AVG", index: 2 },
    { label: "LONG", index: 5 },
  ],
};

function normalizeValue(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
}

function idsMatch(
  first: string | number | null | undefined,
  second: string | number | null | undefined,
): boolean {
  if (
    first === null ||
    first === undefined ||
    second === null ||
    second === undefined
  ) {
    return false;
  }

  return String(first).trim() === String(second).trim();
}

function findTeamLeaders(
  leaders: TeamLeaders[],
  teamId: string | number,
  teamCode: string,
): TeamLeaders | undefined {
  const normalizedCode = normalizeValue(teamCode);

  return leaders.find((teamLeaders) => {
    const team = teamLeaders.team;

    const matchesId =
      idsMatch(team?.id, teamId) || idsMatch(team?.espnId, teamId);

    const teamCodes = [
      normalizeValue(team?.code),
      normalizeValue(team?.shortName),
    ];

    return matchesId || teamCodes.includes(normalizedCode);
  });
}

function findCategory(
  teamLeaders: TeamLeaders | undefined,
  category: Category,
): LeaderCategory | undefined {
  if (!teamLeaders?.leaders?.length) {
    return undefined;
  }

  const categoryKeys = CATEGORY_KEYS[category];

  return teamLeaders.leaders.find((leaderCategory) => {
    const names = [
      normalizeValue(leaderCategory.name),
      normalizeValue(leaderCategory.displayName),
    ];

    return categoryKeys.some((key) => names.includes(normalizeValue(key)));
  });
}

function hasCategoryLeaders(
  teamLeaders: TeamLeaders | undefined,
  category: Category,
): boolean {
  const leaderCategory = findCategory(teamLeaders, category);

  return Boolean(leaderCategory?.leaders?.length);
}

function getHeadshotSource(headshot: Athlete["headshot"]): ImageSourcePropType {
  if (!headshot || typeof headshot !== "string") {
    return Placeholder;
  }

  return {
    uri: headshot,
  };
}

function getDisplayStats(
  category: LeaderCategory,
  entry: LeaderEntry,
): DisplayStat[] {
  const stats = Array.isArray(entry.stats) ? entry.stats : [];
  const categoryName = normalizeValue(category.name);
  const definitions = STAT_DEFINITIONS[categoryName];

  if (definitions?.length && stats.length) {
    return definitions.reduce<DisplayStat[]>((displayStats, definition) => {
      const value = stats[definition.index];

      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
      ) {
        displayStats.push({
          label: definition.label,
          value,
        });
      }

      return displayStats;
    }, []);
  }

  if (stats.length) {
    return stats.slice(0, 4).map((value, index) => ({
      label: `STAT ${index + 1}`,
      value: value ?? "–",
    }));
  }

  const fallbackValue =
    entry.mainStat?.value ?? entry.displayValue ?? entry.value;

  if (
    fallbackValue === null ||
    fallbackValue === undefined ||
    fallbackValue === ""
  ) {
    return [];
  }

  return [
    {
      label:
        entry.mainStat?.label ??
        category.shortDisplayName ??
        category.abbreviation ??
        "STAT",
      value: fallbackValue,
    },
  ];
}

function Stat({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string | number;
  isDark: boolean;
}) {
  const styles = LeadersStyles(isDark);

  return (
    <View style={{ marginRight: 12 }}>
      <Text
        style={{
          color: Colors.midTone,
          fontFamily: Fonts.MEDIUM,
          fontSize: 11,
        }}
      >
        {label}
      </Text>

      <Text style={styles.statText}>{value}</Text>
    </View>
  );
}

function LeaderStats({
  category,
  entry,
  isDark,
}: {
  category: LeaderCategory;
  entry: LeaderEntry;
  isDark: boolean;
}) {
  const displayStats = getDisplayStats(category, entry);

  return (
    <>
      {displayStats.map((stat) => (
        <Stat
          key={`${stat.label}-${stat.value}`}
          label={stat.label}
          value={stat.value}
          isDark={isDark}
        />
      ))}
    </>
  );
}

export default function GameLeaders({
  leaders,
  awayLogo,
  homeLogo,
  awayCode,
  homeCode,
  homeId,
  awayId,
  isDark,
  state,
  league,
  loading = false,
  error = false,
}: Props) {
  const styles = LeadersStyles(isDark);
  const global = globalStyles(isDark);

  const [selectedCategory, setSelectedCategory] = useState<Category>("Passing");

  const normalizedState = state?.trim().toLowerCase();

  const normalizedLeaders = useMemo<TeamLeaders[]>(
    () => (Array.isArray(leaders) ? leaders : []),
    [leaders],
  );

  const awayTeamLeaders = useMemo(() => {
    return (
      findTeamLeaders(normalizedLeaders, awayId, awayCode) ??
      normalizedLeaders[0]
    );
  }, [normalizedLeaders, awayId, awayCode]);

  const homeTeamLeaders = useMemo(() => {
    return (
      findTeamLeaders(normalizedLeaders, homeId, homeCode) ??
      normalizedLeaders[1]
    );
  }, [normalizedLeaders, homeId, homeCode]);

  const availableCategories = useMemo<Category[]>(() => {
    return GAME_CATEGORIES.filter(
      (category) =>
        hasCategoryLeaders(awayTeamLeaders, category) ||
        hasCategoryLeaders(homeTeamLeaders, category),
    );
  }, [awayTeamLeaders, homeTeamLeaders]);

  useEffect(() => {
    if (!availableCategories.length) {
      return;
    }

    if (!availableCategories.includes(selectedCategory)) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  const displayedLeaders = useMemo<DisplayLeader[]>(() => {
    const result: DisplayLeader[] = [];

    const awayCategory = findCategory(awayTeamLeaders, selectedCategory);

    const awayEntry = awayCategory?.leaders?.[0];

    if (awayCategory && awayEntry) {
      result.push({
        side: "away",
        category: awayCategory,
        entry: awayEntry,
      });
    }

    const homeCategory = findCategory(homeTeamLeaders, selectedCategory);

    const homeEntry = homeCategory?.leaders?.[0];

    if (homeCategory && homeEntry) {
      result.push({
        side: "home",
        category: homeCategory,
        entry: homeEntry,
      });
    }

    return result;
  }, [awayTeamLeaders, homeTeamLeaders, selectedCategory]);

  if (normalizedState !== "in" && normalizedState !== "post") {
    return null;
  }

  if (loading) {
    return <GameLeadersSkeleton />;
  }

  if (error) {
    return (
      <View>
        <HeadingTwo isDark={isDark}>Game Leaders</HeadingTwo>

        <View style={styles.wrapper}>
          <View style={global.emptyContainer}>
            <Text style={global.errorText}>Failed to load leaders</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!availableCategories.length) {
    return null;
  }

  return (
    <View>
      <HeadingTwo isDark={isDark}>Game Leaders</HeadingTwo>

      <View style={styles.wrapper}>
        <MainScrollTabBar
          tabs={availableCategories}
          selected={selectedCategory}
          onTabPress={setSelectedCategory}
          isDark={isDark}
        />

        {displayedLeaders.map(({ side, category, entry }) => {
          const isAway = side === "away";
          const teamLogo = isAway ? awayLogo : homeLogo;
          const teamId = isAway ? awayId : homeId;
          const player = entry.athlete;

          const playerId = player.id ?? player.espnId;

          const playerName =
            player.shortName ??
            player.displayName ??
            player.fullName ??
            "Unknown Player";

          const jersey = player.jersey ? `#${player.jersey}` : null;

          const handlePress = () => {
            if (playerId === null || playerId === undefined) {
              return;
            }

            router.push({
              pathname: "/player/football/[id]",
              params: {
                id: String(playerId),
                teamId: String(teamId),
                league,
              },
            });
          };

          return (
            <Pressable
              key={`${side}-${category.name}-${playerId ?? playerName}`}
              onPress={handlePress}
              disabled={playerId === null || playerId === undefined}
              style={({ pressed }) => [
                pressed && playerId != null && styles.pressed,
              ]}
            >
              <View style={styles.card}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={getHeadshotSource(player.headshot)}
                    style={styles.avatar}
                  />
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.nameRow}>
                    <Text style={styles.playerName}>{playerName}</Text>

                    {jersey ? (
                      <Text style={styles.jersey}>{jersey}</Text>
                    ) : null}
                  </View>

                  <View style={styles.statRow}>
                    <LeaderStats
                      category={category}
                      entry={entry}
                      isDark={isDark}
                    />
                  </View>
                </View>

                {teamLogo ? (
                  <Image
                    source={teamLogo}
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
