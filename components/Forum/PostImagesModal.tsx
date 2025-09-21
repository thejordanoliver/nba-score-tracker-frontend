import { Fonts } from "constants/fonts";
import { Ionicons } from "@expo/vector-icons";
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
  postText?: string; // ← optional caption text
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
  const [imageHeight, setImageHeight] = useState<number>((screenWidth * 3) / 4); // default 4:3

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const flatListRef = useRef<FlatList<string>>(null);
  // Before rendering the profile image, normalize its URL:
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <BlurView
          intensity={90}
          tint={"dark"}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.modalBackground} />
        <View style={styles.header}>
          <View style={styles.user}>
            {fullProfileImageUri ? (
              <Image
                source={{ uri: fullProfileImageUri }}
                style={styles.profileImage}
              />
            ) : null}
            <Text style={styles.username}>{username}</Text>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color={"#fff"}></Ionicons>
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[
            styles.galleryWrapper,
            {
              opacity: opacity,
              transform: [{ scale: scale }],
            },
          ]}
        >
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, idx) => `${uri}_${idx}`}
            renderItem={({ item }) => (
              <View style={styles.fullImageWrapper}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item }}
                    style={styles.fullImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
            initialScrollIndex={initialIndex}
          />
        </Animated.View>

        <View style={styles.captionContainer}>
          <View style={styles.captionWrapper}>
            {postText ? (
              <Text style={styles.captionText}>{postText}</Text>
            ) : null}
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
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: "transparent",
      justifyContent: "space-between",
      alignItems: "center",
      position: "relative",
    },
    modalBackground: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: 0,
    },
    galleryWrapper: {
      flex: 1, // take remaining vertical space between header & caption
      width: screenWidth,
      backgroundColor: "transparent",
    },
    fullImageWrapper: {
      width: screenWidth,
      flex: 1, // make each slide fill available space
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    imageContainer: {
      flex: 1,
      width: "100%",
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: "#000",
      justifyContent: "center",
      alignItems: "center",
    },

    fullImage: {
      width: "100%",
      height: "100%",
      resizeMode: "contain", // contain ensures no stretching
    },
    captionContainer: {
      width: "100%",
      height: 140,
      paddingHorizontal: 24,
      borderTopColor: "#888",
      borderTopWidth: 1,
    },
    captionWrapper: {
      flex: 1,
      justifyContent: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      paddingHorizontal: 12,
      paddingTop: 40,
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
      fontSize: 16, // larger for better readability
      color: "#fff",
      textAlign: "left",
      fontFamily: Fonts.OSREGULAR,
      flexShrink: 1, // allow text to shrink to fit container
      marginBottom: 10,
    },
    closeButton: {
      padding: 10,
      borderRadius: 8,
      zIndex: 10,
    },
    engagementRow: {
      flexDirection: "row",
      justifyContent: "flex-start",
      gap: 16,
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
  });
}
