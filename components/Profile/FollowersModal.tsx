import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Fonts } from "constants/fonts";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useFollowers } from "hooks/useFollowers";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useFollowersModalStore } from "store/followersModalStore";
import FollowersList from "./FollowersList";

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

  // State
  const [search, setSearch] = useState("");
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);
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

  const filteredUsers = useMemo(() => {
    return users
      ? users
          .filter((u) =>
            u.username.toLowerCase().includes(search.toLowerCase())
          )
          .map((u) => ({
            ...u,
            id: u.id.toString(), // <-- normalize to string
          }))
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
      handleComponent={() => (
        <View style={styles.header}>
          <View
            style={{
              backgroundColor: "#aaa",
              width: 36,
              height: 4,
              borderRadius: 2,
              zIndex: 9999,
              marginBottom: 4,
            }}
          ></View>
          <Text style={[styles.title, { color: isDark ? "#fff" : "#1d1d1d" }]}>
            {type === "followers" ? "Followers" : "Following"}
          </Text>
        </View>
      )}
      backgroundStyle={{ backgroundColor: "transparent" }}
    >
      <BlurView
        intensity={100}
        tint={isDark ? "systemMaterialDark" : "systemMaterialLight"}
        style={styles.blurContainer}
      >
        <View style={styles.modalContainer}>
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
            <FollowersList
              users={filteredUsers}
              loadingIds={loadingIds}
              currentUserId={currentUserId}
              onUserPress={handleUserPress}
              onToggleFollow={handleToggleFollow}
            />
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

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    blurContainer: {
      flex: 1,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: "hidden",
    },
    modalContainer: {
      paddingTop: 68,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    header: {
      position: "absolute",
      width: "100%",
      top: 0,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "#444" : "#aaa",
      paddingVertical: 12,
    },
    title: {
      textAlign: "center",
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      fontFamily: Fonts.OSBOLD,
      color: isDark ? "#fff" : "#1d1d1d",
      fontSize: 18,
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
