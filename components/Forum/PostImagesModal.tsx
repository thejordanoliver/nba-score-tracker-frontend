import { Ionicons } from "@expo/vector-icons";
import { Fonts } from "constants/fonts";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const screenWidth = Dimensions.get("window").width;

type PostImagesModalProps = {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
  postText?: string;
  likesCount?: number;
  commentsCount?: number;
  profileImage?: string | null;
  username?: string;
};

export default function PostImagesModal({
  visible,
  images,
  initialIndex,
  onClose,
  postText,
  likesCount = 0,
  commentsCount = 0,
  profileImage,
  username,
}: PostImagesModalProps) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const [expanded, setExpanded] = useState(false);
  const [textHeight, setTextHeight] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  const [imageDimensions, setImageDimensions] = useState<{
    [key: string]: number;
  }>({});

  const handleImageLoad = (uri: string, width: number, height: number) => {
    const calculatedHeight = (height / width) * screenWidth;
    setImageDimensions((prev) => ({ ...prev, [uri]: calculatedHeight }));
  };

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const flatListRef = useRef<FlatList<string>>(null);

  const fullProfileImageUri =
    profileImage && !profileImage.startsWith("http")
      ? `${BASE_URL}${profileImage}`
      : profileImage;

  useEffect(() => {
    if (visible) {
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
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: initialIndex,
            animated: false,
          });
        }, 50);
      });
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.85,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale, initialIndex]);

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: expanded ? fullHeight : textHeight,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [expanded, textHeight, fullHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.modalBackground} />
        {/* Image Gallery */}

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
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, idx) => `${uri}_${idx}`}
            renderItem={({ item }) => {
              const dynamicHeight =
                imageDimensions[item] || (screenWidth * 3) / 4;
              return (
                <View
                  style={{
                    width: screenWidth,
                    justifyContent: "center",
                    alignItems: "flex-start",
                    paddingHorizontal: 16,
                    paddingBottom: 80,
                  }}
                >
                  <View
                    style={{
                      width: screenWidth - 32,
                      height: dynamicHeight,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: "#1d1d1d",
                    }}
                  >
                    <Image
                      source={{ uri: item }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                      onLoad={() =>
                        Image.getSize(item, (w, h) =>
                          handleImageLoad(item, w, h)
                        )
                      }
                    />
                  </View>
                </View>
              );
            }}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            initialScrollIndex={initialIndex}
          />
        </Animated.View>

        {/* Caption Overlay */}
        {postText && (
          <>
            <View style={styles.captionOverlay}>
              <BlurView
                intensity={80}
                tint="systemMaterialDark"
                style={StyleSheet.absoluteFill}
              />
              <Animated.View
                style={{ height: animatedHeight, overflow: "hidden" }}
              >
                <Text
                  style={styles.captionText}
                  numberOfLines={expanded ? undefined : 3}
                  onLayout={(e) => {
                    if (!textHeight && !expanded)
                      setTextHeight(e.nativeEvent.layout.height);
                  }}
                >
                  {postText}
                </Text>

                {/* Hidden full text for measuring */}
                <Text
                  style={[
                    styles.captionText,
                    { position: "absolute", opacity: 0 },
                  ]}
                  onLayout={(e) => {
                    if (!fullHeight) setFullHeight(e.nativeEvent.layout.height);
                  }}
                >
                  {postText}
                </Text>
              </Animated.View>

              {fullHeight > textHeight + 5 && (
                <Text
                  style={styles.readMoreText}
                  onPress={() => setExpanded((prev) => !prev)}
                >
                  {expanded ? "Show less" : "Read more"}
                </Text>
              )}

              <View style={styles.engagementRow}>
                <View style={styles.iconWithText}>
                  <Ionicons name="heart-outline" size={28} color="#fff" />
                  <Text style={styles.engagementText}>{likesCount}</Text>
                </View>
                <View style={styles.iconWithText}>
                  <Ionicons name="chatbubble-outline" size={28} color="#fff" />
                  <Text style={styles.engagementText}>{commentsCount}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
    },
    modalBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: 0,
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
      paddingBottom: 24,
      borderTopColor: "#888",
      borderTopWidth: 0.5,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
      borderRadius: 60,
    },
    username: {
      fontFamily: Fonts.OSREGULAR,
      marginBottom: 4,
      color: "#fff",
    },
    captionText: {
      fontSize: 14,
      color: "#fff",
      textAlign: "left",
      fontFamily: Fonts.OSREGULAR,
      marginBottom: 10,
    },
    readMoreText: {
      color: "#aaa",
      fontFamily: Fonts.OSREGULAR,
      fontSize: 13,
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
      fontSize: 16,
      color: "#fff",
      fontFamily: Fonts.OSREGULAR,
    },
    closeButton: {
      padding: 10,
      borderRadius: 8,
      zIndex: 10,
    },
  });
}
