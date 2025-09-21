import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Image, StyleSheet, useColorScheme, View } from "react-native";



export default function TabLayout() {
  const isDark = useColorScheme() === "dark";

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isDark ? "white" : "black",

          tabBarInactiveTintColor: "gray",
          tabBarStyle: {
            backgroundColor: "transparent",
            borderTopWidth: 0,
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 80, // Adjusted height for better visibility
            opacity: 0,
          },
          tabBarLabelStyle: {
            fontFamily: "Oswald_400Regular", // ← Set the font here
            fontSize: 12,
          },
          tabBarBackground: () => (
            <View style={styles.blurContainer}>
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? "rgba(0,0,0,0.3)"
                      : "rgba(255,255,255,0.3)",
                  },
                ]}
              />
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={require("../../assets/icons8/Home.png")}
                style={{
                  width: size,
                  height: size,
                  tintColor: focused ? (isDark ? "white" : "black") : "gray",
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="league"
          options={{
            title: "League",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={require("../../assets/icons8/Scoreboard.png")}
                style={{
                  width: size,
                  height: size,
                  tintColor: focused ? (isDark ? "white" : "black") : "gray",
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={require("../../assets/icons8/Compass.png")}
                style={{
                  width: size,
                  height: size,
                  tintColor: focused ? (isDark ? "white" : "black") : "gray",
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused, size }) => (
              <Image
                source={require("../../assets/icons8/User.png")}
                style={{
                  width: size,
                  height: size,
                  tintColor: focused ? (isDark ? "white" : "black") : "gray",
                }}
                resizeMode="contain"
              />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    overflow: "hidden",
  },
});
