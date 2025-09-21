// components/SignInForm.tsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Fonts } from "constants/fonts";


type SignInFormProps = {
  username: string;
  password: string;
  showPassword: boolean;
  onUsernameChange: (text: string) => void;
  onPasswordChange: (text: string) => void;
  onToggleShowPassword: () => void;
  onSubmit: () => void;
};



export default function SignInForm({
  username,
  password,
  showPassword,
  onUsernameChange,
  onPasswordChange,
  onToggleShowPassword,
  onSubmit,
}: SignInFormProps) {
  const isDark = useColorScheme() === "dark";

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={onUsernameChange}
        style={styles.input}
        placeholderTextColor={isDark ? "#888" : "#aaa"}
        autoCapitalize="none"
      />
      <View style={styles.passwordRow}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={onPasswordChange}
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
          placeholderTextColor={isDark ? "#888" : "#aaa"}
        />
        <Pressable
          onPress={onToggleShowPassword}
          style={styles.iconButton}
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color={isDark ? "#fff" : "#000"}
          />
        </Pressable>
      </View>
      <Pressable onPress={onSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Sign In</Text>
      </Pressable>
    </View>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
    },
    input: {
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#222" : "#eee",
      padding: 20,
      borderRadius: 8,
      fontSize: 16,
      marginVertical: 20,
      fontFamily: Fonts.OSLIGHT,
    },
    passwordRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "#222" : "#eee",
      borderRadius: 8,
      marginBottom: 12,
    },
    passwordInput: {
      fontFamily: Fonts.OSLIGHT,
      flex: 1,
      fontSize: 16,
      padding: 20,
      color: isDark ? "#fff" : "#000",
    },
    iconButton: { padding: 20 },
    button: {
      backgroundColor: isDark ? "#fff" : "#1d1d1d",
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    buttonText: {
      color: isDark ? "#000" : "#fff",
      fontFamily: Fonts.OSREGULAR,
      fontSize: 16,
    },
  });
