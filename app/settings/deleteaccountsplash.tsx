import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { Fonts } from "constants/fonts";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Animated, StyleSheet, useColorScheme } from "react-native";




export default function DeleteAccountSplashScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const navigation = useNavigation();
  const screenFade = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;


  
  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => <CustomHeaderTitle title="" />,
    });
  }, [navigation, isDark]);

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
            router.replace("/");
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
        We hate to see you go
      </Animated.Text>
    </Animated.View>
  );
}

export const options = {
  // Make the screen fade in instead of slide
  animation: "fade",
  gestureEnabled: false, // optional: disable swipe back
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 28,
    fontFamily: Fonts.OSBOLD,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
