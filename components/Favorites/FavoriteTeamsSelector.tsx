// components/FavoriteTeamsSelector.tsx
import type { Team } from "types/types";
import { useMemo } from "react";
import { Animated, FlatList } from "react-native";
import FavoriteTeamsSelectorSkeleton from "./FavoriteTeamsSelectorSkeleton";
import TeamCard from "./TeamCard";



type Props = {
  teams: (Team & { league: "NBA" | "NFL" })[];
  favorites: string[];
  toggleFavorite: (league: "NBA" | "NFL", id: string) => void; // <-- 2 args now
  isGridView: boolean;
  fadeAnim: Animated.Value;
  search: string;
  itemWidth: number;
  loading?: boolean;
};

const FavoriteTeamsSelector = ({
  teams,
  favorites,
  toggleFavorite,
  isGridView,
  fadeAnim,
  search,
  itemWidth,
  loading = false,
}: Props) => {
  const filteredTeams = useMemo(
    () =>
      teams.filter((team) =>
        team.fullName?.toLowerCase().includes(search.toLowerCase())
      ),
    [teams, search]
  );

  if (loading) {
    return (
      <FavoriteTeamsSelectorSkeleton
        isGridView={isGridView}
        itemWidth={itemWidth}
      />
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, marginTop: 12 }}>
  <FlatList
  key={isGridView ? "grid" : "list"}
  data={filteredTeams}
  keyExtractor={(item) => item.id}
  numColumns={isGridView ? 3 : 1}
  columnWrapperStyle={
    isGridView
      ? {
          gap: 10, // spacing between cards
          flexWrap: "wrap",
        }
      : undefined
  }
  renderItem={({ item }) => ( // <-- use 'item' here
    <TeamCard
      item={item} // <-- pass item
      isSelected={favorites.includes(`${item.league}:${item.id}`)} // <-- use item
      onPress={() => toggleFavorite(item.league, item.id)} // <-- use item
      isGridView={isGridView}
      itemWidth={itemWidth}
    />
  )}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 16 }}
/>

    </Animated.View>
  );
};

export default FavoriteTeamsSelector;
