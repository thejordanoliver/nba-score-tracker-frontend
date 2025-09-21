import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  Pressable,
  View,
} from "react-native";

type CropEditorModalProps = {
  visible: boolean;
  imageUri: string;
  onCancel: () => void;
  onCrop: (uri: string) => void;
  aspectRatio: number;
  mode: "profile" | "banner" | "post"; // 👈 Added "post"
};

const BANNER_HEIGHT = 100; // Increased banner height
const PROFILE_PIC_SIZE = 300; // Increased profile circle size

export default function CropEditorModal({
  visible,
  imageUri,
  onCancel,
  onCrop,
  aspectRatio,
  mode,
}: CropEditorModalProps) {
  const windowWidth = Dimensions.get("window").width;

const isProfile = mode === "profile";
const isBanner = mode === "banner";
const isPost = mode === "post";

let cropWidth = windowWidth * 0.9;
let cropHeight = cropWidth / aspectRatio;

if (isProfile) {
  cropWidth = PROFILE_PIC_SIZE;
  cropHeight = PROFILE_PIC_SIZE;
} else if (isBanner) {
  cropWidth = windowWidth * 0.9;
  cropHeight = BANNER_HEIGHT;
} else if (isPost) {
  cropWidth = windowWidth * 0.9;
  cropHeight = cropWidth * (3 / 4); // 4:3 aspect ratio
}

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  const lastOffset = useRef(offset);

  // Store the displayed image size inside the crop box, after resizing with "contain"
  const [displayedImageSize, setDisplayedImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Get real image size from URI
  useEffect(() => {
    if (!imageUri) return;
    Image.getSize(
      imageUri,
      (width, height) => setImageSize({ width, height }),
      () => {
        Alert.alert("Error", "Could not get image size");
        setImageSize(null);
      }
    );
  }, [imageUri]);

  // Calculate displayed image size inside crop box (resizeMode: contain)
  useEffect(() => {
    if (!imageSize) return;

    // Calculate scaled size of image to fit inside crop box with contain mode
    const imageRatio = imageSize.width / imageSize.height;
    const cropRatio = cropWidth / cropHeight;

    let displayedWidth = 0;
    let displayedHeight = 0;

    if (imageRatio > cropRatio) {
      // Image wider than crop box
      displayedWidth = cropWidth;
      displayedHeight = cropWidth / imageRatio;
    } else {
      // Image taller than crop box
      displayedHeight = cropHeight;
      displayedWidth = cropHeight * imageRatio;
    }

    setDisplayedImageSize({ width: displayedWidth, height: displayedHeight });

    // Reset offset and scale on new image/aspect ratio
    setOffset({ x: 0, y: 0 });
    setScale(1);
    setRotation(0);
  }, [imageSize, cropWidth, cropHeight]);

  // Clamp offset so user cannot drag image out of crop box
  const clampOffset = (x: number, y: number) => {
    if (!displayedImageSize.width || !displayedImageSize.height)
      return { x, y };

    const scaledWidth = displayedImageSize.width * scale;
    const scaledHeight = displayedImageSize.height * scale;

    const maxX = (scaledWidth - cropWidth) / 2;
    const maxY = (scaledHeight - cropHeight) / 2;

    // Clamp between -max and max
    const clampedX = Math.min(maxX, Math.max(-maxX, x));
    const clampedY = Math.min(maxY, Math.max(-maxY, y));

    return { x: clampedX, y: clampedY };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastOffset.current = offset;
      },
      onPanResponderMove: (_evt, gestureState) => {
        const newOffset = {
          x: lastOffset.current.x + gestureState.dx,
          y: lastOffset.current.y + gestureState.dy,
        };
        setOffset(clampOffset(newOffset.x, newOffset.y));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const handleRotate = () => {
    // Reset offset after rotation to avoid issues
    setRotation((r) => (r + 90) % 360);
    setOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale((s) => {
      const newScale = Math.min(4, s + 0.2);
      return newScale;
    });
  };

  const handleZoomOut = () => {
    setScale((s) => {
      const newScale = Math.max(0.8, s - 0.2);
      // Also clamp offset to new scale bounds
      const clamped = clampOffset(offset.x, offset.y);
      setOffset(clamped);
      return newScale;
    });
  };

  const handleCrop = async () => {
    if (!imageSize) {
      Alert.alert("Error", "Image size not loaded yet.");
      return;
    }

    try {
      // Image real dimensions (rotated)
      let rotatedWidth = imageSize.width;
      let rotatedHeight = imageSize.height;
      const normalizedRotation = rotation % 360;
      if (normalizedRotation === 90 || normalizedRotation === 270) {
        rotatedWidth = imageSize.height;
        rotatedHeight = imageSize.width;
      }

      // Calculate the scale from displayed image size to real image size
      const scaleX = rotatedWidth / (displayedImageSize.width * scale);
      const scaleY = rotatedHeight / (displayedImageSize.height * scale);

      // Calculate top-left corner of crop box relative to displayed image center
      // offset.x/y are relative to crop box center -> flip sign to get image offset inside crop box
      // Because image is centered, to get crop box origin relative to image, add half crop box size
      const cropOriginX =
        (displayedImageSize.width * scale) / 2 - cropWidth / 2 - offset.x;
      const cropOriginY =
        (displayedImageSize.height * scale) / 2 - cropHeight / 2 - offset.y;

      // Map crop origin from displayed image to original image
      const originX = cropOriginX * scaleX;
      const originY = cropOriginY * scaleY;

      const cropWidthScaled = cropWidth * scaleX;
      const cropHeightScaled = cropHeight * scaleY;

      // Clamp crop origins to image bounds
      const cropXClamped = Math.min(
        Math.max(0, originX),
        rotatedWidth - cropWidthScaled
      );
      const cropYClamped = Math.min(
        Math.max(0, originY),
        rotatedHeight - cropHeightScaled
      );

      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { rotate: rotation },
          {
            crop: {
              originX: cropXClamped,
              originY: cropYClamped,
              width: cropWidthScaled,
              height: cropHeightScaled,
            },
          },
        ],
        { compress: 1, format: ImageManipulator.SaveFormat.PNG }
      );

      onCrop(manipResult.uri);
    } catch (err) {
      Alert.alert("Error cropping image", (err as Error).message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
    <View
  style={{
    width: cropWidth,
    height: cropHeight,
    borderColor: "#fff",
    borderWidth: 2,
    borderRadius: isProfile ? cropHeight / 2 : 8, // 👈 circle for profile
    overflow: "hidden",
    backgroundColor: "#111",
  }}
>

          <View
            {...panResponder.panHandlers}
            style={{
              width: displayedImageSize.width,
              height: displayedImageSize.height,
              transform: [
                { translateX: offset.x },
                { translateY: offset.y },
                { scale },
                { rotate: `${rotation}deg` },
              ],
            }}
          >
            <Image
              source={{ uri: imageUri }}
              style={{
                width: displayedImageSize.width,
                height: displayedImageSize.height,
                resizeMode: "cover",
              }}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", marginTop: 20 }}>
          <Pressable onPress={handleZoomOut} style={{ marginHorizontal: 20 }}>
            <Ionicons name="remove-circle-outline" size={36} color="#fff" />
          </Pressable>
          <Pressable onPress={handleRotate} style={{ marginHorizontal: 20 }}>
            <Ionicons name="reload-circle-outline" size={36} color="#fff" />
          </Pressable>
          <Pressable onPress={handleZoomIn} style={{ marginHorizontal: 20 }}>
            <Ionicons name="add-circle-outline" size={36} color="#fff" />
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            marginTop: 40,
            justifyContent: "space-around",
            width: "100%",
            paddingHorizontal: 40,
          }}
        >
          <Pressable
            onPress={onCancel}
            style={{ backgroundColor: "#444", padding: 12, borderRadius: 8 }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <Pressable
            onPress={handleCrop}
            style={{ backgroundColor: "#007AFF", padding: 12, borderRadius: 8 }}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
