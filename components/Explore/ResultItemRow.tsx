import { getSOCCTeam, getSOCCTeamLogo } from "@/constants/teamsSOCC";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "constants/styles";
import { getNBATeam, getNBATeamLogo } from "constants/teams";
import { getCBBTeam, getCBBTeamLogo } from "constants/teamsCBB";
import { getCFBTeam, getCFBTeamLogo } from "constants/teamsCFB";
import { getMLBTeam, getMLBTeamLogo } from "constants/teamsMLB";
import { getNFLTeam, getNFLTeamLogo } from "constants/teamsNFL";
import { getNHLTeam, getNHLTeamLogo } from "constants/teamsNHL";
import { getWCBBTeam, getWCBBTeamLogo } from "constants/teamsWCBB";
import { getWNBATeam, getWNBATeamLogo } from "constants/teamsWNBA";
import { usePreferences } from "contexts/PreferencesContext";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";
import { exploreStyles } from "styles/ExploreStyles/ExploreStyles";
import {
  PlayerResult,
  ResultItem,
  TeamResult,
  UserResult,
} from "types/explore";

type Props = {
  item: ResultItem;
  onSelect: (item: ResultItem) => void;
  onDelete?: (item: ResultItem) => void;
  query?: string;
};

const playerPlaceholderImage =
  "https://res.cloudinary.com/dm3qtdhag/image/upload/v1781892365/playerPlaceholder_vi9zk3.png";

export default function ResultItemRow({
  item,
  onSelect,
  onDelete,
  query = "",
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = exploreStyles(isDark);
  const isRecentSearch = query.trim().length === 0;

  // -------------------------
  // TEAM
  // -------------------------
  const renderTeam = (team: TeamResult) => {
    if (team.is_active === false) return null;
    let teamLogo: any;

    if (team.isNFL && team.id != null)
      teamLogo = getNFLTeamLogo(team.id, isDark);
    else if (team.isWNBA && team.id != null)
      teamLogo = getWNBATeamLogo(team.id, isDark);
    else if (team.isMLB && team.id != null)
      teamLogo = getMLBTeamLogo(team.id, isDark);
    else if (team.isSOCC && team.id != null)
      teamLogo = getSOCCTeamLogo(team.id, isDark);
    else if (team.isNHL && team.id != null)
      teamLogo = getNHLTeamLogo(team.id, isDark);
    else if (team.isCFB && team.id != null)
      teamLogo = getCFBTeamLogo(team.id, isDark);
    else if (team.isCBB && team.id != null)
      teamLogo = getCBBTeamLogo(team.id, isDark);
    else if (team.isWCBB && team.id != null)
      teamLogo = team.logo
        ? { uri: team.logo }
        : getWCBBTeamLogo(team.id, isDark);
    else if (team.id != null) teamLogo = getNBATeamLogo(team.id, isDark);

    return (
      <View style={styles.itemRow}>
        <TouchableOpacity
          onPress={() => onSelect(team)}
          style={styles.itemContainer}
          accessibilityRole="button"
          accessibilityLabel={`Open ${team.full_name || team.name}`}
        >
          <View style={styles.userRow}>
            {teamLogo && <Image source={teamLogo} style={styles.teamLogo} />}
            <View>
              <Text style={styles.name}>{team.full_name || team.name}</Text>
              {team.isWCBB && <Text style={styles.tag}>WCBB</Text>}
              {team.isCBB && <Text style={styles.tag}>CBB</Text>}
              {team.isCFB && <Text style={styles.tag}>CFB</Text>}
            </View>
          </View>
        </TouchableOpacity>
        {isRecentSearch && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(team)}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${team.full_name || team.name} from recent searches`}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? Colors.white : Colors.black}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // -------------------------
  // PLAYER
  // -------------------------
  const renderPlayer = (player: PlayerResult) => {
    const headshot = player.headshot_url ?? playerPlaceholderImage;
    const playerName = player.full_name;
    const teamId = player.team_id ?? null;

    const team =
      teamId && player.isNBA
        ? getNBATeam(teamId)
        : teamId && player.isWNBA
          ? getWNBATeam(teamId)
          : teamId && player.isCBB
            ? getCBBTeam(teamId)
            : teamId && player.isWCBB
              ? getWCBBTeam(teamId)
              : teamId && player.isNFL
                ? getNFLTeam(teamId)
                : teamId && player.isCFB
                  ? getCFBTeam(teamId)
                  : teamId && player.isMLB
                    ? getMLBTeam(teamId)
                    : teamId && player.isNHL
                      ? getNHLTeam(teamId)
                      : teamId && player.isSOCC
                        ? getSOCCTeam(teamId)
                        : null;

    return (
      <View style={styles.itemRow}>
        <TouchableOpacity
          onPress={() => onSelect(player)}
          style={styles.itemContainer}
          accessibilityRole="button"
          accessibilityLabel={`Open ${playerName}`}
        >
          <View style={styles.playerRow}>
            <View style={styles.playerAvatarContainer}>
              <Image source={{ uri: headshot }} style={styles.playerAvatar} />
            </View>
            <View>
              <Text style={styles.name}>{playerName}</Text>
              {(team?.fullName || player.association_name) && (
                <Text style={styles.playerTeam}>
                  {team?.fullName || player.association_name || "Free Agent"}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        {isRecentSearch && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(player)}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${playerName} from recent searches`}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? Colors.white : Colors.black}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // -------------------------
  // USER
  // -------------------------
  const renderUser = (user: UserResult) => {
    const profileImageUrl = user.profileImageUrl?.trim();

    return (
      <View style={styles.itemRow}>
        <TouchableOpacity
          onPress={() => onSelect(user)}
          style={styles.itemContainer}
          accessibilityRole="button"
          accessibilityLabel={`Open ${user.username}`}
        >
          <View style={styles.userRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
            <View>
              <Text style={styles.name}>{user.username}</Text>
              <Text style={styles.subtext}>{user.full_name}</Text>
            </View>
          </View>
        </TouchableOpacity>
        {isRecentSearch && onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(user)}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${user.username} from recent searches`}
          >
            <Ionicons
              name="close"
              size={20}
              color={isDark ? Colors.white : Colors.black}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // -------------------------
  // SWITCH
  // -------------------------
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
