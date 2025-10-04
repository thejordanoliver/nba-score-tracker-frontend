import { Fonts } from "constants/fonts";
import { getNFLTeamsLogo } from "constants/teamsNFL";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import HeadingTwo from "../../Headings/HeadingTwo";
import FixedWidthTabBar from "../TabBars/FixedWidthTabBar";

type Injury = {
  status: string;
  date: string;
  athlete: {
    id: string;
    displayName: string;
    position?: { displayName: string; abbreviation: string };
    headshot?: { href: string };
    jersey?: string;
  };
  details?: {
    type?: string;
    location?: string;
    returnDate?: string;
  };
};

type TeamInjuries = {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo?: string;
  };
  injuries: Injury[];
};

type Props = {
  injuries: TeamInjuries[];
  loading: boolean;
  error: any;
  awayTeamAbbr?: string;
  homeTeamAbbr?: string;
  lighter?: boolean;
};

export default function NFLInjuries({
  injuries,
  loading,
  error,
  awayTeamAbbr,
  homeTeamAbbr,
  lighter = false,
}: Props) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  // Uppercase team abbreviations for consistency
  const awayAbbr = awayTeamAbbr?.toUpperCase();
  const homeAbbr = homeTeamAbbr?.toUpperCase();

  // Tab ordering
  const orderedTabs = useMemo(() => {
    if (!injuries || injuries.length === 0) return [];
    const allAbbrs = injuries.map((t) => t.team.abbreviation.toUpperCase());

    const tabs: string[] = [];

    if (awayAbbr && allAbbrs.includes(awayAbbr)) tabs.push(awayAbbr);
    if (homeAbbr && allAbbrs.includes(homeAbbr) && homeAbbr !== awayAbbr)
      tabs.push(homeAbbr);

    allAbbrs.forEach((abbr) => {
      if (!tabs.includes(abbr)) tabs.push(abbr);
    });

    return tabs;
  }, [injuries, awayAbbr, homeAbbr]);

  // Selected team (default: away → home → first tab)
  const [selectedTeam, setSelectedTeam] = useState<string>(() => {
    if (awayAbbr && orderedTabs.includes(awayAbbr)) return awayAbbr;
    if (homeAbbr && orderedTabs.includes(homeAbbr)) return homeAbbr;
    return orderedTabs[0] || "";
  });

  const selected = selectedTeam || orderedTabs[0];

  // Loading / error states
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" />
        <Text style={styles.loadingText}>Loading injuries...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load injuries</Text>
      </View>
    );
  }

  if (!injuries || injuries.length === 0) return null;

  const textColor = lighter ? "#fff" : isDark ? "#fff" : "#1d1d1d";
  const subTextColor = lighter ? "#ccc" : isDark ? "#888" : "#555";
  const borderColor = lighter ? "#aaa" : isDark ? "#888" : "#ccc";

  const renderInjury = ({ item }: { item: Injury }) => {
    const player = item.athlete;
    return (
      <View style={[styles.card, { borderBottomColor: borderColor }]}>
        <View style={styles.row}>
          {player?.headshot?.href ? (
            <Image
              source={{ uri: player.headshot.href }}
              style={[styles.headshot, { backgroundColor: borderColor }]}
            />
          ) : (
            <View style={styles.placeholder} />
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.playerInfo}>
              <Text style={[styles.name, { color: textColor }]}>
                {player?.displayName ?? "Unknown Player"}
              </Text>
              <Text style={[styles.jersey, { color: subTextColor }]}>
                {player?.jersey ? `#${player.jersey}` : ""}
              </Text>
            </View>
            <Text style={[styles.position, { color: subTextColor }]}>
              {player?.position?.displayName ?? "—"}
            </Text>
            {item.details?.type && (
              <View style={styles.bottom}>
                <Text style={styles.status}>{item.status}</Text>
                <View
                  style={[styles.divder, { backgroundColor: borderColor }]}
                ></View>
                <Text style={[styles.detail, { color: subTextColor }]}>
                  {item.details.type} — {item.details.location ?? "N/A"}
                </Text>
              </View>
            )}
          </View>
          {item.details?.returnDate && (
            <View style={styles.bottom}>
              <Text style={[styles.returnDate, { color: subTextColor }]}>
                Return: {new Date(item.details.returnDate).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const teamData = injuries.find(
    (t) => t.team.abbreviation.toUpperCase() === selected
  );

  return (
    <View style={styles.container}>
      <HeadingTwo lighter={lighter}>Injuries</HeadingTwo>

      <FixedWidthTabBar
        tabs={orderedTabs}
        selected={selected}
        lighter={lighter}
        onTabPress={setSelectedTeam}
        renderLabel={(tab, isSelected) => {
          const team = injuries.find(
            (t) => t.team.abbreviation.toUpperCase() === tab
          );
          const teamLogo = getNFLTeamsLogo(team?.team.abbreviation, isDark);

          return (
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 4,
              }}
            >
              <Image
                source={teamLogo}
                style={{
                  width: 28,
                  height: 28,
                  opacity: isSelected ? 1 : 0.5,
                }}
                resizeMode="contain"
              />
              <Text
                style={{
                  color: textColor,
                  fontFamily: Fonts.OSMEDIUM,
                  opacity: isSelected ? 1 : 0.5, // ← added text opacity
                }}
              >
                {team?.team.abbreviation ?? tab}
              </Text>
            </View>
          );
        }}
      />

      {teamData && teamData.injuries.length > 0 ? (
        <FlatList
          data={teamData.injuries}
          renderItem={renderInjury}
          keyExtractor={(inj) => inj.athlete.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      ) : (
        <Text style={styles.errorText}>
          No injuries reported for this team.
        </Text>
      )}
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {},
    card: {
      paddingHorizontal: 12,
      borderBottomColor: isDark ? "#444" : "#ccc",
      borderBottomWidth: 1,
      height: 88,
      justifyContent: "center",
    },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    headshot: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
      backgroundColor: isDark ? "#444" : "#ccc",
    },
    placeholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
      backgroundColor: "#ccc",
    },
    playerInfo: { flexDirection: "row", alignItems: "flex-end" },
    name: {
      fontSize: 16,
      fontFamily: Fonts.OSMEDIUM,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    jersey: {
      fontSize: 12,
      fontFamily: Fonts.OSMEDIUM,
      color: isDark ? "#aaa" : "#555",
      marginLeft: 4,
    },
    position: {
      fontSize: 14,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#aaa" : "#555",
      marginBottom: 4,
    },
    status: { fontSize: 14, fontFamily: Fonts.OSSEMIBOLD, color: "#d9534f" },
    detail: {
      fontSize: 13,
      fontFamily: Fonts.OSREGULAR,
      color: isDark ? "#ccc" : "#444",
    },
    returnDate: {
      marginTop: 2,
      fontSize: 13,
      fontFamily: Fonts.OSREGULAR,
      color: "#888",
    },
    separator: { height: 10 },
    loadingText: { marginTop: 8, fontSize: 14, color: "#333" },
    errorText: { fontSize: 14, color: "red" },
    bottom: { flexDirection: "row", alignItems: "center" },
    divder: {
      width: 1,
      height: 16,
      backgroundColor: isDark ? "#888" : "#aaa",
      marginHorizontal: 4,
    },
  });
