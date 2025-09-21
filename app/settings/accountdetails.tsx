import Button from "components/Button";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import HeadingTwo from "components/Headings/HeadingTwo";
import { Fonts } from "constants/fonts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { goBack } from "expo-router/build/global-state/routing";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function parseImageUrl(url: string | null | undefined): string | null {
  if (!url || url === "null") return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function AccountDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const styles = getStyles(isDark);

  // password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchUserData = useCallback(async (userId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/users/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user data");
      const data = await res.json();
      setUserData({
        ...data,
        profile_image: parseImageUrl(data.profile_image),
        banner_image: parseImageUrl(data.banner_image),
      });
    } catch (err) {
      console.error("Fetch account details error:", err);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle title="Account Details" onBack={goBack} />
      ),
    });
  }, [navigation, isDark]);

  useEffect(() => {
    (async () => {
      try {
        const storedId = await AsyncStorage.getItem("userId");
        if (storedId) {
          const idNum = Number(storedId);
          setCurrentUserId(idNum);
          await fetchUserData(idNum);
        }
      } catch {
        setCurrentUserId(null);
      }
    })();
  }, [fetchUserData]);

  const handleChangePassword = async () => {
    if (!userData?.username) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      Alert.alert(
        "Error",
        "New password cannot be the same as current password."
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters long.");
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch(
        `${BASE_URL}/api/users/${userData.username}/password`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      Alert.alert("Success", "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#000" : "#fff",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
      </View>
    );
  }

  if (!currentUserId || !userData) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#000" : "#fff",
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: isDark ? "#fff" : "#000" }}>
          Unable to load account details.
        </Text>
      </View>
    );
  }

  const formattedDate = new Date(userData.created_at).toLocaleDateString(
    "en-US",
    {
      dateStyle: "long",
    }
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0} // adjust if header overlaps
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 120,
        }}
      >
        <View style={{ marginTop: 5 }}>
          <HeadingTwo>Full Name</HeadingTwo>
          <Text
            style={{
              color: isDark ? "#aaa" : "#555",
              fontSize: 16,
              fontFamily: Fonts.OSREGULAR,
            }}
          >
            {userData.fullName}
          </Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <HeadingTwo>Username</HeadingTwo>
          <Text
            style={{
              color: isDark ? "#aaa" : "#555",
              fontSize: 16,
              fontFamily: Fonts.OSREGULAR,
            }}
          >
            {userData.username}
          </Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <HeadingTwo>Email</HeadingTwo>
          <Text
            style={{
              color: isDark ? "#aaa" : "#555",
              fontSize: 16,
              fontFamily: Fonts.OSREGULAR,
            }}
          >
            {userData.email}
          </Text>
        </View>

        {/* Password Section */}
        <View style={{ marginTop: 30 }}>
          <HeadingTwo>Password</HeadingTwo>
          <Text
            style={{
              color: isDark ? "#aaa" : "#555",
              fontSize: 16,
              fontFamily: Fonts.OSREGULAR,
              marginBottom: 10,
            }}
          >
            ••••••••
          </Text>

          {/* Change Password Inputs */}
          <TextInput
            placeholder="Current Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#000",
                borderColor: isDark ? "#444" : "#ccc",
              },
            ]}
          />
          <TextInput
            placeholder="New Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#000",
                borderColor: isDark ? "#444" : "#ccc",
              },
            ]}
          />
          <TextInput
            placeholder="Confirm New Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#000",
                borderColor: isDark ? "#444" : "#ccc",
              },
            ]}
          />

          <Button
            onPress={handleChangePassword}
            disabled={isChangingPassword}
            loading={isChangingPassword}
            title="Change Password"
          />
        </View>

        <Text
          style={{
            color: isDark ? "#888" : "#444",
            fontSize: 16,
            marginTop: 12,
            fontFamily: Fonts.OSREGULAR,
            textAlign: "center",
          }}
        >
          Member Since: {formattedDate}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    input: {
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#222" : "#eee",
      padding: 20,
      borderRadius: 8,
      fontSize: 16,
      marginVertical: 12,
      fontFamily: Fonts.OSLIGHT,
    },
    button: {
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
    },
  });
