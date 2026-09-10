import { CustomHeader } from "@/components/CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import ConfirmModal from "components/ConfirmModal";
import TextInputComponent from "components/TextInput";
import { Colors } from "constants/styles";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { usePreferences } from "contexts/PreferencesContext";
import { useNavigation, useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useAuth } from "hooks/UserHooks/useAuth";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  InteractionManager,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { settingsStyles } from "styles/SettingsStyles";
import { AlertConfig } from "types/alert";

export default function SettingsScreen() {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const { clearFavorites } = useFavoriteTeamsContext();
  const { deleteAccount, logout } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [pendingAlertConfig, setPendingAlertConfig] =
    useState<AlertConfig | null>(null);
  const [showLogoutModal, setshowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");

  const styles = settingsStyles(isDark);

  const closeAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  const queueAlert = useCallback((config: AlertConfig) => {
    setPendingAlertConfig(config);
  }, []);

  useEffect(() => {
    if (
      !pendingAlertConfig ||
      showDeleteModal ||
      showLogoutModal ||
      alertConfig
    ) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | undefined;

    const task = InteractionManager.runAfterInteractions(() => {
      timeout = setTimeout(() => {
        setAlertConfig(pendingAlertConfig);
        setPendingAlertConfig(null);
      }, 150);
    });

    return () => {
      task.cancel?.();

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [alertConfig, pendingAlertConfig, showDeleteModal, showLogoutModal]);

  const signOut = async () => {
    try {
      clearFavorites();
      await logout();
    } catch (error) {
      console.warn("Failed to sign out:", error);

      setshowLogoutModal(false);

      queueAlert({
        title: "Sign Out Failed",
        message: "Something went wrong while signing out. Please try again.",
        confirmText: "OK",
      });
    }
  };

  const confirmDeleteAccount = async () => {
    const currentPassword = password.trim();

    if (!currentPassword) {
      setShowDeleteModal(false);

      queueAlert({
        title: "Password Required",
        message: "Please enter your current password.",
        confirmText: "OK",
      });

      return;
    }

    try {
      await deleteAccount(currentPassword);

      setShowDeleteModal(false);
      setPassword("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Check your password and try again.";

      console.warn("Failed to delete account:", message);

      setShowDeleteModal(false);
      setPassword("");

      queueAlert({
        title: "Delete Account Failed",
        message:
          message === "Incorrect password" || message === "Invalid password"
            ? "The password you entered is incorrect. Please try again."
            : message,
        confirmText: "OK",
      });
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeader title="Settings" onBack={goBack} />,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.optionButtonContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => router.push("/settings/accountdetails")}
          >
            <Text style={styles.optionText}>Account Details</Text>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? Colors.white : Colors.black}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.optionButtonContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => router.push("/settings/preferences")}
          >
            <Text style={styles.optionText}>Preferences</Text>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={isDark ? Colors.white : Colors.black}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.optionButtonContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setshowLogoutModal(true)}
          >
            <Text style={styles.dangerText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.optionButtonContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <Text style={styles.dangerText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Logout?"
        message="You will need to log in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          setshowLogoutModal(false);
          signOut();
        }}
        onCancel={() => setshowLogoutModal(false)}
      />

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete Account"
        message="This action can't be undone. Enter your password to permanently delete your account."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteAccount}
        onCancel={() => {
          setShowDeleteModal(false);
          setPassword("");
        }}
      >
        <TextInputComponent
          placeholder="Current Password"
          placeholderTextColor={Colors.midTone}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />
      </ConfirmModal>

      <ConfirmModal
        visible={!!alertConfig}
        title={alertConfig?.title}
        message={alertConfig?.message}
        confirmText={alertConfig?.confirmText ?? "OK"}
        cancelText={alertConfig?.cancelText}
        showCancel={alertConfig?.showCancel ?? !!alertConfig?.cancelText}
        confirmDisabled={alertConfig?.confirmDisabled}
        variant={alertConfig?.variant ?? "default"}
        onCancel={closeAlert}
        onConfirm={closeAlert}
      />
    </View>
  );
}
