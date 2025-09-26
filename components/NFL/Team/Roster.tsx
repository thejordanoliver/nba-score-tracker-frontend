// components/NFLRoster.tsx
import HeadingTwo from "components/Headings/HeadingTwo";
import { useNFLPlayers } from "hooks/NFLHooks/useNFLPlayers";
import { forwardRef, useImperativeHandle, useMemo } from "react";
import { ActivityIndicator, SectionList, StyleSheet, Text } from "react-native";
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

const NFLRoster = forwardRef(
  ({ teamId, teamName, refreshing }: NFLRosterProps, ref) => {
    const { players, loading, error, refresh } = useNFLPlayers({
      teamId,
      season: "2025",
    });

    // expose refresh() to parent
    useImperativeHandle(ref, () => ({
      refresh,
    }));

    // group players by position
    const sections = useMemo(() => {
      if (!players) return [];

      const grouped: Record<string, typeof players> = {};

      players.forEach((p) => {
        const pos = p.position || "Other";
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push(p);
      });

      // Sort sections by custom POSITION_ORDER, fallback alphabetical for unknown
      return Object.keys(grouped)
        .sort((a, b) => {
          const indexA = POSITION_ORDER.indexOf(a);
          const indexB = POSITION_ORDER.indexOf(b);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b); // unknown positions alphabetically
        })
        .map((pos) => ({
          title: pos,
          data: grouped[pos],
        }));
    }, [players]);

    if (loading && !refreshing)
      return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;
    if (error) return <Text style={styles.message}>Error: {error}</Text>;
    if (!players || players.length === 0)
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
        refreshing={refreshing}
        onRefresh={refresh}
        stickySectionHeadersEnabled={false} // ✅ headers scroll with list
      />
    );
  }
);

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
