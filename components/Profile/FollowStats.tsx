import { useFollowersModalStore } from "store/followersModalStore";
import { Follow } from "types/types";
import { Text, TouchableOpacity, View } from "react-native";
import { getStyles } from "../../styles/ProfileScreen.styles";

export default function FollowStats({
  followersCount,
  followingCount,
  isDark,
  currentUserId,
  targetUserId,
}: Follow) {
  const styles = getStyles(isDark);
  const openModal = useFollowersModalStore((state) => state.openModal);

  return (
    <View style={styles.followContainer}>
      <TouchableOpacity
        onPress={() => openModal("followers", targetUserId, currentUserId)}
        style={styles.followItem}
        activeOpacity={0.6}
      >
        <Text style={styles.followCount}>{followersCount}</Text>
        <Text style={styles.followLabel}>Followers</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => openModal("following", targetUserId, currentUserId)}
        style={styles.followItem}
        activeOpacity={0.6}
      >
        <Text style={styles.followCount}>{followingCount}</Text>
        <Text style={styles.followLabel}>Following</Text>
      </TouchableOpacity>
    </View>
  );
}
