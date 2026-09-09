// components/FollowersList.tsx
import { Ionicons } from "@expo/vector-icons";
import { Colors, globalStyles, PLACEHOLDER_AVATAR } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { User } from "hooks/UserHooks/useFollowers";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { followersListStyles } from "styles/ProfileStyles/FollowersListStyles";
import FollowerListSkeleton from "../Skeletons/Profile/FollowerListSkeleton";
import FollowingButton from "./ModalFollowingButton";

type Props = {
  users: User[];
  loading: boolean;
  loadingIds: string[];
  currentUserId: string;
  onUserPress: (id: string) => void;
  onToggleFollow: (id: string) => void;
  error: string | null;
};

export default function FollowersList({
  users,
  loading,
  loadingIds,
  currentUserId,
  onUserPress,
  onToggleFollow,
  error,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = followersListStyles(isDark);
  const global = globalStyles(isDark);

  if (loading) return <FollowerListSkeleton />;

  if (error && (!users || users.length === 0)) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.emptyText}>{error}</Text>
      </View>
    );
  }

  if (!users || users.length === 0) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.emptyText}>No users found.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: User }) => {
    const profileImage = item.profile_image || PLACEHOLDER_AVATAR;
    const isCurrentUser = item.id.toString() === currentUserId;

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemContainer}>
          <TouchableOpacity
            onPress={() => onUserPress(item.id.toString())}
            style={styles.userRow}
          >
            <View style={styles.avatarContainer}>
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            </View>
            <Text style={styles.username}>{item.username}</Text>
          </TouchableOpacity>
        </View>
        {item.followsYou && (
          <Ionicons
            name="infinite-outline"
            size={14}
            color={Colors.midTone}
            style={styles.mutalIcon}
          />
        )}
        {!isCurrentUser && (
          <FollowingButton
            isFollowing={item.isFollowing}
            loading={loadingIds.includes(item.id.toString())}
            onToggle={() => onToggleFollow(item.id.toString())}
          />
        )}
      </View>
    );
  };

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
}
