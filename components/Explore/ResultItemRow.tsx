import { View, Text, Pressable, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { teamsById } from "constants/teams";
import players from "constants/players";
import { styles } from "styles/Explore.styles";
import type { ResultItem, PlayerResult, TeamResult, UserResult } from "types/types";

type Props = {
  item: ResultItem;
  onSelect: (item: ResultItem) => void;
  onDelete?: (item: ResultItem) => void;
  apiUrl?: string;
  query?: string;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ResultItemRow({
  item,
  onSelect,
  onDelete,
  apiUrl = "",
  query = "",
}: Props) {
  const isDark = useColorScheme() === "dark";

  const renderTeam = (team: TeamResult) => {
    const localTeam = teamsById[team.id.toString()];
    const logoSource = isDark ? localTeam?.logoLight || localTeam?.logo : localTeam?.logo;

    return (
      <View style={styles.itemRow}>
        <Pressable
          onPress={() => onSelect(team)}
          style={[styles.itemContainer, isDark && styles.itemContainerDark]}
        >
          <View style={styles.teamRow}>
            {logoSource && <Image source={logoSource} style={styles.teamLogo} resizeMode="contain" />}
            <Text style={[styles.teamName, isDark && styles.textDark]}>{localTeam?.fullName}</Text>
          </View>
        </Pressable>
        {query.length === 0 && onDelete && (
          <Pressable onPress={() => onDelete(team)}>
            <Ionicons name="close" size={20} color={isDark ? "#ccc" : "#333"} />
          </Pressable>
        )}
      </View>
    );
  };

  const renderPlayer = (player: PlayerResult) => {
    const avatarUrl = player.avatarUrl?.trim() ? player.avatarUrl : players[player.name];
    const localTeam = teamsById[player.team_id?.toString()];

    return (
      <View style={styles.itemRow}>
        <Pressable
          onPress={() => onSelect(player)}
          style={[styles.itemContainer, isDark && styles.itemContainerDark]}
        >
          <View style={styles.playerRow}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} resizeMode="cover" />
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, isDark && styles.textDark]}>{player.name}</Text>
              <Text style={[styles.playerTeam, isDark && styles.textDark]}>
                {localTeam?.fullName || "Free Agent"}
              </Text>
            </View>
          </View>
        </Pressable>
        {query.length === 0 && onDelete && (
          <Pressable onPress={() => onDelete(player)}>
            <Ionicons name="close" size={20} color={isDark ? "#ccc" : "#333"} />
          </Pressable>
        )}
      </View>
    );
  };

const renderUser = (user: UserResult) => {
let profileImageUrl = user.profileImageUrl?.trim();

  if (!profileImageUrl) {
    // fallback avatar if none exists
    profileImageUrl = "https://via.placeholder.com/150";
  } else if (!profileImageUrl.startsWith("http")) {
    // prepend your backend base URL
    profileImageUrl = `${BASE_URL}${profileImageUrl}`;
  }
//   console.log("User Image URL:", profileImageUrl);


  return (
    <View style={styles.itemRow}>
      <Pressable
        onPress={() => onSelect(user)}
        style={[styles.itemContainer, isDark && styles.itemContainerDark]}
      >
        <View style={styles.userRow}>
          <Image source={{ uri: profileImageUrl }} style={styles.avatar} resizeMode="cover" />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, isDark && styles.textDark]}>{user.username}</Text>
          </View>
        </View>
      </Pressable>
      {query.length === 0 && onDelete && (
        <Pressable onPress={() => onDelete(user)}>
          <Ionicons name="close" size={20} color={isDark ? "#ccc" : "#333"} />
        </Pressable>
      )}
    </View>
  );
};


  // Narrow the type before rendering
  switch (item.type) {
    case "team":
      return renderTeam(item as TeamResult);
    case "player":
      return renderPlayer(item as PlayerResult);
    case "user":
      return renderUser(item as UserResult);
    default:
      return null;
  }
}
