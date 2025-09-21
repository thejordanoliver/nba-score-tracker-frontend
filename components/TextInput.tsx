import React from "react";
import { View, Text, TextInput, StyleSheet, useColorScheme } from "react-native";
import { Fonts } from "constants/fonts";
type LabeledInputProps = {

  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  placeholder?: string;
  containerStyle?: object | object[];
  inputStyle?: object | object[];
  labelStyle?: object | object[];
  [key: string]: any; // for other TextInput props
};

export default function TextInputComponent({
  value,
  onChangeText,
  multiline = false,
  placeholder,
  containerStyle,
  inputStyle,
  labelStyle,
  ...rest
}: LabeledInputProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={[styles.container, containerStyle]}>
    
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={isDark ? "#888" : "#666"}
        style={[
          styles.input,
          multiline && styles.bioInput,
          {
            color: isDark ? "#fff" : "#000",
            backgroundColor: isDark ? "#2e2e2e" : "#eee",
          },
          inputStyle,
        ]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  
  },

  input: {
    padding: 20,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
    fontFamily: Fonts.OSLIGHT,
  },
  bioInput: {
    height: 100,
    textAlignVertical: "top",
  },
});
