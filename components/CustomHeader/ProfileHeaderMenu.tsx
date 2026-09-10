import { Ionicons } from "@expo/vector-icons";
import { Colors, activeOpacity } from "constants/styles";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { customHeaderStyles } from "../../styles/CustomHeaderStyles";

type ProfileHeaderMenuProps = {
  visible: boolean;
  isDark: boolean;
  onSettings?: () => void;
  onLogout?: () => void;
  onEdit?: () => void;
};

export function ProfileHeaderMenu({
  visible,
  isDark,
  onSettings,
  onLogout,
  onEdit,
}: ProfileHeaderMenuProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [shouldRender, setShouldRender] = useState(visible);

  const { width } = useWindowDimensions();
  const styles = customHeaderStyles(isDark, width);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);

      Animated.spring(progress, {
        toValue: 1,
        damping: 16,
        stiffness: 230,
        mass: 0.8,
        useNativeDriver: true,
      }).start();

      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 130,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShouldRender(false);
      }
    });
  }, [progress, visible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.profileSubmenu,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-6, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
          ],
        },
      ]}
    >
      {onEdit ? (
        <>
          {(onSettings || onLogout) && (
            <View style={styles.profileSubmenuSeparator} />
          )}
        </>
      ) : null}

      {onSettings ? (
        <TouchableOpacity
          activeOpacity={activeOpacity}
          style={styles.profileSubmenuItem}
          onPress={onSettings}
        >
          <View style={styles.profileSubmenuIconWrap}>
            <Ionicons
              name="settings-outline"
              size={24}
              color={isDark ? Colors.white : Colors.black}
            />
          </View>

          <Text style={styles.profileSubmenuText}>Settings</Text>
        </TouchableOpacity>
      ) : null}

      {onLogout ? (
        <>
          {onSettings ? <View style={styles.profileSubmenuSeparator} /> : null}

          <TouchableOpacity
            activeOpacity={activeOpacity}
            style={styles.profileSubmenuItem}
            onPress={onLogout}
          >
            <View style={styles.profileSubmenuIconWrap}>
              <Ionicons
                name="log-out-outline"
                size={24}
                color={isDark ? Colors.dark.lightRed : Colors.light.red}
              />
            </View>

            <Text
              style={[
                styles.profileSubmenuText,
                {
                  color: isDark ? Colors.dark.lightRed : Colors.light.red,
                },
              ]}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </Animated.View>
  );
}
