import { useFollowers } from "hooks/useFollowers";
import { useFollowersModalStore } from "store/followersModalStore";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import FollowingButton from "./ModalFollowingButton";
import { Fonts } from "constants/fonts";
type Props = {
  visible: boolean;
  onClose: () => void;
  type: "followers" | "following";
  currentUserId: string;
  targetUserId: string; // user whose followers/following we want to show
};

export default function FollowersModal({
  visible,
  onClose,
  type,
  currentUserId,
  targetUserId,
}: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  // State
  const [search, setSearch] = useState("");
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  // Custom hook for followers/following data & toggle
  const {
    users: usersFromHook,
    loading,
    error,
    toggleFollow,
  } = useFollowers(currentUserId, targetUserId, type);

  // Local copy of users for optimistic UI updates
  const [users, setUsers] = useState(usersFromHook);

  // Sync local users state when hook updates
  useEffect(() => {
    setUsers(usersFromHook);
  }, [usersFromHook]);

  // Show or hide bottom sheet based on visible prop
  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
      setSearch(""); // Clear search on close
    }
  }, [visible]);

  // Navigate to user profile, close modal and mark modal restore
  const { markForRestore } = useFollowersModalStore();
  const handleUserPress = (userId: string) => {
    markForRestore();
    onClose();
    router.push(`/user/${userId}`);
  };

  // Optimistic follow toggle handler
  const handleToggleFollow = async (targetId: string) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id.toString() === targetId
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );
    setLoadingIds((prev) => [...prev, targetId]);
    try {
      await toggleFollow(targetId);
    } catch {
      // Rollback if error
      setUsers((prev) =>
        prev.map((user) =>
          user.id.toString() === targetId
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== targetId));
    }
  };

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    return users
      ? users.filter((u) =>
          u.username.toLowerCase().includes(search.toLowerCase())
        )
      : [];
  }, [users, search]);

  // Snap points for BottomSheet
  const snapPoints = useMemo(() => ["60%", "70%", "80%", "94%"], []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={1}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      )}
      handleStyle={{
        backgroundColor: "transparent",
        paddingTop: 12,
        paddingBottom: 4,
        alignItems: "center",
        position: "absolute",
        left: 8,
        right: 8,
      }}
      handleIndicatorStyle={{
        backgroundColor: isDark ? "#888" : "#444",
        width: 36,
        height: 4,
        borderRadius: 2,
      }}
      backgroundStyle={{ backgroundColor: "transparent" }}
    >
      <BlurView
        intensity={100}
        tint={isDark ? "systemMaterialDark" : "systemMaterialLight"}
        style={styles.blurContainer}
      >
        <View style={styles.modalContainer}>
          <Text style={[styles.title, { color: isDark ? "#fff" : "#1d1d1d" }]}>
            {type === "followers" ? "Followers" : "Following"}
          </Text>

          <TextInput
            placeholder="Search..."
            placeholderTextColor={isDark ? "#aaa" : "#1d1d1d"}
            value={search}
            onChangeText={setSearch}
            style={[
              styles.searchInput,
              {
                borderColor: isDark ? "#aaa" : "#1d1d1d",
                color: isDark ? "#fff" : "#1d1d1d",
              },
            ]}
          />

          {error && (
            <Text
              style={{
                color: "red",
                textAlign: "center",
                marginVertical: 8,
                fontFamily: Fonts.OSREGULAR,
              }}
            >
              {error}
            </Text>
          )}

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
          >
            {filteredUsers.length === 0 && !loading ? (
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
            ) : (
              filteredUsers.map((item) => {
                const imageUri = item.profile_image.startsWith("http")
                  ? item.profile_image
                  : `${process.env.EXPO_PUBLIC_API_URL}${item.profile_image}`;

                const isCurrentUser = item.id.toString() === currentUserId;

                return (
                  <Pressable
                    key={item.id.toString()}
                    onPress={() => handleUserPress(item.id.toString())}
                  >
                    <View
                      style={[
                        styles.userItem,
                        {
                          borderBottomColor: isDark
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(120, 120, 120, 0.5)",
                        },
                      ]}
                    >
                      <Image source={{ uri: imageUri }} style={styles.avatar} />
                      <Text
                        style={[
                          styles.username,
                          { color: isDark ? "#fff" : "#1d1d1d" },
                        ]}
                      >
                        {item.username}
                      </Text>

                      {!isCurrentUser && (
                        <FollowingButton
                          isFollowing={item.isFollowing}
                          loading={loadingIds.includes(item.id.toString())}
                          onToggle={() =>
                            handleToggleFollow(item.id.toString())
                          }
                        />
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
          </BottomSheetScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons
              name="close"
              size={28}
              color={isDark ? "#fff" : "#1d1d1d"}
            />
          </Pressable>
        </View>
      </BlurView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  modalContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.OSBOLD,
    textAlign: "center",
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: Fonts.OSLIGHT,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 100,
    marginRight: 12,
  },
  username: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.OSREGULAR,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 20,
  },
});
