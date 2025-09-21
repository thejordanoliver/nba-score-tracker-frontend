import { Fonts } from "constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { useEffect, useRef, useState } from "react";
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
  useColorScheme,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Post } from "./PostItem";

interface CommentItemProps {
  comment: Post;
  isDark: boolean;
  BASE_URL: string;
  currentUserId: string | number;
  editComment: (commentId: string, newText: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}
const COLLAPSED_HEIGHT = 60;

export const CommentItem = ({
  comment,
  isDark,
  BASE_URL,
  currentUserId,
  editComment,
  deleteComment,
}: CommentItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [textExpanded, setTextExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const [fullHeight, setFullHeight] = useState(0);
  const colorScheme = useColorScheme();

  const styles = getStyles(isDark);
  // Animate height when textExpanded changes
  useEffect(() => {
    const toValue = textExpanded ? fullHeight || 100 : COLLAPSED_HEIGHT;

    Animated.timing(animatedHeight, {
      toValue,
      duration: 100,
      easing: Easing.inOut(Easing.bezier(0.5, 0.5, 0.5, 0.5)),
      useNativeDriver: false,
    }).start();
  }, [textExpanded, fullHeight]);

  const needsExpandCollapse =
    comment.text.split("\n").length > 2 || comment.text.length > 100;

  const profileUri = comment.profile_image
    ? comment.profile_image.startsWith("http")
      ? comment.profile_image
      : `${BASE_URL}${comment.profile_image}`
    : null;

  const isAuthor = String(currentUserId) === String(comment.user_id);

  const confirmDelete = () => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteComment(comment.id),
        },
      ]
    );
  };

  const onSaveEdit = async () => {
    if (editText.trim() && editText !== comment.text) {
      await editComment(comment.id, editText.trim());
    }
    setIsEditing(false);
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!isAuthor || isEditing) return null;

    const translateX = dragX.interpolate({
      inputRange: [-150, 0],
      outputRange: [0, 150],
      extrapolate: "clamp",
    });
    return (
      <Animated.View
        style={[styles.actionsContainer, { transform: [{ translateX }] }]}
      >
        <View style={styles.actionWrapper}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create" size={24} color={"#fff"} />
          </TouchableOpacity>
        </View>
        <View style={styles.actionWrapper}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F44336" }]}
            onPress={confirmDelete}
          >
            <Ionicons name="trash" size={24} color={"#fff"} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const rawTimeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
  });
  // Remove "about " prefix if present
  const timeAgo = rawTimeAgo.startsWith("about ")
    ? rawTimeAgo.slice(6)
    : rawTimeAgo;

  return (
    <View
      style={[
        styles.container,

        { position: "relative" }, // to allow absolutely positioned actions inside
      ]}
    >
      <Swipeable renderRightActions={renderRightActions}>
        <View>
          {/* User section here */}
          <View style={styles.user}>
            {profileUri ? (
              <Image source={{ uri: profileUri }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.placeholder]}>
                <Text style={{ color: "#fff" }}>
                  {comment.username[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                flex: 1,
              }}
            >
              <Text
                style={[styles.username, { color: isDark ? "#ccc" : "#888" }]}
              >
                {comment.username}
              </Text>
              <Text
                style={[styles.timeAgo, { color: isDark ? "#aaa" : "#666" }]}
              >
                {timeAgo}
              </Text>
            </View>
          </View>

          {isEditing ? (
            <>
              {/* Editing UI unchanged */}
              <TextInput
                style={{
                  backgroundColor: isDark ? "#2e2e2e" : "#eee", // must be non-transparent
                  color: isDark ? "#fff" : "#000",
                  fontSize: 14,
                  fontFamily: Fonts.OSLIGHT,
                  paddingVertical: 12,
                  paddingHorizontal: 6,
                  borderRadius: 6,
                  marginVertical: 12,
                }}
                multiline
                value={editText}
                onChangeText={setEditText}
                cursorColor={isDark ? "#00ff00" : "#008800"} // bright color to test
                selectionColor={isDark ? "#fff" : "#1d1d1d"} // also highlights selected text
              />

              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={onSaveEdit}
                  style={{ marginRight: 12 }}
                >
                  <Text
                    style={{
                      color: isDark ? "#00ff00" : "#008800",
                      fontFamily: Fonts.OSBOLD,
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <Text
                    style={{
                      color: isDark ? "#ff4444" : "#cc0000",
                      fontFamily: Fonts.OSBOLD,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Animated.View
                style={{
                  height: animatedHeight,
                  overflow: textExpanded ? "visible" : "hidden",
                }}
              >
                <Animated.View
                  style={{
                    height: animatedHeight,
                    overflow: textExpanded ? "visible" : "hidden",
                    justifyContent: "center", // vertically center content inside Animated.View
                  }}
                >
                  <Text
                    style={[
                      styles.text,
                      {
                        color: isDark ? "#eee" : "#333",
                        textAlignVertical: "center", // for Android vertical centering
                      },
                    ]}
                    numberOfLines={textExpanded ? undefined : 3} // Show 3 lines when collapsed
                  >
                    {comment.text}
                  </Text>
                </Animated.View>
              </Animated.View>

              {(comment.text.split("\n").length > 2 ||
                comment.text.length > 100) && (
                <TouchableOpacity
                  onPress={() => setTextExpanded(!textExpanded)}
                  style={{ marginTop: 4 }}
                >
                  <Text
                    style={{
                      color: isDark ? "#888" : "#aaa",
                      fontFamily: Fonts.OSBOLD,
                      marginBottom: 8,
                    }}
                  >
                    {textExpanded ? "Collapse" : "Expand"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Hidden Text to measure full height */}
              <Text
                style={[
                  styles.text,
                  {
                    position: "absolute",
                    opacity: 0,
                    zIndex: -1,
                    left: -1000,
                    top: 0,
                    width: "90%",
                  },
                ]}
                onLayout={(e) => {
                  const h = e.nativeEvent.layout.height;
                  if (h > fullHeight) {
                    setFullHeight(h);
                    if (!textExpanded) {
                      animatedHeight.setValue(COLLAPSED_HEIGHT);
                    }
                  }
                }}
              >
                {comment.text}
              </Text>
            </>
          )}
        </View>
      </Swipeable>
    </View>
  );
};

export function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      marginHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#444" : "#ddd",
      flexDirection: "column",
    },
    user: {
      paddingTop: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    image: {
      width: 24,
      height: 24,
      borderRadius: 18,
      marginRight: 10,
    },
    placeholder: {
      backgroundColor: "#888",
      justifyContent: "center",
      alignItems: "center",
    },
    username: {
      fontFamily: Fonts.OSREGULAR,
    },
    timeAgo: {
      fontFamily: Fonts.OSLIGHT,
      fontSize: 12,
      paddingRight: 12,
    },
    text: {
      textAlign: "left",
      fontSize: 14,
      fontFamily: Fonts.OSLIGHT,
      paddingTop: 12,
    },
    actionsContainer: {
      width: 150,
      flexDirection: "row",
    },
    actionWrapper: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",

      width: 75,
    },
    actionButton: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "100%",
    },
  });
}
