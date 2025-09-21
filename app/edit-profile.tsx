import Button from "components/Button"; // adjust path if needed
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import LabeledInput from "components/LabeledInput";
import ProfileBanner from "components/Profile/ProfileBanner";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

const BANNER_HEIGHT = 120;
const PROFILE_PIC_SIZE = 120;
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function EditProfileScreen() {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const navigation = useNavigation();
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isCroppingBanner, setIsCroppingBanner] = useState(true);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const storedUsername = await AsyncStorage.getItem("username");
      const storedFullName = await AsyncStorage.getItem("fullName");
      const storedEmail = await AsyncStorage.getItem("email");
      const storedBio = await AsyncStorage.getItem("bio");
      const storedProfileImage = await AsyncStorage.getItem("profileImage");
      const storedBannerImage = await AsyncStorage.getItem("bannerImage");
      if (storedUsername) setUsername(storedUsername);
      if (storedFullName) setFullName(storedFullName);
      if (storedEmail) setEmail(storedEmail);
      if (storedBio) setBio(storedBio);
      if (storedProfileImage) setProfileImage(storedProfileImage);
      if (storedBannerImage) setBannerImage(storedBannerImage);
    };
    loadData();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeaderTitle title="Edit Profile" onBack={goBack} />,
    });
  }, [navigation, isDark]);

  const pickImage = async (setImage: (uri: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "We need permission to access your gallery."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
    }
  };

  const handlePickImage = async (isBanner: boolean) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission denied",
        "We need permission to access your gallery."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setPendingImage(result.assets[0].uri);
      setIsCroppingBanner(isBanner);
      setIsCropOpen(true);
    }
  };

  const handleCropComplete = (uri: string) => {
    if (isCroppingBanner) {
      setBannerImage(uri);
    } else {
      setProfileImage(uri);
    }
    setIsCropOpen(false);
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();

      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("bio", bio || "");

      // Only append new local banner image
      if (bannerImage?.startsWith("file://")) {
        const filename = bannerImage.split("/").pop()!;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("bannerImage", {
          uri: bannerImage,
          name: filename,
          type,
        } as any);
      }

      // Only append new local profile image
      if (profileImage?.startsWith("file://")) {
        const filename = profileImage.split("/").pop()!;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";

        formData.append("profileImage", {
          uri: profileImage,
          name: filename,
          type,
        } as any);
      }

      const res = await fetch(`${BASE_URL}/api/users/${username}`, {
        method: "PATCH",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await res.json();

      // ✅ Save correct relative paths in AsyncStorage
      await AsyncStorage.setItem("fullName", data.user.full_name);
      await AsyncStorage.setItem("email", data.user.email);
      await AsyncStorage.setItem("bio", data.user.bio || "");

      if (data.user.profile_image) {
        await AsyncStorage.setItem("profileImage", data.user.profile_image); // /uploads/xyz.jpg
      }

      if (data.user.banner_image) {
        await AsyncStorage.setItem("bannerImage", data.user.banner_image); // /uploads/abc.jpg
      }

      Alert.alert("Saved", "Profile updated.");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save profile info.");
    }
  };

  const styles = getStyles(isDark);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
          backgroundColor: isDark ? "#1d1d1d" : "#fff",
        }}
      >
        <View style={[styles.container]}>
          <ProfileBanner
            bannerImage={bannerImage}
            profileImage={profileImage}
            isDark={isDark}
            editable
            onPressBanner={() => handlePickImage(true)}
            onPressProfile={() => handlePickImage(false)}
          />

          <View style={styles.formContainer}>
            <LabeledInput
              label="Name"
              value={fullName}
              onChangeText={setFullName}
            />

            <LabeledInput
              label="Username"
              value={username}
              onChangeText={setUsername}
            />

            <LabeledInput label="Email" value={email} onChangeText={setEmail} />

            <LabeledInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              multiline
            />

            <Button onPress={handleSave} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    banner: {
      height: BANNER_HEIGHT,
      width: "100%",
      borderRadius: 0,
      marginBottom: 12,
      resizeMode: "cover",
      justifyContent: "center",
      alignItems: "center",
    },
    formContainer: {
      paddingTop: 60,
      paddingHorizontal: 16,
    },
    profilePicTouchOverlay: {
      position: "absolute",
      top: BANNER_HEIGHT - PROFILE_PIC_SIZE / 2,
      alignSelf: "center",
      width: PROFILE_PIC_SIZE,
      height: PROFILE_PIC_SIZE,
      borderRadius: PROFILE_PIC_SIZE / 2,
      zIndex: 20,
    },
  });
