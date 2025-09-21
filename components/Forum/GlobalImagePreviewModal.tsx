import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
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
import { useImagePreviewStore } from "../../store/imagePreviewStore";

const MAX_WIDTH_RATIO = 0.9;
const MAX_HEIGHT_RATIO = 0.8;
const TARGET_ASPECT_RATIO = 4 / 3;
const screenWidth = Dimensions.get("window").width;

export default function GlobalImagePreviewModal() {
  const { images, index, clearImages } = useImagePreviewStore();
  const isDark = useColorScheme() === "dark";

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const flatListRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    if (images.length > 0) {
      console.log("Opening preview for:", images, "at index", index);

      setModalVisible(true);
      setInitialIndex(index);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.back(1)), // adds a slight bounce/pop
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index, animated: false });
      }, 50);
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
      ]).start(() => {
        setModalVisible(false);
        setContainerSize({ width: 0, height: 0 });
      });
    }
  }, [images, index, opacity, scale]);

  const onScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    flatListRef.current?.scrollToOffset({
      offset: info.averageItemLength * info.index,
      animated: false,
    });
  };

  useEffect(() => {
    const screen = Dimensions.get("window");
    let width = screen.width * MAX_WIDTH_RATIO;
    let height = width / TARGET_ASPECT_RATIO;

    if (height > screen.height * MAX_HEIGHT_RATIO) {
      height = screen.height * MAX_HEIGHT_RATIO;
      width = height * TARGET_ASPECT_RATIO;
    }

    setContainerSize({ width, height });
  }, []);

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="none">
      <SafeAreaView style={styles.modalContainer}>
        {/* Blur behind content */}
        <BlurView
          intensity={80}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />

        {/* Semi-transparent overlay */}
        <View style={styles.modalBackground} />

        {/* Animated wrapper for scaling and opacity */}
        <Animated.View
          style={[
            styles.galleryWrapper,
            {
              width: containerSize.width,
              height: containerSize.height,
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
            onScrollToIndexFailed={onScrollToIndexFailed}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, idx) => `${uri}_${idx}`}
            renderItem={({ item }) => (
              <View style={styles.fullImageWrapper}>
                <Image
                  source={{ uri: item }}
                  style={[styles.fullImage, containerSize]}
                  resizeMode="contain"
                />
                {/* If you have captions for images, replace here */}
                {/* <Text style={styles.captionText}>{caption}</Text> */}
              </View>
            )}
            getItemLayout={(_, index) => ({
              length: screenWidth,
              offset: screenWidth * index,
              index,
            })}
          />
        </Animated.View>

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={clearImages}
          activeOpacity={0.8}
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  fullImageWrapper: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  fullImage: {
    borderRadius: 16,
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
  },
  captionText: {
    marginTop: 12,
    fontSize: 16,
    color: "white",
    textAlign: "center",
  },
});
