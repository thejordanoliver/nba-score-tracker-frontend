// components/StandingsList.tsx
import { getUFLTeam } from "@/constants/teamsUFL";
import { Dropdown } from "components/Dropdown";
import HeadingTwo from "components/Headings/HeadingTwo";
import { StandingsSkeleton } from "components/Skeletons/StandingsSkeleton";
import { Colors, globalStyles } from "constants/styles";
import { getNBATeamLogo, getTeamByESPNId } from "constants/teams";
import { getMLBTeamByEspnId, getMLBTeamLogo } from "constants/teamsMLB";
import { getNFLTeamByESPNId, getNFLTeamLogo } from "constants/teamsNFL";
import {
  getNHLTeamByEspnId as getNHLTeamByESPNId,
  getNHLTeamLogo,
} from "constants/teamsNHL";
import { getWNBATeamByESPNId, getWNBATeamLogo } from "constants/teamsWNBA";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { usePreferences } from "contexts/PreferencesContext";
import { useRouter } from "expo-router";
import {
  ConferenceStandings,
  StandingsTeam,
  useLeagueStandings,
} from "hooks/LeagueHooks/useLeagueStandings";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StandingsStyles } from "styles/LeagueStyles/StandingsStyles";
import { StatusBadge } from "./StatusBadge";
import { PlayoffLeague, StatusLegend } from "./StatusLegend";

type SectionType = {
  title: string;
  data: StandingsTeam[];
};

type Props = {
  year?: string;
  onYearChange?: (year: string) => void;
  league: PlayoffLeague;
  isGameDetailScreen?: boolean;
};

export const standingLabels = [
  "W-L",
  "Streak",
  "Win %",
  "GB",
  "Home",
  "Away",
  "Conf",
  "Div",
  "Last Ten",
  "Pts For",
  "Pts Against",
  "PPG",
  "OPP PPG",
];

const columnKeyMap: Record<string, keyof StandingsTeam> = {
  "W-L": "wins",
  Streak: "streak",
  "Win %": "winPercent",
  GB: "gamesBehind",
  Home: "homeRecord",
  Away: "roadRecord",
  Conf: "vsConf",
  Div: "vsDiv",
  "Last Ten": "lastTen",
  "Pts For": "pointsFor",
  "Pts Against": "pointsAgainst",
  PPG: "avgPointsFor",
  "OPP PPG": "avgPointsAgainst",
};

const getActiveColumns = (data: StandingsTeam[]) => {
  return standingLabels.filter((label) =>
    data.some((team) => {
      const key = columnKeyMap[label];

      return team[key] !== null && team[key] !== undefined;
    }),
  );
};

type ConferenceInfo = {
  name: string;
  code: string;
};

type LeagueConferenceConfig = {
  [key in PlayoffLeague]: {
    conferences: Record<string, ConferenceInfo>;
  };
};

export const leagueConferences: LeagueConferenceConfig = {
  mlb: {
    conferences: {
      conferenceA: {
        name: "American League",
        code: "AL",
      },
      conferenceB: {
        name: "National League",
        code: "NL",
      },
      conferenceC: {
        name: "Cactus League",
        code: "Cactus",
      },
      conferenceD: {
        name: "Grapefruit League",
        code: "Grapefruit",
      },
    },
  },

  nfl: {
    conferences: {
      conferenceA: {
        name: "American Football Conference",
        code: "AFC",
      },
      conferenceB: {
        name: "National Football Conference",
        code: "NFC",
      },
    },
  },

  ufl: {
    conferences: {
      conferenceA: {
        name: "United Football League",
        code: "UFL",
      },
    },
  },

  nba: {
    conferences: {
      conferenceA: {
        name: "Eastern Conference",
        code: "East",
      },
      conferenceB: {
        name: "Western Conference",
        code: "West",
      },
    },
  },

  wnba: {
    conferences: {
      conferenceA: {
        name: "Eastern Conference",
        code: "East",
      },
      conferenceB: {
        name: "Western Conference",
        code: "West",
      },
    },
  },

  nhl: {
    conferences: {
      conferenceA: {
        name: "Eastern Conference",
        code: "East",
      },
      conferenceB: {
        name: "Western Conference",
        code: "West",
      },
    },
  },
};

export const StandingsList = ({
  year,
  onYearChange,
  league,
  isGameDetailScreen,
}: Props) => {
  const {
    standings: conferences,
    regularSeasonOptions,
    loading,
    error,
  } = useLeagueStandings(league, year);

  const { resolvedColorScheme } = usePreferences();
  const { isFavorite } = useFavoriteTeamsContext();

  const isDark = resolvedColorScheme === "dark";
  const styles = StandingsStyles(isDark);
  const global = globalStyles(isDark);
  const router = useRouter();

  const [sortMode, setSortMode] = useState<"conference" | "division">(
    "conference",
  );

  const yearOptions = regularSeasonOptions;

  const safeYear = useMemo(() => {
    if (!yearOptions.length) {
      return year ?? "";
    }

    const selectedExists = yearOptions.some((option) => option.value === year);

    return selectedExists ? year : yearOptions[0].value;
  }, [year, yearOptions]);

  /**
   * Build division sections directly from the division information
   * returned by the standings API.
   *
   * This replaces the old nbaDivisionsById constant.
   */
  const divisionStandings = useMemo<SectionType[]>(() => {
    const groupedDivisions = new Map<
      string,
      {
        conferenceIndex: number;
        conferenceName: string;
        teams: StandingsTeam[];
      }
    >();

    conferences?.forEach(
      (conference: ConferenceStandings, conferenceIndex: number) => {
        conference.standings.forEach((team: StandingsTeam) => {
          const divisionName = team.division?.trim();

          if (!divisionName || divisionName.toLowerCase() === "unknown") {
            return;
          }

          const existingDivision = groupedDivisions.get(divisionName);

          if (existingDivision) {
            const teamAlreadyExists = existingDivision.teams.some(
              (existingTeam) => String(existingTeam.id) === String(team.id),
            );

            if (!teamAlreadyExists) {
              existingDivision.teams.push(team);
            }

            return;
          }

          groupedDivisions.set(divisionName, {
            conferenceIndex,
            conferenceName: conference.name,
            teams: [team],
          });
        });
      },
    );

    return Array.from(groupedDivisions.entries())
      .sort(([, divisionA], [, divisionB]) => {
        if (divisionA.conferenceIndex !== divisionB.conferenceIndex) {
          return divisionA.conferenceIndex - divisionB.conferenceIndex;
        }

        const conferenceCompare = divisionA.conferenceName.localeCompare(
          divisionB.conferenceName,
        );

        if (conferenceCompare !== 0) {
          return conferenceCompare;
        }

        return 0;
      })
      .map(([divisionName, division]) => ({
        title: divisionName.toLowerCase().endsWith("division")
          ? divisionName
          : `${divisionName} Division`,
        data: division.teams,
      }));
  }, [conferences]);

  const viewOptions = useMemo(
    () => [
      {
        label: "Conference",
        value: "conference",
      },
      {
        label: "Division",
        value: "division",
      },
    ],
    [],
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <StandingsSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={global.errorText}>{error}</Text>
      </View>
    );
  }

  const getTeam = (item: StandingsTeam) => {
    if (league === "nba") {
      return getTeamByESPNId(Number(item.id));
    }

    if (league === "wnba") {
      return getWNBATeamByESPNId(Number(item.id));
    }

    if (league === "nfl") {
      return getNFLTeamByESPNId(Number(item.id));
    }

    if (league === "ufl") {
      return getUFLTeam(Number(item.id));
    }

    if (league === "mlb") {
      return getMLBTeamByEspnId(item.id);
    }

    return getNHLTeamByESPNId(Number(item.id));
  };

  const getTeamRoute = () => {
    if (league === "nba") {
      return "/team/[teamId]" as const;
    }

    if (league === "nfl") {
      return "/team/nfl/[teamId]" as const;
    }

    if (league === "ufl") {
      return "/team/ufl/[teamId]" as const;
    }

    if (league === "wnba") {
      return "/team/wnba/[teamId]" as const;
    }

    if (league === "mlb") {
      return "/team/mlb/[teamId]" as const;
    }

    return "/team/nhl/[teamId]" as const;
  };

  const renderLeftItem = ({
    item,
    index,
    data,
  }: {
    item: StandingsTeam;
    index: number;
    data: StandingsTeam[];
  }) => {
    const team = getTeam(item);
    const route = getTeamRoute();

    const teamLogo =
      league === "nba"
        ? getNBATeamLogo(team?.id, isDark)
        : league === "wnba"
          ? getWNBATeamLogo(team?.id, isDark)
          : league === "nfl"
            ? getNFLTeamLogo(team?.id, isDark)
            : league === "mlb"
              ? getMLBTeamLogo(team?.id, isDark)
              : league === "nhl"
                ? getNHLTeamLogo(team?.id, isDark)
                : null;
    const id = team?.id ?? item.id;
    const teamCode = team?.code;

    const favorited = team ? isFavorite(league, team.id) : false;

    const isLastRow = index === data.length - 1;

    return (
      <View
        style={[
          styles.row,
          !isLastRow && {
            borderBottomWidth: 1,
            borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
          },
          favorited && {
            backgroundColor: isDark
              ? Colors.dark.itemBackground
              : Colors.light.itemBackground,
          },
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>

        <TouchableOpacity
          style={styles.teamInfo}
          onPress={() =>
            router.push({
              pathname: route,
              params: {
                teamId: String(id),
              },
            })
          }
        >
          {teamLogo ? (
            <Image source={teamLogo} style={styles.logo} />
          ) : (
            <View style={styles.logo} />
          )}

          <Text
            style={styles.teamName}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {teamCode}
          </Text>

          <StatusBadge code={item.clincher} league={league} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderRightItem = (activeColumns: string[]) =>
    function StandingsRightItem({
      item,
      index,
      data,
    }: {
      item: StandingsTeam;
      index: number;
      data: StandingsTeam[];
    }) {
      const team = getTeam(item);

      const favorited = team ? isFavorite(league, team.id) : false;

      const isLastRow = index === data.length - 1;

      const winStreak = item.streak?.startsWith("W");
      const lossStreak = item.streak?.startsWith("L");

      const streakColor = winStreak
        ? isDark
          ? Colors.dark.limeGreen
          : Colors.light.green
        : lossStreak
          ? isDark
            ? Colors.dark.lightRed
            : Colors.light.red
          : isDark
            ? Colors.dark.text
            : Colors.light.text;

      return (
        <View
          style={[
            styles.row,
            !isLastRow && {
              borderBottomWidth: 1,
              borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
            },
            favorited && {
              backgroundColor: isDark
                ? Colors.dark.itemBackground
                : Colors.light.itemBackground,
            },
          ]}
        >
          {activeColumns.map((label) => {
            const key = columnKeyMap[label];
            let value = item[key];

            if (label === "W-L") {
              value = `${item.wins ?? 0}-${item.losses ?? 0}`;
            }

            if (key === "winPercent" && value != null) {
              value = `${(Number(value) * 100).toFixed(1)}%`;
            }

            if ((label === "PPG" || label === "OPP PPG") && value != null) {
              value = Number(value).toFixed(1);
            }

            const numericValue = Number(value);

            if (
              value !== null &&
              value !== undefined &&
              !Number.isNaN(numericValue) &&
              numericValue >= 1000
            ) {
              value = numericValue.toLocaleString("en-US");
            }

            return (
              <View key={label} style={styles.statCell}>
                <Text
                  style={[
                    styles.statText,
                    key === "streak"
                      ? {
                          color: streakColor,
                        }
                      : undefined,
                  ]}
                >
                  {value ?? "-"}
                </Text>
              </View>
            );
          })}
        </View>
      );
    };

  const renderHeader = () => (
    <View style={styles.statsHeaderRow}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#</Text>
      </View>

      <View>
        <Text style={styles.teamHeaderText}>Team</Text>
      </View>
    </View>
  );

  const renderStatsHeader = (activeColumns: string[]) => (
    <View style={styles.statsHeaderRow}>
      {activeColumns.map((label) => (
        <View key={label} style={styles.statCell}>
          <Text style={styles.statText}>{label}</Text>
        </View>
      ))}
    </View>
  );

  function Section({
    title,
    data,
    isLast,
  }: {
    title: string;
    data: StandingsTeam[];
    isLast?: boolean;
  }) {
    const activeColumns = getActiveColumns(data);

    return (
      <View
        style={[
          styles.wrapper,
          {
            marginBottom: isLast ? 0 : 12,
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.heading}>{title}</Text>
        </View>

        <View style={{ flexDirection: "row" }}>
          <FlatList
            data={data}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={(props) =>
              renderLeftItem({
                ...props,
                data,
              })
            }
            scrollEnabled={false}
            ListHeaderComponent={renderHeader}
            stickyHeaderIndices={[0]}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ width: 220 }}
          >
            <FlatList
              data={data}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              renderItem={(props) =>
                renderRightItem(activeColumns)({
                  ...props,
                  data,
                })
              }
              scrollEnabled={false}
              ListHeaderComponent={() => renderStatsHeader(activeColumns)}
              stickyHeaderIndices={[0]}
            />
          </ScrollView>
        </View>
      </View>
    );
  }

  const conferenceConfig = leagueConferences[league].conferences;

  const conferenceSections = Object.values(conferenceConfig)
    .map((conference) => {
      const data =
        conferences?.find(
          (item) =>
            item.abbreviation === conference.code ||
            item.name === conference.name,
        )?.standings ?? [];

      if (!data.length) {
        return null;
      }

      return {
        title: conference.name,
        data,
      };
    })
    .filter(
      (
        section,
      ): section is {
        title: string;
        data: StandingsTeam[];
      } => section !== null,
    );

  const displayedSections =
    sortMode === "conference" ? conferenceSections : divisionStandings;

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      {isGameDetailScreen && <HeadingTwo isDark={isDark}>Standings</HeadingTwo>}

      <View style={styles.dropdownRow}>
        {league !== "wnba" && (
          <Dropdown
            options={viewOptions}
            selectedValue={sortMode}
            onSelect={(value) =>
              setSortMode(value as "conference" | "division")
            }
            isDark={isDark}
            width={140}
          />
        )}

        {onYearChange && yearOptions.length > 0 && (
          <Dropdown
            options={yearOptions}
            selectedValue={safeYear}
            onSelect={onYearChange}
            isDark={isDark}
            width={120}
          />
        )}
      </View>

      {displayedSections.map((section, index) => (
        <Section
          key={section.title}
          title={section.title}
          data={section.data}
          isLast={index === displayedSections.length - 1}
        />
      ))}

      <StatusLegend league={league} />
    </ScrollView>
  );
};
