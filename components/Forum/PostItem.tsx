// components/Forum/PostItem.tsx
import { Fonts } from "constants/fonts";
import { useLikesStore } from "store/useLikesStore";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { ResizeMode, Video } from "expo-av";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { memo, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PostImages from "./PostImages";

export interface Post {
  id: string;
  username: string;
  full_name: string | null;
  profile_image: string | null;
  text: string;
  likes: number;
  comments_count: number;
  created_at: string;
  user_id: string | number;
  liked_by_current_user: boolean;
  images?: string[];
  videos?: string[];
}

interface PostItemProps {
  item: Post;
  isDark: boolean;
  styles: ReturnType<typeof getStyles>;
  token: string | null;
  currentUserId: number | null;
  deletePost: (postId: string) => void;
  editPost: (postId: string, newText: string) => void;
  BASE_URL: string;
  onImagePress: (uri: string, caption?: string) => void;
    disableCommentNavigation?: boolean; // 👈 new

}

export const PostItem = memo(function PostItem({
  item,
  isDark,
  styles,
  token,
  currentUserId,
  deletePost,
  editPost,
  BASE_URL,
  onImagePress,   disableCommentNavigation,
}: PostItemProps) {
  const { likes, setLike, toggleLike } = useLikesStore();
  const likeState = likes[item.id];
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const router = useRouter();

  const profileImageUri = item.profile_image
    ? item.profile_image.startsWith("http")
      ? item.profile_image
      : `${BASE_URL}${item.profile_image}`
    : null;

  const IMG_BASE_URL = `${BASE_URL}/uploads/forum-images/`;

  const postImages = (item.images ?? []).map((img) => {
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads/forum-images/")) {
      return `${IMG_BASE_URL}${img.split("/uploads/forum-images/")[1]}`;
    }
    return `${IMG_BASE_URL}${img}`;
  });

  const postVideos = (item.videos ?? []).map((vid) => {
    if (vid.startsWith("http")) return vid;
    if (vid.startsWith("/uploads/forum-images/")) {
      return `${IMG_BASE_URL}${vid.split("/uploads/forum-images/")[1]}`;
    }
    return `${IMG_BASE_URL}${vid}`;
  });

  // If no entry yet, initialize it from item props
  useEffect(() => {
    if (!likeState) {
      setLike(item.id, item.liked_by_current_user, item.likes);
    }
  }, [item.id, item.liked_by_current_user, item.likes]);

  const liked = likeState?.liked ?? item.liked_by_current_user;
  const likeCount = likeState?.count ?? item.likes;

  const toggleLikePress = async () => {
    if (!token) {
      alert("You must be logged in to like posts.");
      return;
    }

    toggleLike(item.id);

    try {
      await axios.patch(
        `${BASE_URL}/api/forum/post/${item.id}/like`,
        { like: !liked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err: any) {
      // rollback
      toggleLike(item.id);
      alert(
        err.response?.data?.error || err.message || "Failed to toggle like"
      );
    }
  };

  const onSaveEdit = () => {
    if (editText.trim() && editText !== item.text) {
      editPost(item.id, editText);
    }
    setIsEditing(false);
    setDropdownVisible(false);
  };

  const isAuthor =
    currentUserId != null && String(currentUserId) === String(item.user_id);

  const confirmDelete = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePost(item.id);
            setDropdownVisible(false);
          },
        },
      ]
    );
  };
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const showDropdown = () => {
    setDropdownVisible(true);
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // standard cubic easing
      useNativeDriver: true,
    }).start();
  };

  const hideDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start(() => setDropdownVisible(false));
  };

  const getTextStyle = (isDark: boolean, isDelete?: boolean) => ({
    fontSize: 18,
    color: isDelete
      ? isDark
        ? "#ff4444"
        : "#cc0000"
      : isDark
        ? "#fff"
        : "#1d1d1d",
    fontFamily: Fonts.OSREGULAR,
    paddingVertical: 8,
    paddingHorizontal: 12,
  });

  return (
    <View style={styles.containerWrapper}>
      <View style={styles.postContainer}>
        <View style={[styles.userRow, { justifyContent: "space-between" }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => {
                router.push(`/user/${item.user_id}`);
              }}
              activeOpacity={0.7}
            >
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, styles.profilePlaceholder]}>
                  <Text style={{ color: "#fff", fontFamily: Fonts.OSBOLD }}>
                    {item.username[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                router.push(`/user/${item.user_id}`);
              }}
              activeOpacity={0.7}
              style={{ marginLeft: 4 }}
            >
              <Text style={styles.username}>{item.username}</Text>
            </TouchableOpacity>
          </View>

          {isAuthor && (
            <TouchableOpacity
              onPress={() => {
                if (dropdownVisible) {
                  hideDropdown();
                } else {
                  showDropdown();
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={24}
                color={isDark ? "#fff" : "#1d1d1d"}
              />
            </TouchableOpacity>
          )}
        </View>

        {dropdownVisible && (
          <Animated.View
            style={[
              styles.dropdownMenu,
              {
                opacity: dropdownAnim,
                transform: [
                  {
                    translateY: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0], // slide in from above
                    }),
                  },
                ],
              },
            ]}
          >
            <BlurView
              intensity={50}
              tint="systemChromeMaterial"
              style={{
                borderRadius: 8,
                borderTopRightRadius: 4,
                overflow: "hidden",
              }}
            >
              <View style={styles.dropdownItem}>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(true);
                    hideDropdown();
                  }}
                >
                  <Text style={getTextStyle(isDark)}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View>
                <TouchableOpacity onPress={confirmDelete}>
                  <Text style={getTextStyle(isDark, true)}>Delete</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        )}

        {isEditing ? (
          <TextInput
            style={[
              styles.postText,
              {
                borderColor: isDark ? "#444" : "#ccc",
                borderWidth: 1,
                borderRadius: 6,
                padding: 6,
                minHeight: 100,
              },
            ]}
            multiline
            value={editText}
            onChangeText={setEditText}
          />
        ) : (
          <View style={styles.postTextWrapper}>
            <Text style={styles.postText}>{item.text}</Text>

            {(postImages.length > 0 || postVideos.length > 0) && (
              <>
                {postImages.length > 0 && (
                  <PostImages
                    postImages={postImages}
                    item={item}
                    onImagePress={onImagePress}
                  />
                )}
                {postVideos.map((uri, idx) => (
                  <View key={`video-${idx}`} style={{ marginTop: 10 }}>
                    <Video
                      source={{ uri }}
                      isLooping={true}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      style={{ width: "100%", height: 250, borderRadius: 8 }}
                    />
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        <View style={styles.postFooter}>
          {isEditing ? (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={onSaveEdit}
                style={{ marginRight: 10 }}
              >
                <Text
                  style={{
                    color: "green",
                    fontSize: 16,
                    fontFamily: Fonts.OSREGULAR,
                  }}
                >
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text
                  style={{
                    color: isDark ? "#ff4444" : "#cc0000",
                    fontSize: 16,
                    fontFamily: Fonts.OSREGULAR,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.interactionContainer}>
                <View style={styles.interactionWrapper}>
                  <View style={styles.leftSide}>
                    <TouchableOpacity
                      onPress={toggleLikePress}
                      style={styles.likeButtonContainer}
                    >
                      <Ionicons
                        name={liked ? "heart" : "heart-outline"}
                        size={28}
                        color={isDark ? "#fff" : "#1d1d1d"}
                      />
                      <Text style={styles.count}>{likeCount}</Text>
                    </TouchableOpacity>
                  <TouchableOpacity
  onPress={() => {
    if (!disableCommentNavigation) {
      router.push({
        pathname: "/comment-thread/[postId]",
        params: { postId: item.id },
      });
    }
  }}
  style={styles.likeButtonContainer}
>
  <Ionicons
    name="chatbubble-outline"
    size={28}
    color={isDark ? "#fff" : "#1d1d1d"}
  />
  <Text style={styles.count}>{item.comments_count}</Text>
</TouchableOpacity>

                  </View>
                  <View style={styles.rightSide}>
                    <TouchableOpacity style={styles.likeButtonContainer}>
                      <Text style={styles.count}>0</Text>
                      <Ionicons
                        name="bookmark-outline"
                        size={28}
                        color={isDark ? "#fff" : "#1d1d1d"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.likeButtonContainer}>
                      <Text style={styles.count}>0</Text>
                      <Ionicons
                        name="share-social-outline"
                        size={28}
                        color={isDark ? "#fff" : "#1d1d1d"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.timeWrapper}>
                  <Text style={styles.timestamp}>
                    {formatDistanceToNow(new Date(item.created_at), {
                      addSuffix: true,
                    }).replace(/^about /, "")}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
});

export function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: { flex: 1 },
    containerWrapper: {
      paddingTop: 12,
      paddingHorizontal: 12,
    },
    postContainer: {
      borderBottomColor: isDark ? "#444" : "#ddd",
      borderBottomWidth: 1,
      paddingVertical: 10,
    },
    username: {
      fontFamily: Fonts.OSREGULAR,
      marginBottom: 4,
      color: isDark ? "#fff" : "#000",
    },
    timeWrapper: { flex: 1, justifyContent: "flex-end" },
    timestamp: {
      fontFamily: Fonts.OSLIGHT,
      fontSize: 12,
      color: isDark ? "#aaa" : "#666",
      textAlign: "left",
    },
    postTextWrapper: {
      minHeight: 100,
      justifyContent: "center",
    },
    postText: {
      marginTop: 12,
      marginBottom: 12,
      fontFamily: Fonts.OSREGULAR,
      fontSize: 16,
      color: isDark ? "#eee" : "#000",
    },
    postFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    leftSide: {
      flexDirection: "row",
    },
    rightSide: {
      flexDirection: "row",
    },
    error: {
      color: "red",
      marginVertical: 10,
      textAlign: "center",
    },
    userRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 50,
      marginRight: 8,
    },
    profilePlaceholder: {
      backgroundColor: isDark ? "#555" : "#888",
      justifyContent: "center",
      alignItems: "center",
    },
    likeButtonContainer: {
      flexDirection: "row",
      alignItems: "center",
      width: 50,
    },
    count: {
      fontSize: 16,
      color: isDark ? "#fff" : "#1d1d1d",
      marginLeft: 4,
      marginRight: 4,
      fontFamily: Fonts.OSREGULAR,
    },
    interactionContainer: { flex: 1 },
    interactionWrapper: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 8,
    },
    dropdownMenu: {
      position: "absolute",
      right: 12,
      top: 36,
      borderRadius: 8,
      borderTopRightRadius: 2,
      overflow: "hidden",
      width: 120,
      height: 100,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 1000,
      justifyContent: "center",
    },
    dropdownItem: { borderBottomWidth: 1, borderBottomColor: "#888" },
    floatingButton: {
      position: "absolute",
      bottom: 100,
      right: 20,
      backgroundColor: isDark ? "#eee" : "#1d1d1d",
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    singleImageWrapper: {
      marginTop: 4,
    },
    singlePostImage: {
      width: "100%",
      height: 250,
      borderRadius: 8,
      marginBottom: 10,
    },
  });
}
