import FollowButton from "components/Profile/FollowButton";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { getStyles } from "../../styles/ProfileScreen.styles";

type Props = {
  fullName?: string | null;
  username?: string | null;
  isDark: boolean;
  isCurrentUser: boolean;

  // Props for edit profile (only relevant if isCurrentUser)
  onEditPress?: () => void;

  // Props for follow button (only relevant if !isCurrentUser)
  isFollowing?: boolean;
  loading?: boolean;
  onToggleFollow?: () => void;
};

export default function ProfileHeader({
  fullName,
  username,
  isDark,
  isCurrentUser,
  onEditPress,
  isFollowing,
  loading,
  onToggleFollow,
}: Props) {
  const styles = getStyles(isDark);

  return (
    <View style={styles.wrapper}>
      <View style={styles.nameContainer}>
        <Text style={styles.fullNameText}>{fullName}</Text>
        <Text style={styles.usernameText}>
          {"@" + (username || "Your Username")}
        </Text>
      </View>

      {isCurrentUser ? (
        <Pressable style={styles.editProfileBtn} onPress={onEditPress}>
          <Ionicons
            style={styles.editIcon}
            name="create"
            size={18}
            color={isDark ? "#000" : "#fff"}
          />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </Pressable>
      ) : (
        <FollowButton
          isFollowing={!!isFollowing}
          loading={!!loading}
          onToggle={onToggleFollow ?? (() => {})}
        />
      )}
    </View>
  );
}
