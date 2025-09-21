import { Fonts } from "constants/fonts";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, useColorScheme } from "react-native";
export default function SignupSuccessScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const screenFade = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Step 1: Fade in screen
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      // Step 2: Fade in text
      Animated.timing(textFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // Step 3: Wait 1.2s, then fade out both
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(textFade, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(screenFade, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]).start(() => {
            router.replace("/(tabs)/profile");
          });
        }, 5000);
      });
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenFade,
          backgroundColor: isDark ? "#1d1d1d" : "#fff",
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.text,
          { color: isDark ? "#fff" : "#1d1d1d", opacity: textFade },
        ]}
      >
        You're All Set!
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 32,
    fontFamily: Fonts.OSBOLD,
  },
});
