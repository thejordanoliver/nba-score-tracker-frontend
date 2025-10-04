// components/FollowersList.tsx
import { Pressable, Image, Text, View, useColorScheme } from "react-native";
import { Fonts } from "constants/fonts";
import FollowingButton from "./ModalFollowingButton";

type User = {
  id: string;
  username: string;
  profile_image: string;
  isFollowing: boolean;
};

type Props = {
  users: User[];
  loadingIds: string[];
  currentUserId: string;
  onUserPress: (id: string) => void;
  onToggleFollow: (id: string) => void;
};

export default function FollowersList({
  users,
  loadingIds,
  currentUserId,
  onUserPress,
  onToggleFollow,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (!users || users.length === 0) {
    return (
      <Text
        style={{
          textAlign: "center",
          marginTop: 20,
          fontFamily: Fonts.OSREGULAR,
          color: isDark ? "#fff" : "#1d1d1d",
        }}
      >
        No users found.
      </Text>
    );
  }

  return (
    <>
      {users.map((item) => {
        const imageUri = item.profile_image.startsWith("http")
          ? item.profile_image
          : `${process.env.EXPO_PUBLIC_API_URL}${item.profile_image}`;

        const isCurrentUser = item.id.toString() === currentUserId;

        return (
          <Pressable
            key={item.id.toString()}
            onPress={() => onUserPress(item.id.toString())}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: isDark
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(120, 120, 120, 0.5)",
              }}
            >
              <Image source={{ uri: imageUri }} style={{ width: 48, height: 48, borderRadius: 100, marginRight: 12 }} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 16,
                  fontFamily: Fonts.OSREGULAR,
                  color: isDark ? "#fff" : "#1d1d1d",
                }}
              >
                {item.username}
              </Text>

              {!isCurrentUser && (
                <FollowingButton
                  isFollowing={item.isFollowing}
                  loading={loadingIds.includes(item.id.toString())}
                  onToggle={() => onToggleFollow(item.id.toString())}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </>
  );
}
