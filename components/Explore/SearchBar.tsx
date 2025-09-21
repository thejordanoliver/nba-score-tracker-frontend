import React, { useRef, useEffect } from "react";
import { Animated, Easing, TextInput, useColorScheme, View } from "react-native";
import { styles } from "styles/Explore.styles";
import TabBar from "components/TabBar";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  visible: boolean;
  onFocus: () => void;
  onBlur: () => void;
  tabs?: string[];
  selectedTab?: string;
  onTabPress?: (tab: string) => void;
};

export default function SearchBar({
  value,
  onChangeText,
  visible,
  onFocus,
  onBlur,
  tabs = [],
  selectedTab,
  onTabPress,
}: Props) {
  const inputAnim = useRef(new Animated.Value(0)).current;
  const isDark = useColorScheme() === "dark";

  useEffect(() => {
    Animated.timing(inputAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [visible]);

  return (
    <View>
      <Animated.View
        style={[
          styles.searchBarWrapper,
          {
            width: inputAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
            height: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }),
            opacity: inputAnim,
            marginBottom: inputAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
          },
        ]}
      >
        <TextInput
          placeholder="Search..."
          placeholderTextColor={isDark ? "#888" : "#aaa"}
          style={[styles.searchInput, isDark && styles.searchInputDark]}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </Animated.View>

      {visible && tabs.length > 0 && selectedTab && onTabPress && (
        <TabBar
          tabs={tabs}
          selected={selectedTab}
          onTabPress={onTabPress}
          style={{ marginBottom: 16 }}
        />
      )}
    </View>
  );
}
