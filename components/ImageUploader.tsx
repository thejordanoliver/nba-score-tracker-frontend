// components/ImageUploader.tsx
import React from "react";
import { View, Text, Pressable, Image, StyleSheet, useColorScheme } from "react-native";

type ImageUploaderProps = {
  label: string;
  imageUri: string | null;
  onPress: () => void;
  circle?: boolean; // whether to show circular crop preview (default false)
  height?: number;
};

const OSLIGHT = "Oswald_300Light";

export default function ImageUploader({
  label,
  imageUri,
  onPress,
  circle = false,
  height = 150,
}: ImageUploaderProps) {
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark, circle, height);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={styles.uploadBox}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.placeholder}>Tap to select {label.toLowerCase()}</Text>
        )}
      </Pressable>
    </View>
  );
}

const getStyles = (isDark: boolean, circle: boolean, height: number) =>
  StyleSheet.create({
    label: {
      textAlign: "center",
      fontFamily: OSLIGHT,
      marginVertical: 12,
      color: isDark ? "#eee" : "#222",
      fontSize: 16,
    },
    uploadBox: {
      borderWidth: 1,
      borderColor: "#888",
      borderRadius: circle ? height / 2 : 10,
      height,
      width: circle ? height : "100%",
      justifyContent: "center",
      alignItems: "center",
      alignSelf: circle ? "center" : "stretch",
    },
    imagePreview: {
      width: circle ? height : "100%",
      height,
      borderRadius: circle ? height / 2 : 10,
      resizeMode: "cover",
    },
    placeholder: {
      color: isDark ? "#aaa" : "#666",
      fontFamily: OSLIGHT,
      textAlign: "center",
    },
  });
