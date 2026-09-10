import { Colors, Fonts } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

type LabeledInputProps = Omit<
  TextInputProps,
  "multiline" | "onChangeText" | "value"
> & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
  enforceMaxLength?: boolean;
  hint?: string | null;
};

export default function LabeledInput({
  label,
  value,
  onChangeText,
  multiline = false,
  placeholder,
  enforceMaxLength = true,
  hint,
  ...rest
}: LabeledInputProps) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = labeledInputStyles(isDark);

  const MAX_LENGTH = 150;

  const handleChange = (text: string) => {
    if (enforceMaxLength && multiline && text.length > MAX_LENGTH) return;
    onChangeText(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={handleChange}
        multiline={multiline}
        maxLength={multiline ? MAX_LENGTH : undefined}
        placeholder={placeholder}
        placeholderTextColor={Colors.midTone}
        style={[
          styles.input,

          multiline && { minHeight: 120, textAlignVertical: "top" },
        ]}
        {...rest}
      />

      <View style={styles.hintContainer}>
        {multiline && (
          <Text style={styles.count}>
            {value.length}/{MAX_LENGTH}
          </Text>
        )}
        {!!hint && <Text style={styles.errorText}>{hint}</Text>}
      </View>
    </View>
  );
}

const labeledInputStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: { marginBottom: 10 },
    label: {
      paddingLeft: 4,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      letterSpacing: 0.3,
      color: isDark ? Colors.transparentLightGray : Colors.transparentDarkGray,
      textTransform: "uppercase",
    },
    input: {
      marginVertical: 12,
      paddingVertical: 20,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: isDark
        ? Colors.transparentLightGray
        : Colors.transparentDarkGray,
      borderRadius: 12,
      backgroundColor: isDark
        ? Colors.dark.itemBackground
        : Colors.light.itemBackground,
      fontFamily: Fonts.REGULAR,
      fontSize: 15,
      color: isDark ? Colors.white : Colors.black,
    },

    hintContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    errorText: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: isDark ? Colors.dark.lightRed : Colors.light.red,
    },
    count: {
      fontFamily: Fonts.REGULAR,
      fontSize: 14,
      color: Colors.midTone,
    },
  });
