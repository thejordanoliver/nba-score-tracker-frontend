// components/TeamPlayerList.tsx
import { Player } from "hooks/useDbPlayersByTeam";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
} from "react-native";
import { style } from "../../styles/TeamDetails.styles";
import PlayerCard from "./../player/PlayerCard";

interface TeamPlayerListProps {
  players: Player[];
  loading: boolean;
  error?: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  teamFullName: string;
  teamColor: string;
  isDark: boolean;
}

export default function TeamPlayerList({
  players,
  loading,
  error,
  refreshing,
  onRefresh,
  teamFullName,
  teamColor,
  isDark,
}: TeamPlayerListProps) {
  const styles = style(isDark);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingBottom: 100,
        paddingHorizontal: 12,
        gap: 12,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={teamColor}
        />
      }
    >
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={[styles.text, { textAlign: "center", marginTop: 20 }]}>
          {error}
        </Text>
      ) : players.length === 0 ? (
        <Text style={[styles.text, { textAlign: "center", marginTop: 20 }]}>
          No players found.
        </Text>
      ) : (
        [...players]
          .filter((player) => player.active !== false) // Only show active players
          .sort((a, b) => {
            const jerseyA = parseInt(a.jersey_number ?? "0", 10);
            const jerseyB = parseInt(b.jersey_number ?? "0", 10);
            return jerseyA - jerseyB;
          })
          .map((player) => (
            <PlayerCard
              key={player.id}
              id={player.id}
              playerId={player.player_id}
              name={player.name}
              position={player.position}
              team={teamFullName}
              avatarUrl={player.avatarUrl}
              jerseyNumber={player.jersey_number}
            />
          ))
      )}
    </ScrollView>
  );
}
