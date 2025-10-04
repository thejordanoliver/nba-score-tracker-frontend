// components/NFLRoster.tsx
import HeadingTwo from "components/Headings/HeadingTwo";
import { players as allPlayers } from "constants/nflPlayers";

import { forwardRef, useImperativeHandle, useMemo } from "react";
import { SectionList, StyleSheet, Text } from "react-native";
import NFLPlayerCard from "../Player/NFLPlayerCard";

interface NFLRosterProps {
  teamId: string;
  teamName: string;
  refreshing?: boolean;
}

// Custom position order
const POSITION_ORDER = [
  // Offense
  "QB",
  "RB",
  "WR",
  "TE",
  "G",
  "C",
  "T",
  // Defense
  "DT",
  "DE",
  "LB",
  "CB",
  "S",
  // Special Teams
  "K",
  "P",
  "LS",
];

const NFLRoster = forwardRef(({ teamId, teamName }: NFLRosterProps, ref) => {
  // Filter players by team
  const teamPlayers = useMemo(
    () => allPlayers.filter((p) => p.teamId === Number(teamId)),
    [teamId]
  );

  // expose dummy refresh (no API here)
  useImperativeHandle(ref, () => ({
    refresh: () => {},
  }));

  // group players by position
  const sections = useMemo(() => {
    if (!teamPlayers || teamPlayers.length === 0) return [];

    const grouped: Record<string, typeof teamPlayers> = {};

    teamPlayers.forEach((p) => {
      const pos = p.position || "Other";
      if (!grouped[pos]) grouped[pos] = [];
      grouped[pos].push(p);
    });

    // Sort sections by POSITION_ORDER, fallback alphabetical
    return Object.keys(grouped)
      .sort((a, b) => {
        const indexA = POSITION_ORDER.indexOf(a);
        const indexB = POSITION_ORDER.indexOf(b);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      })
      .map((pos) => ({
        title: pos,
        data: grouped[pos],
      }));
  }, [teamPlayers]);

  if (!teamPlayers || teamPlayers.length === 0)
    return <Text style={styles.message}>No players found.</Text>;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <NFLPlayerCard
          id={item.id}
          name={item.name}
          position={item.position ?? ""}
          avatarUrl={item.image}
          number={item.number}
          team={teamName}
        />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <HeadingTwo>{title}</HeadingTwo>
      )}
      stickySectionHeadersEnabled={false}
    />
  );
});

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 100,
    padding: 12,
  },

  message: {
    textAlign: "center",
    marginTop: 20,
  },
});

export default NFLRoster;
