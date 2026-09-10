import Button from "@/components/Buttons/Button";
import { CustomHeader } from "@/components/CustomHeader";
import { zodResolver } from "@hookform/resolvers/zod";
import HeadingTwo from "components/Headings/HeadingTwo";
import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useAccountDetails } from "hooks/UserHooks/useAccountDetails";
import { useLayoutEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "schemas/auth/changePasswordSchema";

const INITIAL_VALUES: ChangePasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Failed to update password";
}

export default function AccountDetailsScreen() {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const navigation = useNavigation();
  const styles = accountDetailsStyles(isDark);
  const { isLoading, userData, changePassword } = useAccountDetails();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
    setError,
  } = useForm<ChangePasswordFormValues>({
    defaultValues: INITIAL_VALUES,
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(changePasswordSchema),
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeader title="Account Details" onBack={goBack} />,
    });
  }, [navigation, isDark]);

  const handleChangePassword = async (values: ChangePasswordFormValues) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      Alert.alert("Success", "Password updated successfully.");
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      if (message === "Current and new password are required") {
        setError("currentPassword", { type: "server", message });
        setError("newPassword", { type: "server", message });
        return;
      }

      if (message === "Invalid current password") {
        setError("currentPassword", { type: "server", message });
        return;
      }

      if (
        message === "New password must be different" ||
        message === "Password must be between 8 and 128 characters"
      ) {
        setError("newPassword", { type: "server", message });
        return;
      }

      Alert.alert("Error", message);
    }
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? Colors.black : Colors.white,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? Colors.white : Colors.black}
        />
      </View>
    );
  }

  if (!userData) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? Colors.black : Colors.white,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: isDark ? Colors.white : Colors.black }}>
          Unable to load account details.
        </Text>
      </View>
    );
  }

  const formattedDate = new Date(userData.createdAt).toLocaleDateString(
    "en-US",
    {
      dateStyle: "long",
    },
  );

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainerStyle}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <HeadingTwo isDark={isDark}>Full Name</HeadingTwo>
      <Text style={styles.text}>{userData.fullName}</Text>

      <HeadingTwo isDark={isDark}>Username</HeadingTwo>
      <Text style={styles.text}>{userData.username}</Text>

      <HeadingTwo isDark={isDark}>Email</HeadingTwo>
      <Text style={styles.text}>{userData.email}</Text>

      {/* Password Section */}

      <HeadingTwo isDark={isDark}>Password</HeadingTwo>
      <Text style={styles.text}>••••••••</Text>

      <Controller
        control={control}
        name="currentPassword"
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <View style={[styles.input, fieldState.error && styles.inputError]}>
              <TextInput
                ref={field.ref}
                placeholder="Current Password"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholderTextColor={Colors.midTone}
                style={styles.inputText}
                autoCapitalize="none"
              />
            </View>

            {fieldState.error?.message && (
              <Text style={styles.fieldErrorText}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      {/* Change Password Inputs */}

      <Controller
        control={control}
        name="newPassword"
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <View style={[styles.input, fieldState.error && styles.inputError]}>
              <TextInput
                ref={field.ref}
                placeholder="New Password"
                placeholderTextColor={Colors.midTone}
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                style={styles.inputText}
              />
            </View>

            {fieldState.error?.message && (
              <Text style={styles.fieldErrorText}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <View style={styles.field}>
            <View style={[styles.input, fieldState.error && styles.inputError]}>
              <TextInput
                ref={field.ref}
                placeholder="Confirm New Password"
                placeholderTextColor={Colors.midTone}
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                style={styles.inputText}
              />
            </View>

            {fieldState.error?.message && (
              <Text style={styles.fieldErrorText}>
                {fieldState.error.message}
              </Text>
            )}
          </View>
        )}
      />

      <Button
        onPress={handleSubmit(handleChangePassword)}
        disabled={isSubmitting}
        isDark={isDark}
      >
        Change Password
      </Button>

      <Text style={styles.memberSince}>Member Since: {formattedDate}</Text>
    </KeyboardAwareScrollView>
  );
}
const accountDetailsStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    contentContainerStyle: {
      flex: 1,
      gap: 16,
      paddingHorizontal: 12,
      paddingTop: 20,
    },
    field: {
      gap: 4,
    },
    input: {
      flexDirection: "row",
      alignItems: "center",
      height: 54,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      borderRadius: 8,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
    },
    inputError: {
      borderColor: isDark ? Colors.dark.lightRed : Colors.light.red,
    },

    inputText: {
      flex: 1,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.white : Colors.black,
    },
    fieldErrorText: {
      paddingHorizontal: 4,
      fontFamily: Fonts.REGULAR,
      fontSize: 13,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
    },

    button: {
      alignItems: "center",
      padding: 14,
      borderRadius: 8,
    },
    text: {
      marginBottom: 10,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.lightGray : Colors.darkGray,
    },
    memberSince: {
      marginTop: 12,
      fontFamily: Fonts.REGULAR,
      fontSize: 16,
      color: isDark ? Colors.darkGray : Colors.lightGray,
      textAlign: "center",
    },
  });
