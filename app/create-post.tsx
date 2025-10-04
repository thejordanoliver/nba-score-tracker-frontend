import CropEditorModal from "components/CropEditorModal";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { Fonts } from "constants/fonts";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import PostButton from "../components/Forum/PostButton";
import { getAccessToken } from "utils/authStorage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

type MediaItem = {
  uri: string;
  type: "image" | "video";
};

export default function CreatePost() {
  const [newPostText, setNewPostText] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);

  const router = useRouter();
  const navigation = useNavigation();
const { teamId, league } = useLocalSearchParams<{ teamId?: string; league?: "NBA" | "NFL" }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = getStyles(isDark);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle title="Create Post" onBack={() => router.back()} />
      ),
    });
  }, [navigation]);

useEffect(() => {
  AsyncStorage.getItem("accessToken")
    .then((t) => {
      setToken(t);
      console.log("Loaded accessToken:", t);
      if (!t) {
        Alert.alert("Not Logged In", "You must be logged in to create a post.");
      }
    })
}, []);


  const pickMedia = async () => {
    if (media.length >= 8) {
      Alert.alert("Limit reached", "You can only upload up to 8 items.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      selectionLimit: 8 - media.length,
      quality: 0.8,
    });

    if (!result.canceled) {
     const selected: MediaItem[] = result.assets.map((asset) => ({
  uri: asset.uri,
  type: asset.type === "video" ? "video" : "image",
}));

      setMedia((prev) => [...prev, ...selected]);
    }
  };

  

  const onMediaPress = (item: MediaItem, index: number) => {
    if (item.type === "image") {
      setImageToCrop(item.uri);
      setCroppingIndex(index);
      setCropModalVisible(true);
    } else {
      Alert.alert("Video Selected", "Trimming coming soon.");
    }
  };

  const onCropComplete = (croppedUri: string) => {
    if (croppingIndex !== null) {
      const updated = [...media];
      updated[croppingIndex] = { uri: croppedUri, type: "image" };
      setMedia(updated);
    }
    setCropModalVisible(false);
    setImageToCrop(null);
    setCroppingIndex(null);
  };

const createPost = async () => {
  if (!token) {
    Alert.alert("Error", "You must be logged in to post.");
    return;
  }

  setLoading(true);
  const formData = new FormData();
  formData.append("text", newPostText);

  media.forEach((item) => {
    const filename = item.uri.split("/").pop()!;
    const ext = /\.(\w+)$/.exec(filename)?.[1];
    const type = item.type === "video" ? `video/${ext}` : `image/${ext}`;

    formData.append("media", {
      uri: item.uri,
      name: filename,
      type,
    } as any);
  });

  // Include league if this is a league post
  if (league && !teamId) {
    formData.append("league", league);
  }

  try {
   const endpoint = teamId
  ? `${BASE_URL}/api/forum/team/${teamId}`
  : `${BASE_URL}/api/forum/league/${league}`; // league post

    await axios.post(endpoint, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    Alert.alert("Success", "Post created!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  } catch (err: any) {
    Alert.alert(
      "Failed to create post",
      err.response?.data?.error || err.message || "Please try again later."
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.label}>Write your post:</Text>
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Ionicons
            name="close-outline"
            size={28}
            color={isDark ? "#fff" : "#1d1d1d"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.textContainer}>
        <TextInput
          style={styles.textInput}
          multiline
          placeholder="What's on your mind?"
          value={newPostText}
          onChangeText={setNewPostText}
          editable={!loading}
        />

        <TouchableOpacity
          onPress={pickMedia}
          disabled={loading}
          style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons name="add" size={28} color={isDark ? "#fff" : "#1d1d1d"} />
          <Text
            style={{
              color: isDark ? "#fff" : "#1d1d1d",
              fontSize: 16,
              marginLeft: 4,
            }}
          >
            Add Media ({media.length}/8)
          </Text>
        </TouchableOpacity>

        <FlatList
          horizontal
          data={media}
          keyExtractor={(item, index) => item.uri + index}
          contentContainerStyle={{ marginTop: 10, paddingHorizontal: 4 }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => onMediaPress(item, index)}
              style={{ position: "relative", marginRight: 10 }}
            >
              {item.type === "image" ? (
                <Image
                  source={{ uri: item.uri }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 8,
                    backgroundColor: "#000",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons name="videocam" size={28} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />

        <PostButton
          onPress={createPost}
          disabled={loading}
          title={loading ? "Posting..." : "Post"}
        />
      </View>

      {imageToCrop && (
        <CropEditorModal
          visible={cropModalVisible}
          imageUri={imageToCrop}
          aspectRatio={4 / 3}
          mode="post"
          onCancel={() => setCropModalVisible(false)}
          onCrop={onCropComplete}
        />
      )}
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
    },
    label: {
      fontSize: 18,
      fontFamily: Fonts.OSREGULAR,
      marginBottom: 12,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    textContainer: {
      height: "auto",
    },
    textInput: {
      minHeight: 200,
      borderColor: isDark ? "#555" : "#ccc",
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      fontFamily: Fonts.OSREGULAR,
      textAlignVertical: "top",
      color: isDark ? "#fff" : "#1d1d1d",
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });
