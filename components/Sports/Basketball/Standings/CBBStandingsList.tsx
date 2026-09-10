// components/CBBStandingsList.tsx
import HeadingTwo from "@/components/Headings/HeadingTwo";
import {
  CBBTeamRank,
  useCBBRankings,
} from "@/hooks/BasketballHooks/useCBBRankings";
import { Ionicons } from "@expo/vector-icons";
import Dropdown from "components/Dropdown";
import { StandingsSkeleton } from "components/Skeletons/StandingsSkeleton";
import { Colors, Fonts, globalStyles } from "constants/styles";
import {
  getCBBTeam,
  getCBBTeamByESPNId,
  getCBBTeamLogo,
} from "constants/teamsCBB";
import {
  getWCBBTeam,
  getWCBBTeamByESPNId,
  getWCBBTeamLogo,
} from "constants/teamsWCBB";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { usePreferences } from "contexts/PreferencesContext";
import { useRouter } from "expo-router";
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
type Props = {
  league: "cbb" | "wcbb";
};

export const CBBStandingsList = ({ league = "cbb" }: Props) => {
  const { rankings, loading, error, refresh } = useCBBRankings(league);
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const router = useRouter();
  const styles = StandingsStyles(isDark);
  const global = globalStyles(isDark);
  const { isFavorite } = useFavoriteTeamsContext();
  const [refreshing, setRefreshing] = useState(false);
  const [pollMode, setPollMode] = useState<"ap" | "coaches">("ap");
  const isWCBB = league === "wcbb";
  const getRankedTeam = (espnId: string | number) =>
    isWCBB ? getWCBBTeamByESPNId(espnId) : getCBBTeamByESPNId(espnId ?? "");
  const getRankedTeamLogo = (teamId?: string | number) =>
    isWCBB
      ? getWCBBTeamLogo(teamId, isDark)
      : getCBBTeamLogo(teamId ?? undefined, isDark);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };
  if (loading) return <StandingsSkeleton />;

  if (error)
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>{error}</Text>
      </View>
    );

  const selectedPoll = rankings.find((r) =>
    pollMode === "ap"
      ? r.shortName === "AP Poll"
      : r.shortName === "Coaches Poll",
  );

  const filteredRankings = selectedPoll?.ranks ?? [];
  const droppedOutTeams = selectedPoll?.droppedOut ?? [];

  // --- Render functions ---
  const renderLeftItem = ({
    item,
    index,
  }: {
    item: CBBTeamRank;
    index: number;
  }) => {
    const isLastRow = index === filteredRankings.length - 1;
    const team = getRankedTeam(item.team?.espnId ?? item.team?.id ?? "");
    const teamId = team?.id;
    const teamLogo = getRankedTeamLogo(teamId);
    const teamcode = team?.code || "N/A";
    const trendNum = Number(item.trend);
    const isUp = trendNum > 0;
    const favorited = team?.id != null ? isFavorite(league, team.id) : false;

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
            onPress={() => {
              if (!teamId) return;
              router.push({
                pathname: isWCBB ? "/team/wcbb/[teamId]" : "/team/cbb/[teamId]",
                params: { teamId },
              });
            }}
            style={styles.teamInfoWrapper}
          >
            {teamLogo && <Image source={teamLogo} style={styles.logo} />}
            <Text style={styles.collegeTeamName}>{teamcode}</Text>
          </TouchableOpacity>

          {trendNum !== 0 && !isNaN(trendNum) && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={isUp ? "arrow-up" : "arrow-down"}
                size={10}
                color={
                  isUp
                    ? isDark
                      ? Colors.dark.leafGreen
                      : Colors.light.green // correct branch
                    : isDark
                      ? Colors.dark.lightRed
                      : Colors.light.red
                }
                style={{ marginRight: 2 }}
              />

              <Text
                style={[
                  styles.collegeTeamTrend,
                  {
                    color: isUp
                      ? isDark
                        ? Colors.dark.leafGreen
                        : Colors.light.green // correct branch
                      : isDark
                        ? Colors.dark.lightRed
                        : Colors.light.red,
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
    item: CBBTeamRank;
    index: number;
  }) => {
    const isLastRow = index === filteredRankings.length - 1;
    const team = getRankedTeam(item.team?.espnId ?? item.team?.id ?? "");
    const favorited = team?.id != null ? isFavorite(league, team.id) : false;
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
            {item.team?.groups?.shortName || "N/A"}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View
      style={[
        styles.row,
        {
          borderBottomWidth: 1,
          borderBottomColor: isDark ? Colors.darkGray : Colors.lightGray,
          alignItems: "center",
        },
      ]}
    >
      <View style={styles.rankContainer}>
        <Text style={[styles.rankText, { fontFamily: Fonts.SEMIBOLD }]}>#</Text>
      </View>
      <Text style={[styles.teamHeaderText]}>Team</Text>
    </View>
  );

  const renderStatsHeader = () => (
    <View style={styles.statsHeaderRow}>
      {["Record", "Points", "1st Votes", "Conference"].map((label) => (
        <View key={label} style={styles.statCell}>
          <Text style={styles.headerText}>{label}</Text>
        </View>
      ))}
    </View>
  );

  const renderDroppedOut = () => {
    if (!droppedOutTeams.length) return null;

    return (
      <View style={styles.droppedoutContainer}>
        <HeadingTwo isDark={isDark}>Dropped From Rankings</HeadingTwo>

        <View style={styles.droppedoutWrapper}>
          {droppedOutTeams.map((item, index) => {
            const teamId = item.team?.id ?? 0;
            const team = isWCBB ? getWCBBTeam(teamId) : getCBBTeam(teamId);
            const teamName = team?.shortName || team?.name || "N/A";
            const teamLogo = isWCBB
              ? getWCBBTeamLogo(teamId, isDark)
              : getCBBTeamLogo(teamId, isDark);
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

  function Section({ title, data }: { title: string; data: CBBTeamRank[] }) {
    return (
      <>
        <View style={styles.wrapper}>
          <View style={styles.header}>
            <Text style={styles.heading}>{title}</Text>
          </View>

          <View style={{ flexDirection: "row" }}>
            <FlatList
              data={data}
              keyExtractor={(item, index) =>
                item.team?.id
                  ? String(item.team.id)
                  : `fallback-${index}-${item.date}`
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
                    : `fallback-${index}-${item.date}`
                }
                renderItem={renderRightItem}
                scrollEnabled={false}
                ListHeaderComponent={renderStatsHeader}
                stickyHeaderIndices={[0]}
              />
            </ScrollView>
          </View>
        </View>
      </>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.dropdownRow}>
        <Dropdown
          options={[
            { label: "AP Poll", value: "ap" },
            { label: "Coaches Poll", value: "coaches" },
          ]}
          selectedValue={pollMode}
          onSelect={(value) => setPollMode(value as "ap" | "coaches")}
          isDark={isDark}
        />
      </View>
      {/* --- Rankings Section --- */}
      <Section
        title={pollMode === "ap" ? "AP Poll" : "Coaches Poll"}
        data={filteredRankings}
      />

      {renderDroppedOut()}
    </ScrollView>
  );
};
