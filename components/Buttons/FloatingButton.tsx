import { Ionicons } from "@expo/vector-icons";
import { activeOpacity, Colors } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { BlurView } from "expo-blur";
import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  isOpen: boolean;
  onPress: () => void;
  icon?: string;
};

function FloatingButton({ isOpen, onPress, icon }: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = useMemo(() => FloatingButtonStyles(isDark), [isDark]);

  const opacityAnim = useRef(new Animated.Value(isOpen ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isOpen ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen, opacityAnim]);

  return (
    <Animated.View
      pointerEvents={isOpen ? "none" : "auto"}
      style={[styles.floatingButtonWrapper, { opacity: opacityAnim }]}
    >
      <BlurView intensity={100} style={StyleSheet.absoluteFill}>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={onPress}
        activeOpacity={activeOpacity}
        >
        <Ionicons
          name={icon || "chatbubble"}
          size={24}
          color={isDark ? Colors.black : Colors.white}
          />
      </TouchableOpacity>
          </BlurView>
    </Animated.View>
  );
}

export default memo(FloatingButton);

const FloatingButtonStyles = (isDark: boolean) =>
  StyleSheet.create({
    floatingButtonWrapper: {
      position: "absolute",
      right: 0,
      bottom: 100,
      left: 0,
      zIndex: 999,
      alignItems: "flex-end",
      elevation: 999,
    },
    floatingButton: {
      alignItems: "center",
      justifyContent: "center",
      width: 64,
      height: 64,
      marginHorizontal: 20,
      borderRadius: 32,
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.5 : 0.3,
      shadowRadius: 4.65,
      elevation: 7,
    },
  });
