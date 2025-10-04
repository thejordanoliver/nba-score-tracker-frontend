import { Animated } from "react-native";
import { getStyles } from "../../styles/ProfileScreen.styles";
import FavoriteTeamsList from "../Favorites/FavoriteTeamsList";
import SectionHeaderWithToggle from "../SectionHeaderWithToggle";

type Props = {
  favoriteTeams: any[]; // type your teams here
  isGridView: boolean;
  fadeAnim: Animated.Value;
  toggleFavoriteTeamsView: () => void;
  styles: ReturnType<typeof getStyles>;
  itemWidth: number;
  isCurrentUser: boolean;
  username?: string;
};

export default function FavoriteTeamsSection({
  favoriteTeams,
  isGridView,
  fadeAnim,
  toggleFavoriteTeamsView,
  styles,
  itemWidth,
  isCurrentUser,
  username,
}: Props) {
  return (
    <>
      <SectionHeaderWithToggle
        title="Favorite Teams"
        isGridView={isGridView}
        onToggleView={toggleFavoriteTeamsView}
      />

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <FavoriteTeamsList
          favoriteTeams={favoriteTeams}
          isGridView={isGridView}
          styles={styles}
          itemWidth={itemWidth}
          key={isGridView ? "grid" : "list"}
          isCurrentUser={isCurrentUser}
          username={username}
        />
      </Animated.View>
    </>
  );
}
