import { useBadgeNotifications } from "@/hooks/ForumHooks/useBadgeNotifications";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLikesStore } from "store/useLikesStore";
import type {
  ForumDisplayMediaItem,
  ForumLikeMutationResponse,
  ForumPost,
  ForumPostImagesModalProps,
} from "types/forum";
import { apiClient, BASE_URL } from "utils/apiClient";
import AppVideo from "../AppVideo";
const screenWidth = Dimensions.get("window").width;
const COLLAPSED_LINES = 3;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PostImagesModal({
  visible,
  postId,
  media,
  initialIndex,
  onClose,
  postText,
  likesCount = 0,
  commentsCount = 0,
  likedByCurrentUser = false,
  profileImage,
  username,
  postAuthorUserId,
  currentUserId,
}: ForumPostImagesModalProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = getStyles(isDark);

  const flatListRef = useRef<FlatList<ForumDisplayMediaItem>>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const [expandedHeight, setExpandedHeight] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [captionVisible, setCaptionVisible] = useState(true);
  const captionOpacity = useRef(new Animated.Value(1)).current;
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [likePending, setLikePending] = useState(false);

  const { likes, setLike } = useLikesStore();
  const likeState = likes[postId];
  const { handleBadgeAwards } = useBadgeNotifications();

  const fullProfileImageUri =
    profileImage && !profileImage.startsWith("http")
      ? `${BASE_URL}${profileImage}`
      : profileImage;

  /* -------------------- Likes -------------------- */

  useEffect(() => {
    if (!likeState && postId) {
      setLike(postId, likedByCurrentUser, likesCount);
    }
  }, [likeState, likedByCurrentUser, likesCount, postId, setLike]);

  const liked = likeState?.liked ?? likedByCurrentUser;
  const likeCount = likeState?.count ?? likesCount;

  const toggleLikePress = async () => {
    if (!postId || likePending) return;

    const nextLiked = !liked;
    const optimisticCount = Math.max(likeCount + (liked ? -1 : 1), 0);

    setLike(postId, nextLiked, optimisticCount);
    setLikePending(true);

    try {
      const response = await apiClient.patch<
        ForumLikeMutationResponse<Partial<ForumPost>>
      >(`/api/forum/post/${postId}/like`, {
        like: nextLiked,
      });

      const serverPost = response.data.post;

      setLike(
        postId,
        typeof serverPost?.liked_by_current_user === "boolean"
          ? serverPost.liked_by_current_user
          : nextLiked,
        typeof serverPost?.likes === "number"
          ? serverPost.likes
          : optimisticCount,
      );

      if (currentUserId != null && currentUserId === postAuthorUserId) {
        handleBadgeAwards(response.data.newlyAwardedBadges);
      } else if (__DEV__ && response.data.newlyAwardedBadges?.length) {
        console.warn(
          "Ignoring badge awards returned for a post author on another user's device.",
        );
      }
    } catch {
      setLike(postId, liked, likeCount);
    } finally {
      setLikePending(false);
    }
  };

  /* -------------------- Open / Close Animation -------------------- */

  const toggleCaption = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (!visible || media.length === 0) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      requestAnimationFrame(() => {
        if (
          flatListRef.current &&
          initialIndex >= 0 &&
          initialIndex < media.length
        ) {
          flatListRef.current.scrollToIndex({
            index: initialIndex,
            animated: false,
          });
        }
      });
    });
  }, [initialIndex, media.length, opacity, scale, visible]);

  useEffect(() => {
    if (!collapsedHeight || !expandedHeight) return;

    Animated.timing(animatedHeight, {
      toValue: expanded ? expandedHeight : collapsedHeight,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // ❗ height animation
    }).start();
  }, [animatedHeight, collapsedHeight, expanded, expandedHeight]);

  useEffect(() => {
    if (visible) {
      setExpanded(false);
      setCollapsedHeight(0);
      setExpandedHeight(0);
    }
  }, [captionOpacity, visible]);

  /* -------------------- Video Pauses On Swipe -------------------- */
  useEffect(() => {
    if (playingIndex !== null && playingIndex !== activeIndex) {
      setPlayingIndex(null);
    }
  }, [activeIndex, playingIndex]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    },
  ).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80,
  };

  /* -------------------- Caption Disappers/Reappear on Toggle -------------------- */
  const toggleCaptionVisibility = () => {
    const toValue = captionVisible ? 0 : 1;

    Animated.timing(captionOpacity, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setCaptionVisible(!captionVisible);
  };

  useEffect(() => {
    if (visible) {
      captionOpacity.setValue(1);
      setCaptionVisible(true);
    }
  }, [captionOpacity, visible]);

  useEffect(() => {
    if (visible) {
      setPlayingIndex(null); // ⛔ never autoplay on open
    }
  }, [visible, initialIndex]);

  /* -------------------- Render -------------------- */

  return (
    <Modal visible={visible} transparent animationType="fade">
      <SafeAreaView style={styles.modalContainer}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.modalBackground} />

        <Animated.View
          style={[styles.galleryWrapper, { opacity, transform: [{ scale }] }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.user}>
              {fullProfileImageUri && (
                <Image
                  source={{ uri: fullProfileImageUri }}
                  style={styles.profileImage}
                />
              )}
              <Text style={styles.username}>{username}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {/* Media Carousel */}
          <FlatList
            ref={flatListRef}
            data={media}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, idx) => `${item.type}-${idx}`}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            initialScrollIndex={initialIndex}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={1}
                onPress={toggleCaptionVisibility}
                style={styles.imageContainer}
              >
                {item.type === "video" ? (
                  playingIndex === index ? (
                    <AppVideo
                      uri={item.uri}
                      style={styles.media}
                      contentFit="cover"
                      autoPlay={playingIndex === index}
                      nativeControls
                      onEnd={() => setPlayingIndex(null)}
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => setPlayingIndex(index)}
                    >
                      <View>
                        {item.thumbnailUri ? (
                          <Image
                            source={{ uri: item.thumbnailUri }}
                            style={styles.media}
                          />
                        ) : (
                          <View style={[styles.media, styles.videoFallback]} />
                        )}

                        {/* ▶️ Play overlay */}
                        <View style={styles.playOverlay}>
                          <Ionicons
                            name="play-circle"
                            size={72}
                            color="white"
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                ) : (
                  <Image source={{ uri: item.uri }} style={styles.image} />
                )}
              </TouchableOpacity>
            )}
          />
        </Animated.View>

        {/* Caption + Engagement */}
        {postText && (
          <Animated.View
            style={[styles.captionOverlay, { opacity: captionOpacity }]}
          >
            <BlurView
              intensity={100}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            {/* Truncation detector */}
            <Text
              style={[
                styles.captionText,
                { position: "absolute", opacity: 0, zIndex: -1 },
              ]}
              onTextLayout={(e) => {
                if (e.nativeEvent.lines.length > COLLAPSED_LINES) {
                  setIsTruncated(true);
                }
              }}
            >
              {postText}
            </Text>
            {/* Visible caption */}
            <Text
              style={styles.captionText}
              numberOfLines={expanded ? undefined : COLLAPSED_LINES}
            >
              {postText}
            </Text>
            {isTruncated && (
              <TouchableOpacity onPress={toggleCaption}>
                <Text style={styles.showMoreText}>
                  {expanded ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>
            )}
            <View style={styles.engagementRow}>
              <TouchableOpacity
                onPress={toggleLikePress}
                disabled={likePending}
                style={styles.iconWithText}
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={28}
                  color={
                    liked && isDark
                      ? Colors.dark.lightRed
                      : liked
                        ? Colors.light.red
                        : Colors.white
                  }
                />
                <Text style={styles.engagementText}>{likeCount}</Text>
              </TouchableOpacity>

              <View style={styles.iconWithText}>
                <Ionicons
                  name="chatbubble-outline"
                  size={28}
                  color={Colors.white}
                />
                <Text style={styles.engagementText}>{commentsCount}</Text>
              </View>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* -------------------- Styles -------------------- */

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    modalContainer: {
      position: "relative",
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    modalBackground: {
      ...StyleSheet.absoluteFill,
      zIndex: 0,
      backgroundColor: "rgba(0, 0, 0, 0.10)",
    },
    galleryWrapper: {
      flex: 1,
      width: screenWidth,
    },
    captionOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      padding: 12,
      paddingBottom: 40,
      borderTopWidth: 0.5,
      borderTopColor: Colors.midTone,
    },
    videoFallback: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.black,
    },

    imageContainer: {
      alignItems: "flex-start",
      justifyContent: "center",
      width: screenWidth,
      paddingBottom: 80,
    },
    imageWrapper: {
      width: screenWidth - 32,
      borderWidth: 1,
      borderColor: Colors.white,
      borderRadius: 12,
      backgroundColor: Colors.black,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
      paddingVertical: 12,
      borderRadius: 10,
      overflow: "hidden",
      resizeMode: "contain",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: 12,
      paddingTop: 20,
    },
    user: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    profileImage: {
      width: 40,
      height: 40,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.white,
      borderRadius: 60,
    },
    username: {
      marginBottom: 4,
      fontFamily: Fonts.REGULAR,
      color: Colors.white,
    },
    captionText: {
      marginBottom: 10,
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: Colors.white,
      textAlign: "left",
    },

    engagementRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: 16,
      marginTop: 8,
    },
    iconWithText: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    engagementText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: Colors.white,
    },
    closeButton: {
      zIndex: 10,
      padding: 10,
      borderRadius: 8,
    },
    mediaContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: screenWidth,
    },
    media: {
      width: screenWidth,
      height: 320,
    },
    showMoreText: {
      marginVertical: 12,
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: Colors.lightGray,
    },
    playOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      alignItems: "center",
      justifyContent: "center",
      width: screenWidth,
      height: 320,
      backgroundColor: "rgba(0,0,0,0.25)",
    },
  });
}
