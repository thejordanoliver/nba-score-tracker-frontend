import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import HeadingTwo from "components/Headings/HeadingTwo";
import {getStyles} from "app/settings/index"
import { usePreferences } from "contexts/PreferencesContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import { useLayoutEffect } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";


const PreferencesScreen = () => {
  const { viewMode, setViewMode } = usePreferences();
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  const textColor = isDark ? "#fff" : "#1d1d1d";
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeaderTitle title="Preferences" onBack={goBack} />,
    });
  }, [navigation, isDark]);

  return (
    <View style={{ padding: 12 }}>
      <HeadingTwo>Gamecard Layout</HeadingTwo>
      <View>
        <Pressable
          onPress={() => setViewMode("list")}
          style={[
            styles.optionButton,
            {
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(120, 120, 120, 0.5)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              height: 68,
            },
          ]}
        >
          <Text
            style={[
              styles.optionText,
              {
                color:
                  viewMode === "list"
                    ? textColor
                    : isDark
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(0,0,0,0.4)",
              },
            ]}
          >
            List
          </Text>
          {viewMode === "list" && (
            <Ionicons name="checkmark" size={24} color={textColor} />
          )}
        </Pressable>

        <Pressable
          onPress={() => setViewMode("grid")}
          style={[
            styles.optionButton,
            {
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(120, 120, 120, 0.5)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              height: 68,
            },
          ]}
        >
          <Text
            style={[
              styles.optionText,
              {
                color:
                  viewMode === "grid"
                    ? textColor
                    : isDark
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(0,0,0,0.4)",
              },
            ]}
          >
            Grid
          </Text>
          {viewMode === "grid" && (
            <Ionicons name="checkmark" size={24} color={textColor} />
          )}
        </Pressable>
        <Pressable
          onPress={() => setViewMode("stacked")}
          style={[
            styles.optionButton,
            {
              borderBottomColor: isDark
                ? "rgba(255,255,255,0.2)"
                : "rgba(120, 120, 120, 0.5)",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              height: 68,
            },
          ]}
        >
          <Text
            style={[
              styles.optionText,
              {
                color:
                  viewMode === "stacked"
                    ? textColor
                    : isDark
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(0,0,0,0.4)",
              },
            ]}
          >
            Stacked
          </Text>
          {viewMode === "stacked" && (
            <Ionicons name="checkmark" size={24} color={textColor} />
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default PreferencesScreen;
