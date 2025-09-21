import { useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import PostImagesModal from "./PostImagesModal"; // adjust path as needed
import { Fonts } from "constants/fonts";

const screenWidth = Dimensions.get("window").width;
const PARENT_PADDING = 12;
const IMAGE_MARGIN = 6;
const NUM_COLUMNS = 2;

const IMAGE_SIZE =
  (screenWidth - PARENT_PADDING * 2 - IMAGE_MARGIN * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

type Props = {
  postImages: string[];
  item: {
    text?: string;
    likes: number;
    comments_count?: number;
    username?: string;
    profile_image: string | null;
  };

  onImagePress?: (imgSrc: string, text?: string) => void;
};

export default function PostImages({ postImages, item, onImagePress }: Props) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  const [modalVisible, setModalVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const limitedImages = postImages.slice(0, 4);
  const remainingCount = postImages.length - 4;

  const imageStyle =
    postImages.length === 1
      ? styles.singlePostImage
      : postImages.length >= 4
      ? styles.gridImage
      : styles.postImage;

  const containerStyle =
    postImages.length === 1
      ? styles.singleImageWrapper
      : postImages.length >= 4
      ? styles.gridWrapper
      : styles.imageGrid;

  const openModal = (index: number) => {
    setInitialIndex(index);
    setModalVisible(true);
  };

  return (
    <View>
      <View style={containerStyle}>
        {limitedImages.map((imgSrc, idx) => {
          const isLastVisible = idx === 3 && remainingCount > 0;
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
onPress={() => {
  const actualIndex = postImages.findIndex((img) => img === imgSrc);
  openModal(actualIndex);
}}
              style={{
                marginLeft: idx % NUM_COLUMNS === 0 ? 0 : IMAGE_MARGIN,
                marginBottom: IMAGE_MARGIN,
              }}
            >
              <Image
                source={{ uri: imgSrc }}
                style={imageStyle}
                resizeMode="cover"
              />
              {isLastVisible && (
                <View style={styles.overlay}>
                  <Text style={styles.overlayText}>+{remainingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <PostImagesModal
        visible={modalVisible}
        images={postImages}
        initialIndex={initialIndex}
        onClose={() => setModalVisible(false)}
        postText={item.text}
        likesCount={item?.likes} // adjust this to your actual data model
        commentsCount={item.comments_count} // ✅ fix here
        profileImage={item.profile_image}
        username={item.username}
      />
    </View>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    singleImageWrapper: {
      width: "100%",
      marginTop: 6,
      borderRadius: 8,
      overflow: "hidden",
    },
    singlePostImage: {
      width: "100%",
      height: 250,
      borderRadius: 8,
    },
    imageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 6,
    },
    postImage: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: 8,
    },
    gridWrapper: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 6,
    },
    gridImage: {
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      borderRadius: 8,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: IMAGE_SIZE,
      height: IMAGE_SIZE,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 8,
    },
    overlayText: {
      color: "#fff",
      fontSize: 24,
      fontFamily: Fonts.OSBOLD,
    },
  });
}
