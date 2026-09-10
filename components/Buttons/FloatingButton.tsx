import { supportsLiquidGlass } from "@/utils/glass";
import { Ionicons } from "@expo/vector-icons";
import { activeOpacity, Colors } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  isOpen: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

function FloatingButton({ isOpen, onPress, icon = "chatbubble" }: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = useMemo(() => FloatingButtonStyles(isDark), [isDark]);
  const liquid = supportsLiquidGlass();
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
      pointerEvents={isOpen ? "none" : "box-none"}
      style={[
        styles.floatingButtonWrapper,
        {
          opacity: opacityAnim,
        },
      ]}
    >
      {liquid ? (
        <GlassView
          style={styles.floatingButton}
          glassEffectStyle="regular"
          isInteractive
        >
          <TouchableOpacity
            style={styles.touchable}
            onPress={onPress}
            activeOpacity={activeOpacity}
          >
            <Ionicons
              name={icon}
              size={24}
              color={isDark ? Colors.white : Colors.black}
            />
          </TouchableOpacity>
        </GlassView>
      ) : (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={onPress}
          activeOpacity={activeOpacity}
        >
          <BlurView intensity={25} style={StyleSheet.absoluteFill} />

          <Ionicons
            name={icon}
            size={24}
            color={isDark ? Colors.white : Colors.black}
          />
        </TouchableOpacity>
      )}
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
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      width: 64,
      height: 64,
      marginHorizontal: 20,
      borderRadius: 32,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.white : Colors.black,
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: isDark ? 0.5 : 0.3,
      shadowRadius: 4.65,
      elevation: 7,
    },

    touchable: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
  });
