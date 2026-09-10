import { Ionicons } from "@expo/vector-icons";
import { Colors } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import * as ImageManipulator from "expo-image-manipulator";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cropEditorModalStyles } from "styles/ModalsStyles/CropEditorModalStyles";
import { PROFILE_BANNER_HEIGHT } from "styles/ProfileStyles/ProfileScreenStyles";

type CropMode = "profile" | "banner" | "post";

type CropEditorModalProps = {
  visible: boolean;
  imageUri: string;
  onCancel: () => void;
  onCrop: (uri: string) => void;
  mode: CropMode;
};

type Coordinate = { x: number; y: number };
type Size = { width: number; height: number };

type CropConfig = {
  cropWidth: number;
  cropHeight: number;
  outputWidth: number;
  outputHeight: number;
  isProfile: boolean;
};

type CropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

const PROFILE_VIEWPORT_SIZE = 300;
const PROFILE_OUTPUT_SIZE = 800;

const BANNER_VIEWPORT_WIDTH_RATIO = 0.9;
const BANNER_OUTPUT_WIDTH = 1500;

const POST_WIDTH = 1080;
const POST_HEIGHT = 1350;

const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Rotation is disabled until the crop mapper supports rotated viewports with
// the same precision as pan and pinch. Shipping inaccurate rotation would make
// the saved image diverge from the visible crop box.
const ROTATION_ENABLED = false;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getCropConfig = (mode: CropMode, windowWidth: number): CropConfig => {
  const safeWindowWidth = Math.max(1, windowWidth);

  if (mode === "profile") {
    const cropSize = Math.min(PROFILE_VIEWPORT_SIZE, safeWindowWidth * 0.82);

    return {
      cropWidth: cropSize,
      cropHeight: cropSize,
      outputWidth: PROFILE_OUTPUT_SIZE,
      outputHeight: PROFILE_OUTPUT_SIZE,
      isProfile: true,
    };
  }

  if (mode === "banner") {
    const bannerAspectRatio = safeWindowWidth / PROFILE_BANNER_HEIGHT;
    const cropWidth = safeWindowWidth * BANNER_VIEWPORT_WIDTH_RATIO;

    return {
      cropWidth,
      cropHeight: cropWidth / bannerAspectRatio,
      outputWidth: BANNER_OUTPUT_WIDTH,
      outputHeight: Math.round(BANNER_OUTPUT_WIDTH / bannerAspectRatio),
      isProfile: false,
    };
  }

  const cropWidth = Math.min(safeWindowWidth * 0.9, POST_WIDTH);

  return {
    cropWidth,
    cropHeight: (cropWidth * POST_HEIGHT) / POST_WIDTH,
    outputWidth: POST_WIDTH,
    outputHeight: POST_HEIGHT,
    isProfile: false,
  };
};

const getCoverSize = (
  imageSize: Size,
  cropWidth: number,
  cropHeight: number,
): Size => {
  const imageRatio = imageSize.width / imageSize.height;
  const cropRatio = cropWidth / cropHeight;

  if (imageRatio > cropRatio) {
    const height = cropHeight;
    return { width: height * imageRatio, height };
  }

  const width = cropWidth;
  return { width, height: width / imageRatio };
};

const getDistance = (touches: { pageX: number; pageY: number }[]) => {
  const [a, b] = touches;
  return Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY);
};

const calculateCropRect = (
  imageSize: Size,
  displayedImageSize: Size,
  cropSize: Size,
  offset: Coordinate,
  scale: number,
): CropRect => {
  const imagePixelsPerScreenX = imageSize.width / displayedImageSize.width;
  const imagePixelsPerScreenY = imageSize.height / displayedImageSize.height;

  const width = clamp(
    Math.round((cropSize.width / scale) * imagePixelsPerScreenX),
    1,
    imageSize.width,
  );
  const height = clamp(
    Math.round((cropSize.height / scale) * imagePixelsPerScreenY),
    1,
    imageSize.height,
  );

  // The preview is a clipped viewport. The image is rendered with cover sizing,
  // centered in that viewport, scaled around its center, then translated by
  // offset. This inverts that exact visual transform back into source pixels.
  const sourceX =
    (displayedImageSize.width / 2 - (cropSize.width / 2 + offset.x) / scale) *
    imagePixelsPerScreenX;
  const sourceY =
    (displayedImageSize.height / 2 - (cropSize.height / 2 + offset.y) / scale) *
    imagePixelsPerScreenY;

  return {
    originX: clamp(
      Math.round(sourceX),
      0,
      Math.max(0, imageSize.width - width),
    ),
    originY: clamp(
      Math.round(sourceY),
      0,
      Math.max(0, imageSize.height - height),
    ),
    width,
    height,
  };
};

export default function CropEditorModal({
  visible,
  imageUri,
  onCancel,
  onCrop,
  mode,
}: CropEditorModalProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const [imageSize, setImageSize] = useState<Size | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const currentScale = useRef(MIN_SCALE);
  const currentOffset = useRef<Coordinate>({ x: 0, y: 0 });
  const gestureStartOffset = useRef<Coordinate>({ x: 0, y: 0 });
  const gestureStartScale = useRef(MIN_SCALE);
  const initialDistance = useRef(0);

  const animatedOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const animatedScale = useRef(new Animated.Value(MIN_SCALE)).current;

  const cropConfig = useMemo(
    () => getCropConfig(mode, windowWidth),
    [mode, windowWidth],
  );

  const cropSize = useMemo(
    () => ({
      width: cropConfig.cropWidth,
      height: cropConfig.cropHeight,
    }),
    [cropConfig.cropHeight, cropConfig.cropWidth],
  );

  const displayedImageSize = useMemo(
    () =>
      imageSize
        ? getCoverSize(imageSize, cropConfig.cropWidth, cropConfig.cropHeight)
        : { width: 0, height: 0 },
    [cropConfig.cropHeight, cropConfig.cropWidth, imageSize],
  );

  const styles = cropEditorModalStyles(
    isDark,
    cropConfig.isProfile,
    cropConfig.cropWidth,
    cropConfig.cropHeight,
  );

  const isImageReady =
    !!imageSize &&
    displayedImageSize.width > 0 &&
    displayedImageSize.height > 0;
  const canSave = isImageReady && !isCropping;

  const clampOffset = useCallback(
    (offset: Coordinate, scale: number): Coordinate => {
      if (!displayedImageSize.width || !displayedImageSize.height) {
        return { x: 0, y: 0 };
      }

      const scaledWidth = displayedImageSize.width * scale;
      const scaledHeight = displayedImageSize.height * scale;
      const maxX = Math.max(0, (scaledWidth - cropConfig.cropWidth) / 2);
      const maxY = Math.max(0, (scaledHeight - cropConfig.cropHeight) / 2);

      return {
        x: clamp(offset.x, -maxX, maxX),
        y: clamp(offset.y, -maxY, maxY),
      };
    },
    [cropConfig.cropHeight, cropConfig.cropWidth, displayedImageSize],
  );

  useEffect(() => {
    setImageSize(null);
    setIsCropping(false);
    currentScale.current = MIN_SCALE;
    currentOffset.current = { x: 0, y: 0 };
    animatedScale.setValue(MIN_SCALE);
    animatedOffset.setValue({ x: 0, y: 0 });

    if (!visible || !imageUri) return;

    let cancelled = false;

    Image.getSize(
      imageUri,
      (width, height) => {
        if (!cancelled) setImageSize({ width, height });
      },
      () => {
        if (!cancelled) Alert.alert("Error", "Could not load image");
      },
    );

    return () => {
      cancelled = true;
    };
  }, [animatedOffset, animatedScale, imageUri, visible]);

  useEffect(() => {
    if (!isImageReady) return;

    const resetOffset = clampOffset({ x: 0, y: 0 }, MIN_SCALE);

    currentScale.current = MIN_SCALE;
    currentOffset.current = resetOffset;
    gestureStartScale.current = MIN_SCALE;
    gestureStartOffset.current = resetOffset;
    initialDistance.current = 0;
    animatedScale.setValue(MIN_SCALE);
    animatedOffset.setValue(resetOffset);
  }, [animatedOffset, animatedScale, clampOffset, isImageReady]);

  const finishGesture = useCallback(() => {
    gestureStartOffset.current = currentOffset.current;
    gestureStartScale.current = currentScale.current;
    initialDistance.current = 0;
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => isImageReady,
        onMoveShouldSetPanResponder: () => isImageReady,
        onPanResponderGrant: (evt) => {
          gestureStartOffset.current = currentOffset.current;
          gestureStartScale.current = currentScale.current;

          if (evt.nativeEvent.touches.length === 2) {
            initialDistance.current = getDistance(evt.nativeEvent.touches);
          }
        },
        onPanResponderMove: (evt, gesture) => {
          if (!isImageReady) return;

          const touches = evt.nativeEvent.touches;

          if (touches.length === 1) {
            const nextOffset = clampOffset(
              {
                x: gestureStartOffset.current.x + gesture.dx,
                y: gestureStartOffset.current.y + gesture.dy,
              },
              currentScale.current,
            );

            currentOffset.current = nextOffset;
            animatedOffset.setValue(nextOffset);
            return;
          }

          if (touches.length === 2) {
            const distance = getDistance(touches);
            if (distance <= 0) return;

            if (!initialDistance.current) {
              initialDistance.current = distance;
              gestureStartScale.current = currentScale.current;
            }

            const nextScale = clamp(
              gestureStartScale.current * (distance / initialDistance.current),
              MIN_SCALE,
              MAX_SCALE,
            );
            const nextOffset = clampOffset(currentOffset.current, nextScale);

            currentScale.current = nextScale;
            currentOffset.current = nextOffset;
            animatedScale.setValue(nextScale);
            animatedOffset.setValue(nextOffset);
          }
        },
        onPanResponderRelease: finishGesture,
        onPanResponderTerminate: finishGesture,
      }),
    [animatedOffset, animatedScale, clampOffset, finishGesture, isImageReady],
  );

  const handleCrop = useCallback(async () => {
    if (!canSave || !imageSize) return;

    const cropRect = calculateCropRect(
      imageSize,
      displayedImageSize,
      cropSize,
      currentOffset.current,
      currentScale.current,
    );

    setIsCropping(true);

    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { crop: cropRect },
          {
            resize: {
              width: cropConfig.outputWidth,
              height: cropConfig.outputHeight,
            },
          },
        ],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
        },
      );

      onCrop(result.uri);
    } catch {
      Alert.alert("Error", "Could not crop image");
    } finally {
      setIsCropping(false);
    }
  }, [
    canSave,
    cropConfig,
    cropSize,
    displayedImageSize,
    imageSize,
    imageUri,
    onCrop,
  ]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.container}>
        <View style={styles.wrapper}>
          <View style={styles.header}>
            <View style={{ width: 40, alignItems: "flex-start" }}>
              <Pressable disabled={isCropping} onPress={onCancel}>
                <Ionicons
                  name="close"
                  size={28}
                  color={isDark ? Colors.white : Colors.black}
                />
              </Pressable>
            </View>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.headerTitle}>Crop</Text>
            </View>

            <View
              style={{
                width: ROTATION_ENABLED ? 80 : 64,
                flexDirection: "row",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 12,
              }}
            >
              {ROTATION_ENABLED && (
                <Pressable disabled>
                  <Ionicons
                    name="refresh"
                    size={24}
                    color={isDark ? Colors.white : Colors.black}
                  />
                </Pressable>
              )}

              <TouchableOpacity disabled={!canSave} onPress={handleCrop}>
                <Text
                  style={[
                    styles.saveText,
                    !canSave && styles.buttonTextDisabled,
                  ]}
                >
                  {isCropping ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.cropContainer}>
            <View
              style={[
                styles.imageContainer,
                !isImageReady && styles.loadingContainer,
              ]}
              {...panResponder.panHandlers}
            >
              {isImageReady ? (
                <Animated.View
                  style={{
                    width: displayedImageSize.width,
                    height: displayedImageSize.height,
                    transform: [
                      { translateX: animatedOffset.x },
                      { translateY: animatedOffset.y },
                    ],
                  }}
                >
                  <Animated.Image
                    source={{ uri: imageUri }}
                    style={{
                      width: displayedImageSize.width,
                      height: displayedImageSize.height,
                      transform: [{ scale: animatedScale }],
                    }}
                    resizeMode="cover"
                  />
                </Animated.View>
              ) : (
                <ActivityIndicator
                  color={isDark ? Colors.white : Colors.black}
                />
              )}
              <View pointerEvents="none" style={styles.cropFrame} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
