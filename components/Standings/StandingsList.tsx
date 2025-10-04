// StandingsList.tsx

import { Fonts } from "constants/fonts";
import { useTeams } from "hooks/useTeams";
import { getStyles } from "styles/Standings.styles";
import type { TeamStanding as TeamStandingType } from "types/standingsTypes";
import {
  getImageSource,
  getPlayoffStatusCode,
  getTotalWins,
  groupByDivision,
} from "utils/standingsUtils";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useStandings } from "../../hooks/useStandings";
import {
  StatusLegend,
  statusCodeToColor,
  statusCodeToLabel,
} from "./StatusLegend";

type SectionType = {
  title: string;
  data: (TeamStandingType & { conferenceRank?: number })[];
};

// StatusBadge component for status codes
function StatusBadge({ code }: { code?: string | null }) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  if (!code || !statusCodeToLabel[code]) return null;

  const backgroundColor = statusCodeToColor[code] || "#777";

  return (
    <View style={[styles.statusBadge, { backgroundColor }]}>
      <Text style={styles.statusBadgeText}>{code.toUpperCase()}</Text>
    </View>
  );
}

export function StandingsList() {
  const { standings, loading, error } = useStandings(2024);
  const { teams } = useTeams();
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  const now = new Date();
  const showBadges =
    now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() >= 15);
  const [sortMode, setSortMode] = useState<"conference" | "division">(
    "conference"
  );

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  // Sticky header current section title
  const [currentSectionTitle, setCurrentSectionTitle] = useState(
    sortMode === "conference" ? "Eastern Conference" : "Atlantic Division"
  );

  // Store measured section positions for scroll tracking
  const sectionPositions = useRef<
    { title: string; y: number; height: number }[]
  >([]);

  // When sortMode changes, reset currentSectionTitle accordingly
  useEffect(() => {
    setCurrentSectionTitle(
      sortMode === "conference" ? "Eastern Conference" : "Atlantic Division"
    );
    sectionPositions.current = [];
  }, [sortMode]);

  const toggleDropdown = () => {
    if (dropdownVisible) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => setDropdownVisible(false));
    } else {
      setDropdownVisible(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  const onSelectSortMode = (mode: "conference" | "division") => {
    setSortMode(mode);
    toggleDropdown();
  };

  const dropdownTranslateY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  // Measure each section's position and save it
  const onSectionLayout = (event: any, title: string) => {
    const { y, height } = event.nativeEvent.layout;
    const existingIndex = sectionPositions.current.findIndex(
      (s) => s.title === title
    );
    if (existingIndex !== -1) {
      sectionPositions.current[existingIndex] = { title, y, height };
    } else {
      sectionPositions.current.push({ title, y, height });
      sectionPositions.current.sort((a, b) => a.y - b.y);
    }
  };

  // On scroll, determine which section is currently at top and update title
  const onScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    let currentTitle = currentSectionTitle;

    // Add some offset for header height (~60px)
    const offsetY = scrollY + 60;

    // Find last section that has y less or equal to offsetY
    for (let i = sectionPositions.current.length - 1; i >= 0; i--) {
      const section = sectionPositions.current[i];
      if (offsetY >= section.y) {
        currentTitle = section.title;
        break;
      }
    }

    if (currentTitle !== currentSectionTitle) {
      setCurrentSectionTitle(currentTitle);
    }
  };

  if (loading)
    return (
      <View style={[{ backgroundColor: isDark ? "#1d1d1d" : "#fff" }]}>
        <Text
          style={{
            textAlign: "center",
            color: isDark ? "#aaa" : "#666",
            marginTop: 20,
            fontSize: 20,
            fontFamily: Fonts.OSLIGHT,
          }}
        >
          Loading standings...
        </Text>
      </View>
    );

  if (error)
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? "#1d1d1d" : "#fff" },
        ]}
      >
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );

  const eastStandings = standings
    .filter((team) => team.conference.name.toLowerCase() === "east")
    .sort((a, b) => getTotalWins(b) - getTotalWins(a))
    .map((team, index) => ({ ...team, conferenceRank: index + 1 }));

  const westStandings = standings
    .filter((team) => team.conference.name.toLowerCase() === "west")
    .sort((a, b) => getTotalWins(b) - getTotalWins(a))
    .map((team, index) => ({ ...team, conferenceRank: index + 1 }));

  const combinedStandings = [...eastStandings, ...westStandings];

  const divisionGroupsRaw = groupByDivision(combinedStandings);
  const divisionGroups = Object.fromEntries(
    Object.entries(divisionGroupsRaw).map(([divisionName, teams]) => {
      const teamsWithRank = teams.map((team) => {
        const found = combinedStandings.find((t) => t.team.id === team.team.id);
        return { ...team, conferenceRank: found?.conferenceRank };
      });
      return [divisionName, teamsWithRank];
    })
  );

  const renderFixedItem = ({
    item,
    index,
  }: {
    item: TeamStandingType & { conferenceRank?: number };
    index: number;
  }) => {
    const { team, conferenceRank } = item;

    let statusCode = item.statusCode ?? getPlayoffStatusCode(conferenceRank);

    if (conferenceRank === 1) {
      if (item.conference.name.toLowerCase() === "east") {
        statusCode = "e";
      } else if (item.conference.name.toLowerCase() === "west") {
        statusCode = "w";
      }
    }

    return (
      <View
        style={[styles.row, { borderBottomColor: isDark ? "#333" : "#ccc" }]}
      >
        <View style={[styles.rankContainer]}>
          <Text
            style={[styles.rankText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {index + 1}
          </Text>
        </View>
        <View style={[styles.teamInfo]}>
          <Image
            source={getImageSource(
              isDark && team.logoLight ? team.logoLight : team.logo
            )}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text
            style={[styles.teamName, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {team.code}
          </Text>
          {showBadges && <StatusBadge code={statusCode} />}
        </View>
      </View>
    );
  };

  const renderStatsItem = ({ item }: { item: TeamStandingType }) => {
    const {
      conference,
      win,
      loss,
      division,
      gamesBehind,
      streak,
      winStreak,
      tieBreakerPoints,
      team,
    } = item;

    let totalWins = conference.win;
    let totalLosses = conference.loss;
    let winPct =
      conference.win === 0 && conference.loss === 0
        ? 0
        : conference.win / (conference.win + conference.loss);

    const matchedTeam = teams.find((t) => Number(t.id) === Number(team.id));

    if (
      conference.win === 0 &&
      conference.loss === 0 &&
      matchedTeam?.current_season_record
    ) {
      const [winsStr, lossesStr] = matchedTeam.current_season_record.split("-");
      totalWins = parseInt(winsStr, 10) || 0;
      totalLosses = parseInt(lossesStr, 10) || 0;
    } else if (conference.win === 0 && conference.loss === 0) {
      totalWins = win.home + win.away;
      totalLosses = loss.home + loss.away;
    }
    const winPctDisplay = winPct > 0 ? (winPct * 100).toFixed(1) + "%" : "0%";

    return (
      <View
        style={[
          styles.row,
          { borderBottomColor: isDark ? "#333" : "#ccc", flexDirection: "row" },
        ]}
      >
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {totalWins} - {totalLosses}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statText, { color: isDark ? "#aaa" : "#555" }]}>
            GB: {gamesBehind || "0"}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[
              styles.statText,
              { color: winStreak ? "limegreen" : "tomato" },
            ]}
          >
            {winStreak ? `W${streak}` : `L${streak}`}
          </Text>
        </View>

        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {division.win} - {division.loss}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statText, { color: isDark ? "#aaa" : "#555" }]}>
            GB: {division.gamesBehind || "0"}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {win.home}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {win.away}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {win.total}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statText, { color: isDark ? "#aaa" : "#555" }]}>
            {winPctDisplay}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {loss.home}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {loss.away}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {loss.total}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statText, { color: isDark ? "#aaa" : "#555" }]}>
            {totalLosses > 0
              ? ((totalLosses / (totalWins + totalLosses)) * 100).toFixed(1) +
                "%"
              : "0%"}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {win.lastTen}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {loss.lastTen}
          </Text>
        </View>
        <View style={styles.statCell}>
          <Text
            style={[styles.statText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {tieBreakerPoints ?? "-"}
          </Text>
        </View>
      </View>
    );
  };

  const renderFixedHeader = () => (
    <View
      style={[
        styles.row,
        { borderBottomWidth: 1, borderBottomColor: isDark ? "#444" : "#ccc" },
      ]}
    >
      <View style={[styles.rankContainer]}>
        <Text
          style={[
            styles.rankText,
            {
              fontSize: 12,
              fontFamily: Fonts.OSSEMIBOLD,
              color: isDark ? "#fff" : "#1d1d1d",
            },
          ]}
        >
          #
        </Text>
      </View>
      <View
        style={[
          styles.teamInfo,
          { flexDirection: "row", alignItems: "center" },
        ]}
      >
        <Text
          style={[
            styles.teamHeaderText,
            { color: isDark ? "#fff" : "#1d1d1d" },
          ]}
        >
          Team
        </Text>
      </View>
    </View>
  );

  const renderStatsHeader = () => (
    <View
      style={[
        styles.row,
        {
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#444" : "#ccc",
          paddingVertical: 12,
        },
      ]}
    >
      {[
        "W-L",
        "Conf GB",
        "Streak",
        "Div W-L",
        "Div GB",
        "Home W",
        "Away W",
        "Total W",
        "Win %",
        "Home L",
        "Away L",
        "Total L",
        "Loss %",
        "Last 10 W",
        "Last 10 L",
        "Tie Breaker",
      ].map((label) => (
        <View key={label} style={styles.statCell}>
          <Text
            style={[
              styles.statText,
              {
                fontSize: 12,
                fontFamily: Fonts.OSSEMIBOLD,
                color: isDark ? "#fff" : "#1d1d1d",
              },
            ]}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );

  function ConferenceStandings({ title, data }: SectionType) {
    return (
      <View style={{ marginTop: 12 }}>
        <View
          style={[
            styles.header,
            { borderBottomColor: isDark ? "#444" : "#ccc" },
          ]}
        >
          <Text
            style={[styles.heading, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            {title}
          </Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          {/* Left side FlatList with sticky header */}
          <FlatList
            data={data}
            keyExtractor={(item) => item.team.id.toString()}
            renderItem={renderFixedItem}
            scrollEnabled={false}
            ListHeaderComponent={renderFixedHeader}
            stickyHeaderIndices={[0]}
          />
          {/* Right side horizontal scroll with FlatList and sticky header */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
             style={{ width: 220 }} // increased
          >
            <FlatList
              data={data}
              keyExtractor={(item) => item.team.id.toString()}
              renderItem={renderStatsItem}
              scrollEnabled={false}
              ListHeaderComponent={renderStatsHeader}
              stickyHeaderIndices={[0]}
            />
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: isDark ? "#1d1d1d" : "#fff" }}
      contentContainerStyle={{
        paddingBottom: 100,
        paddingHorizontal: 16,
        paddingTop: 10,
      }}
    >
      <View
        style={{
          marginBottom: 10,
          alignItems: "flex-end",
          position: "absolute",
          right: 10,
          top: 14,
          zIndex: 999,
        }}
      >
        <TouchableOpacity
          onPress={toggleDropdown}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isDark ? "#888" : "#888",
            flexDirection: "row",
            alignItems: "center",
          }}
          activeOpacity={0.8}
        >
          <Text
            style={{
              color: isDark ? "#fff" : "#1d1d1d",
              fontFamily: Fonts.OSMEDIUM,
              marginRight: 8,
            }}
          >
            {sortMode === "conference" ? "By Conference" : "By Division"}
          </Text>

          <Animated.View
            style={{
              transform: [
                {
                  rotate: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "180deg"],
                  }),
                },
              ],
            }}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={isDark ? "#fff" : "#1d1d1d"}
            />
          </Animated.View>
        </TouchableOpacity>

        {dropdownVisible && (
          <Animated.View
            style={{
              position: "absolute",
              top: 48,
              width: 180,
              borderRadius: 12,
              overflow: "hidden",
              zIndex: 9999,
              opacity: dropdownAnim,
              transform: [{ translateY: dropdownTranslateY }],
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <BlurView
              intensity={100}
              tint="systemUltraThinMaterial"
              style={StyleSheet.absoluteFillObject}
            />
            {["conference", "division"].map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() =>
                  onSelectSortMode(mode as "conference" | "division")
                }
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: mode === "division" ? 0 : 1,
                  borderBottomColor: isDark ? "#555" : "#ccc",
                }}
              >
                <Text
                  style={{
                    color:
                      sortMode === mode
                        ? isDark
                          ? "#0af"
                          : "#06f"
                        : isDark
                        ? "#fff"
                        : "#000",
                    fontFamily: Fonts.OSMEDIUM,
                  }}
                >
                  {mode === "conference" ? "By Conference" : "By Division"}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>

      {sortMode === "conference" ? (
        <>
          <ConferenceStandings
            title="Eastern Conference"
            data={eastStandings}
          />
          <ConferenceStandings
            title="Western Conference"
            data={westStandings}
          />
        </>
      ) : (
        Object.entries(divisionGroups).map(([divisionName, teams]) => {
          const formattedDivision =
            divisionName.charAt(0).toUpperCase() + divisionName.slice(1);
          return (
            <ConferenceStandings
              key={divisionName}
              title={`${formattedDivision} Division`}
              data={teams}
            />
          );
        })
      )}

      <StatusLegend />
    </ScrollView>
  );
}
