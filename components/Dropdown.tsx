import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "constants/styles";
import { BlurView } from "expo-blur";
import React, { useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

export type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  options: DropdownOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  isDark: boolean;
  width?: number;
  style?: ViewStyle;
};

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  isDark,
  width = 180,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const styles = dropDownStyles({
    isDark,
    width,
    anim,
    visible,
  });

  const openDropdown = () => {
    setVisible(true);

    Animated.timing(anim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  const toggleDropdown = () => {
    if (visible) {
      closeDropdown();
      return;
    }

    openDropdown();
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    closeDropdown();
  };

  const selectedLabel =
    options.find((option) => option.value === selectedValue)?.label ??
    options[0]?.label ??
    "";

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleDropdown}
        style={styles.toggleButton}
      >
        <Text numberOfLines={1} style={styles.selectedLabel}>
          {selectedLabel}
        </Text>

        <Animated.View style={styles.chevronContainer}>
          <Ionicons
            name="chevron-down"
            size={20}
            color={isDark ? Colors.white : Colors.black}
          />
        </Animated.View>
      </TouchableOpacity>

      {visible ? (
        <Animated.View style={styles.dropdownPanel}>
          <BlurView intensity={100} style={styles.blurView} />

          <ScrollView
            style={styles.optionsScrollView}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {options.map((option, index) => {
              const isSelected = selectedValue === option.value;
              const isLast = index === options.length - 1;

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(option.value)}
                  style={[
                    styles.optionButton,
                    !isLast && styles.optionBorder,
                    isSelected && styles.selectedOptionButton,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>

                  {isSelected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={isDark ? Colors.dark.blue : Colors.light.blue}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      ) : null}
    </View>
  );
};

type DropDownStylesParams = {
  isDark: boolean;
  width: number;
  anim: Animated.Value;
  visible: boolean;
};

export const dropDownStyles = ({
  isDark,
  width,
  anim,
  visible,
}: DropDownStylesParams) => {
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return StyleSheet.create({
    container: {
      position: "relative",
      zIndex: visible ? 9999 : 1,
      width,
      elevation: visible ? 9999 : 1,
    },

    toggleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      minHeight: 42,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: Colors.midTone,
      borderRadius: 8,
    },

    selectedLabel: {
      flex: 1,
      marginRight: 8,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },

    chevronContainer: {
      alignItems: "center",
      justifyContent: "center",
      transform: [{ rotate }],
    },

    dropdownPanel: {
      position: "absolute",
      top: 48,
      left: 0,
      zIndex: 9999,
      width,
      maxHeight: 260,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.12)",
      borderRadius: 12,
      backgroundColor: isDark
        ? Colors.transparentDarkGray
        : Colors.transparentLightGray,
      opacity: anim,
      overflow: "hidden",
      shadowColor: Colors.black,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 9999,
      transform: [{ translateY }],
    },

    blurView: {
      ...StyleSheet.absoluteFillObject,
    },

    optionsScrollView: {
      maxHeight: 260,
    },

    optionsContent: {
      paddingVertical: 0,
    },

    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 44,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },

    optionBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.08)",
    },

    selectedOptionButton: {
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(0, 0, 0, 0.05)",
    },

    optionText: {
      flex: 1,
      marginRight: 8,
      fontFamily: Fonts.MEDIUM,
      fontSize: 14,
      color: isDark ? Colors.white : Colors.black,
    },

    selectedOptionText: {
      color: isDark ? Colors.dark.blue : Colors.light.blue,
    },
  });
};
