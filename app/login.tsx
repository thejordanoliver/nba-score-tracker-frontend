// login.tsx
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { getSignupStepsStyles } from "styles/signupStepStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  GestureResponderEvent,
  KeyboardAvoidingView,
  PanResponder,
  PanResponderGestureState,
  Platform,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import CropEditorModal from "../components/CropEditorModal";
import SignInForm from "../components/SignInForm";
import SignupSteps from "../components/SignUpSteps";
import TabBar from "../components/TabBar";
import { User } from "../types/types";

export default function LoginScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const tabs = ["sign in", "sign up"] as const;
  const [selectedTab, setSelectedTab] =
    useState<(typeof tabs)[number]>("sign in");
  const isDark = useColorScheme() === "dark";

  const [isCropModalVisible, setCropModalVisible] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<"profile" | "banner" | null>(
    null
  );
  const [isGridView, setIsGridView] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const toggleLayout = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsGridView((prev) => !prev);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const openImagePickerFor = async (target: "profile" | "banner") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled) {
      setImageToCrop(result.assets[0].uri);
      setCropTarget(target);
      setCropModalVisible(true);
    }
  };

  const onImageCropped = (croppedUri: string) => {
    if (cropTarget === "profile") {
      setSignupData((prev) => ({ ...prev, profileImage: croppedUri }));
    } else if (cropTarget === "banner") {
      setSignupData((prev) => ({ ...prev, bannerImage: croppedUri }));
    }
    setCropModalVisible(false);
    setImageToCrop(null);
    setCropTarget(null);
  };

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

  const safeSetItem = async (key: string, value: string | null | undefined) => {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  };

  const handleLogin = async () => {
    const trimmedUsername = username?.trim().toLowerCase();
    if (!trimmedUsername || password.length < 4) {
      Alert.alert(
        "Invalid credentials",
        "Please enter a valid username and password (min 8 chars)."
      );
      return;
    }
    try {
      const res = await axios.post<{ user: User; token: string }>(
        `${BASE_URL}/api/login`,
        {
          username: trimmedUsername,
          password,
        }
      );
      const { user, token } = res.data;

      await safeSetItem("token", token);
      await safeSetItem("userId", user.id?.toString() || null);
      await safeSetItem("username", user.username);
      await safeSetItem("fullName", user.full_name);
      await safeSetItem("email", user.email);
      await safeSetItem(
        "profileImage",
        user.profile_image ? `${BASE_URL}${user.profile_image}` : null
      );
      await safeSetItem(
        "bannerImage",
        user.banner_image ? `${BASE_URL}${user.banner_image}` : null
      );
      await safeSetItem("favorites", JSON.stringify(user.favorites || []));
      await safeSetItem("bio", user.bio ?? "");

      // **Save the whole user object here as well:**
      await AsyncStorage.setItem("loggedInUser", JSON.stringify(user));

      router.replace({
        pathname: "/(tabs)/profile",
        params: { id: user.id },
      });
    } catch (err: any) {
      Alert.alert("Login failed", err.response?.data?.error || err.message);
    }
  };

  const [signupStep, setSignupStep] = useState(0);
  const [signupData, setSignupData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    favorites: [] as string[],
    profileImage: null as string | null,
    bannerImage: null as string | null,
  });

  const styles = getSignupStepsStyles(isDark);

  useLayoutEffect(() => {
    const showBackButton = !(
      selectedTab === "sign in" ||
      (selectedTab === "sign up" && signupStep === 0)
    );
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          title="The Logo"
          tabName="Login"
          onBack={() => {
            if (selectedTab === "sign up" && signupStep > 0) {
              setSignupStep((s) => Math.max(0, s - 1));
            } else {
              goBack();
            }
          }}
          isGrid={isGridView}
          onToggleLayout={signupStep === 1 ? toggleLayout : undefined}
          showBackButton={showBackButton}
        />
      ),
    });
  }, [navigation, isDark, selectedTab, signupStep, isGridView]);

  const handleSignupSubmit = async (): Promise<{
    user: User;
    token: string;
  } | null> => {
    const {
      fullName,
      username,
      email,
      password,
      confirmPassword,
      favorites,
      profileImage,
      bannerImage,
    } = signupData;

    if (!fullName || !username || !email || password !== confirmPassword) {
      Alert.alert(
        "Please check your details",
        "Make sure all fields are filled and passwords match."
      );
      return null;
    }

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("username", username.trim().toLowerCase());
      formData.append("email", email);
      formData.append("password", password);
      formData.append("favorites", JSON.stringify(favorites));

      const appendImage = (uri: string | null, name: string) => {
        if (!uri) return;
        const filename = uri.split("/").pop()!;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match?.[1];
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";
        formData.append(name, { uri, name: filename, type: mimeType } as any);
      };

      appendImage(profileImage, "profileImage");
      appendImage(bannerImage, "bannerImage");

      const res = await axios.post<{ user: User; token: string }>(
        `${BASE_URL}/api/signup`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      return res.data;
    } catch (err: any) {
      console.error("Signup error:", err);
      Alert.alert("Signup failed", err.response?.data?.error || err.message);
      return null;
    }
  };

  const handleSignup = async () => {
    const result = await handleSignupSubmit();
    if (!result) return;

    const { user, token } = result;

    try {
      await safeSetItem("token", token);
      await safeSetItem("userId", user.id?.toString() || null);
      await safeSetItem("username", user.username);
      await safeSetItem("fullName", user.full_name);
      await safeSetItem("email", user.email);
      await safeSetItem(
        "profileImage",
        user.profile_image ? `${BASE_URL}${user.profile_image}` : null
      );
      await safeSetItem(
        "bannerImage",
        user.banner_image ? `${BASE_URL}${user.banner_image}` : null
      );
      await safeSetItem("favorites", JSON.stringify(user.favorites || []));
      await safeSetItem("bio", user.bio ?? "");

      // **Save the whole user object here:**
      await AsyncStorage.setItem("loggedInUser", JSON.stringify(user));

      router.replace("/signup/success");
    } catch (err: any) {
      console.error("Auto-login after signup failed:", err);
      Alert.alert("Login failed", err.response?.data?.error || err.message);
    }
  };

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: signupStep / 3,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [signupStep]);

  const progressInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => animateTransition(), [signupStep]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (
          _evt: GestureResponderEvent,
          gesture: PanResponderGestureState
        ) => gesture.dx > 20 && Math.abs(gesture.dy) < 20,
        onPanResponderRelease: (
          _evt: GestureResponderEvent,
          gesture: PanResponderGestureState
        ) => {
          if (gesture.dx > 50 && signupStep > 0) {
            setSignupStep((s) => Math.max(0, s - 1));
          }
        },
      }),
    [signupStep]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {!(selectedTab === "sign up" && signupStep > 0) && (
          <View style={styles.tabBarWrapper}>
            <TabBar
              tabs={tabs}
              selected={selectedTab}
              onTabPress={(tab) => {
                setSelectedTab(tab);
                setSignupStep(0);
              }}
              renderLabel={(tab, isSelected) => (
                <Text
                  style={{
                    fontSize: 20, // your bigger font size here
                    color: isSelected
                      ? isDark
                        ? "#fff"
                        : "#1d1d1d"
                      : isDark
                      ? "#888"
                      : "rgba(0, 0, 0, 0.5)",
                    fontFamily: "Oswald_400Regular",
                    textTransform: "uppercase",
                  }}
                >
                  {tab}
                </Text>
              )}
            />
          </View>
        )}

        {selectedTab === "sign in" ? (
          <SignInForm
            username={username}
            password={password}
            showPassword={showPassword}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onToggleShowPassword={() => setShowPassword((p) => !p)}
            onSubmit={handleLogin}
          />
        ) : (
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            {signupStep === 0 && (
              <Text style={styles.title}>Create Account</Text>
            )}
            <SignupSteps
              signupData={signupData}
              signupStep={signupStep}
              onChangeSignupData={(updates) =>
                setSignupData((prev) => ({ ...prev, ...updates }))
              }
              onNextStep={() => setSignupStep((s) => Math.min(s + 1, 3))}
              onPreviousStep={() => setSignupStep((s) => Math.max(s - 1, 0))}
              onToggleFavorite={(id) =>
                setSignupData((prev) => ({
                  ...prev,
                  favorites: prev.favorites.includes(id)
                    ? prev.favorites.filter((f) => f !== id)
                    : [...prev.favorites, id],
                }))
              }
              onOpenImagePickerFor={openImagePickerFor}
              isGridView={isGridView}
              toggleLayout={toggleLayout}
              fadeAnim={fadeAnim}
            />
          </Animated.View>
        )}

        {selectedTab === "sign up" && (
          <>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[styles.progressBarFill, { width: progressInterpolate }]}
              />
            </View>
            <Pressable
              onPress={() =>
                signupStep === 3 ? handleSignup() : setSignupStep((s) => s + 1)
              }
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {signupStep === 3 ? "Sign Up" : "Next"}
              </Text>
            </Pressable>
          </>
        )}

        {imageToCrop && cropTarget && (
          <CropEditorModal
            visible={isCropModalVisible}
            imageUri={imageToCrop}
            onCancel={() => setCropModalVisible(false)}
            onCrop={onImageCropped}
            mode={cropTarget}
            aspectRatio={cropTarget === "profile" ? 1 : 3}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
