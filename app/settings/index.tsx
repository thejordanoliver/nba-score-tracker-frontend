import ConfirmModal from "components/ConfirmModal";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { Fonts } from "constants/fonts";
import { useAuth } from "hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useLayoutEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type SettingsScreenProps = {
  onRequestLogout: () => void; // triggers showing sign-out modal in parent
  onRequestDeleteAccount: () => void; // triggers showing delete modal in parent
};
export default function SettingsScreen() {
  const { deleteAccount } = useAuth();
  const router = useRouter();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const navigation = useNavigation();
  const [password, setPassword] = useState("");
  const styles = getStyles(isDark);

  const signOut = async () => {
    try {
      await AsyncStorage.clear();
      router.replace("/login");
    } catch (error) {
      console.warn("Failed to sign out:", error);
    }
  };

  const confirmDeleteAccount = async () => {
    try {
      if (!password.trim()) {
        alert("Please enter your password.");
        return;
      }
      await deleteAccount(password); // backend call
      setShowDeleteModal(false);
      setPassword("");
      router.replace("/settings/deleteaccountsplash");
    } catch (error) {
      alert("Failed to delete account. Check your password and try again.");
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeaderTitle title="Settings" onBack={goBack} />,
    });
  }, [navigation, isDark]);

  return (
    <View style={[styles.screen]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          style={[
            styles.optionButton,
            {
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(120, 120, 120, 0.5)",
            },
          ]}
          onPress={() => router.push("/settings/accountdetails")}
        >
          <Text
            style={[styles.optionText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            Account Details
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? "#fff" : "#1d1d1d"}
          />
        </Pressable>

        <Pressable
          style={[
            styles.optionButton,
            {
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(120, 120, 120, 0.5)",
            },
          ]}
          onPress={() => router.push("/settings/appearance")}
        >
          <Text
            style={[styles.optionText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            Appearance
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? "#fff" : "#1d1d1d"}
          />
        </Pressable>

        <Pressable
          style={[
            styles.optionButton,
            {
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(120, 120, 120, 0.5)",
            },
          ]}
          onPress={() => router.push("/settings/preferences")}
        >
          <Text
            style={[styles.optionText, { color: isDark ? "#fff" : "#1d1d1d" }]}
          >
            Preferences
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? "#fff" : "#1d1d1d"}
          />
        </Pressable>

        <Pressable
          style={[
            styles.dangerButton,
            {
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(120, 120, 120, 0.5)",
            },
          ]}
          onPress={() => setShowSignOutModal(true)}
        >
          <Text style={[styles.dangerText]}>Sign Out</Text>
        </Pressable>

        <Pressable
          style={[
            styles.dangerButton,
            {
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(120, 120, 120, 0.5)",
            },
          ]}
          onPress={() => setShowDeleteModal(true)}
        >
          <Text style={styles.dangerText}>Delete Account</Text>
        </Pressable>
      </ScrollView>
      <ConfirmModal
        visible={showSignOutModal}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={() => {
          setShowSignOutModal(false);
          signOut();
        }}
        onCancel={() => setShowSignOutModal(false)}
      />

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Account"
        message="This action cannot be undone. Please enter your password to confirm deletion."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={() => {
          setShowDeleteModal(false);
          setPassword("");
        }}
      >
        <TextInput
          placeholder="Current Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={[
            styles.input,
            {
              color: isDark ? "#fff" : "#000",
              borderColor: isDark ? "#444" : "#ccc",
            },
          ]}
        />
      </ConfirmModal>
    </View>
  );
}

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      position: "relative",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 40,
    },
    optionButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    optionText: {
      fontSize: 18,
      fontFamily: Fonts.OSREGULAR,
    },
    dangerButton: {
      paddingVertical: 16,
      justifyContent: "space-between",
      borderBottomWidth: 1,
    },
    dangerText: {
      color: "#e53935",
      fontWeight: "600",
      fontSize: 18,
      fontFamily: Fonts.OSMEDIUM,
    },
    closeButton: {
      position: "absolute",
      top: 24,
      right: 15,
    },
    input: {
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#222" : "#eee",
      padding: 20,
      borderRadius: 8,
      fontSize: 16,
      marginVertical: 12,
      fontFamily: Fonts.OSLIGHT,
      width: "100%",
    },
  });
