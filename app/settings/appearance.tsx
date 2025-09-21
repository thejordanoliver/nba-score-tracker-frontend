import React from "react";
import { View, Text, useColorScheme } from "react-native";
import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";
import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { goBack } from "expo-router/build/global-state/routing";

const AppearanceScreen = () => {
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeaderTitle title="Appearance" onBack={goBack} />,
    });
  }, [navigation, isDark]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Appearance</Text>
    </View>
  );
};

export default AppearanceScreen;
