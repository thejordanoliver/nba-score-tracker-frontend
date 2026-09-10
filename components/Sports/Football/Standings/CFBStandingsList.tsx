// components/CFBStandingsList.tsx
import Dropdown from "@/components/Dropdown";
import HeadingTwo from "@/components/Headings/HeadingTwo";
import { Ionicons } from "@expo/vector-icons";
import { StandingsSkeleton } from "components/Skeletons/StandingsSkeleton";
import { Colors, Fonts, globalStyles } from "constants/styles";
import { getCFBTeam, getCFBTeamLogo } from "constants/teamsCFB";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { usePreferences } from "contexts/PreferencesContext";
import { useRouter } from "expo-router";
import {
  CFBTeamRank,
  useCFBRankings,
} from "hooks/FootballHooks/useCFBRankings";
import { useState } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StandingsStyles } from "styles/LeagueStyles/StandingsStyles";

type PollMode = "ap" | "coaches" | "cfp" | "fcs";

const POLL_OPTIONS: { label: string; value: PollMode }[] = [
  { label: "AP Poll", value: "ap" },
  { label: "Coaches Poll", value: "coaches" },
  { label: "CFP Rankings", value: "cfp" },
  { label: "FCS Coaches Poll", value: "fcs" },
];

const POLL_TITLES: Record<PollMode, string> = {
  ap: "AP Poll",
  coaches: "Coaches Poll",
  cfp: "CFP Rankings",
  fcs: "FCS Coaches Poll",
};

export const CFBStandingsList = () => {
  const { rankings, loading, error, refresh } = useCFBRankings();
  const { resolvedColorScheme } = usePreferences();
  const { isFavorite } = useFavoriteTeamsContext();

  const isDark = resolvedColorScheme === "dark";
  const global = globalStyles(isDark);
  const styles = StandingsStyles(isDark);
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [pollMode, setPollMode] = useState<PollMode>("ap");

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <StandingsSkeleton />;
  }

  if (error) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>{error}</Text>
      </View>
    );
  }

  const selectedPoll = rankings.find((poll) => poll.type === pollMode);

  const filteredRankings = selectedPoll?.ranks ?? [];
  const droppedOutTeams = selectedPoll?.droppedOut ?? [];
  const pollTitle = selectedPoll?.shortName || POLL_TITLES[pollMode];

  const renderLeftItem = ({
    item,
    index,
  }: {
    item: CFBTeamRank;
    index: number;
  }) => {
    const isLastRow = index === filteredRankings.length - 1;
    const team = getCFBTeam(item.team?.id ?? "");
    const teamId = team?.id ?? 0;
    const teamLogo = getCFBTeamLogo(teamId, isDark);
    const teamCode = team?.code || "N/A";

    const trendNum = Number(item.trend);
    const hasTrend = Number.isFinite(trendNum) && trendNum !== 0;
    const isUp = trendNum > 0;
    const favorited = team ? isFavorite("cfb", team.id) : false;

    const trendColor = isUp
      ? isDark
        ? Colors.dark.leafGreen
        : Colors.light.green
      : isDark
        ? Colors.dark.lightRed
        : Colors.light.red;

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
          <Text style={styles.rankText}>{item.current}</Text>
        </View>

        <View style={styles.teamInfo}>
          <TouchableOpacity
            disabled={!teamId}
            onPress={() => {
              if (!teamId) return;

              router.push({
                pathname: "/team/cfb/[teamId]",
                params: { teamId: String(teamId) },
              });
            }}
            style={styles.teamInfoWrapper}
          >
            {teamLogo && <Image source={teamLogo} style={styles.logo} />}

            <Text style={styles.collegeTeamName}>{teamCode}</Text>
          </TouchableOpacity>

          {hasTrend && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={isUp ? "arrow-up" : "arrow-down"}
                size={10}
                color={trendColor}
                style={{ marginRight: 2 }}
              />

              <Text
                style={[
                  styles.collegeTeamTrend,
                  {
                    color: trendColor,
                  },
                ]}
              >
                {Math.abs(trendNum)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderRightItem = ({
    item,
    index,
  }: {
    item: CFBTeamRank;
    index: number;
  }) => {
    const isLastRow = index === filteredRankings.length - 1;
    const team = getCFBTeam(item.team?.id ?? "");
    const favorited = team ? isFavorite("cfb", team.id) : false;

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
        <View style={styles.statCell}>
          <Text style={styles.statText}>{item.recordSummary || "N/A"}</Text>
        </View>

        <View style={styles.statCell}>
          <Text style={styles.statText}>{item.points ?? 0}</Text>
        </View>

        <View style={styles.statCell}>
          <Text style={styles.statText}>{item.firstPlaceVotes ?? 0}</Text>
        </View>

        <View style={styles.statCell}>
          <Text style={styles.statText}>
            {item.team?.groups?.shortName ||
              item.team?.groups?.parent?.shortName ||
              "N/A"}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.statsHeaderRow}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#</Text>
      </View>

      <Text style={styles.teamHeaderText}>Team</Text>
    </View>
  );

  const renderStatsHeader = () => (
    <View
      style={[
        styles.row,
        {
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
        },
      ]}
    >
      {["Record", "Points", "1st Votes", "Conference"].map((label) => (
        <View key={label} style={styles.statCell}>
          <Text
            style={[
              styles.statText,
              {
                fontFamily: Fonts.SEMIBOLD,
                color: isDark ? Colors.white : Colors.black,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderDroppedOut = () => {
    if (!droppedOutTeams.length) {
      return null;
    }

    return (
      <View style={styles.droppedoutContainer}>
        <HeadingTwo isDark={isDark}>Dropped From Rankings</HeadingTwo>

        <View style={styles.droppedoutWrapper}>
          {droppedOutTeams.map((item, index) => {
            const team = getCFBTeam(item.team?.id ?? "");
            const teamId = item.team?.id;
            const teamName = team?.shortName || team?.name || "N/A";
            const teamLogo = getCFBTeamLogo(teamId, isDark);
            return (
              <View key={item.team?.id} style={styles.droppedoutRow}>
                {teamLogo && (
                  <Image source={teamLogo} style={styles.droppedoutLogo} />
                )}
                <Text style={styles.droppedoutName}>
                  {teamName} ({item.previous})
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const Section = ({ title, data }: { title: string; data: CFBTeamRank[] }) => {
    return (
      <View style={styles.wrapper}>
        <View style={styles.header}>
          <Text style={styles.heading}>{title}</Text>
        </View>

        {data.length === 0 ? (
          <View style={global.emptyContainer}>
            <Text style={global.emptyText}>
              Rankings are not currently available.
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: "row" }}>
            <FlatList
              data={data}
              keyExtractor={(item, index) =>
                item.team?.id
                  ? String(item.team.id)
                  : `left-${index}-${item.date}`
              }
              renderItem={renderLeftItem}
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
                keyExtractor={(item, index) =>
                  item.team?.id
                    ? String(item.team.id)
                    : `right-${index}-${item.date}`
                }
                renderItem={renderRightItem}
                scrollEnabled={false}
                ListHeaderComponent={renderStatsHeader}
                stickyHeaderIndices={[0]}
              />
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.dropdownRow}>
        <Dropdown
          options={POLL_OPTIONS}
          selectedValue={pollMode}
          onSelect={(value) => setPollMode(value as PollMode)}
          isDark={isDark}
        />
      </View>

      <Section title={pollTitle} data={filteredRankings} />

      {renderDroppedOut()}
    </ScrollView>
  );
};
