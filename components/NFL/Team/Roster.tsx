// components/NFLRoster.tsx
import { useNFLPlayers } from "hooks/NFLHooks/useNFLPlayers";
import { forwardRef, useImperativeHandle } from "react";
import { ActivityIndicator, FlatList, Text } from "react-native";
import NFLPlayerCard from "../Player/NFLPlayerCard";

interface NFLRosterProps {
  teamId: string;
  teamName: string;
  refreshing?: boolean;
}

const NFLRoster = forwardRef(
  ({ teamId, teamName, refreshing }: NFLRosterProps, ref) => {
    const { players, loading, error, refresh } = useNFLPlayers({
      teamId,
      season: "2024",
    });

    // expose refresh() to parent
    useImperativeHandle(ref, () => ({
      refresh,
    }));

    if (loading && !refreshing)
      return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;
    if (error)
      return (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          Error: {error}
        </Text>
      );
    if (!players || players.length === 0)
      return (
        <Text style={{ textAlign: "center", marginTop: 20 }}>
          No players found.
        </Text>
      );

    return (
      <FlatList
        data={players}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingBottom: 100,
          gap: 12,
          padding: 12,
        }}
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
        refreshing={refreshing}
        onRefresh={refresh}
      />
    );
  }
);

export default NFLRoster;
