import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { Oswald_400Regular } from "@expo-google-fonts/oswald";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";

const TABS = [
  {
    name: "Home",
    route: "/",
    icon: require("../assets/icons8/Home.png"),
  },
  {
    name: "League",
    route: "/league",
    icon: require("../assets/icons8/Scoreboard.png"),
  },
  {
    name: "Explore",
    route: "/explore",
    icon: require("../assets/icons8/Compass.png"),
  },
  {
    name: "Profile",
    route: "/profile",
    icon: require("../assets/icons8/User.png"),
  },
];

// Map nested or related routes to their parent tab route
const TAB_ROUTE_PARENTS: { [key: string]: string } = {
  "/league/stats": "/league",
  "/league/schedule": "/league",

  "/settings": "/profile",
  "/settings/accountdetails": "/profile",
  "/settings/appearance": "/profile",
  "/settings/preferences": "/profile",

  "/": "/",
  "/league": "/league",
  "/explore": "/explore",
  "/profile": "/profile",


};

function getActiveTab(pathname: string): string | null {
  if (TAB_ROUTE_PARENTS[pathname]) return TAB_ROUTE_PARENTS[pathname];

  const keys = Object.keys(TAB_ROUTE_PARENTS).sort(
    (a, b) => b.length - a.length
  );
  for (const key of keys) {
    if (pathname.startsWith(key)) {
      return TAB_ROUTE_PARENTS[key];
    }
  }

  return "/";
}

export default function CustomTabBar() {
  const [fontsLoaded] = useFonts({ Oswald_400Regular });
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const pathname = usePathname();

  const [lastActiveTab, setLastActiveTab] = useState<string>("/");

  if (!fontsLoaded) return null;

  const currentActiveTab = getActiveTab(pathname);

useEffect(() => {
  if (
    !pathname.startsWith("/team") &&
    !pathname.startsWith("/game") &&
    !pathname.startsWith("/player") &&
    !pathname.startsWith("/user")
  ) {
    setLastActiveTab(currentActiveTab || "/");
  }
}, [pathname, currentActiveTab]);


const activeTabRoute =
  pathname.startsWith("/team") ||
  pathname.startsWith("/game") ||
  pathname.startsWith("/player") ||
  pathname.startsWith("/user")
    ? lastActiveTab
    : currentActiveTab;


  if (pathname === "/login") return null;

  // Helper to identify detail screens
const isDetailScreen = (path: string) =>
  path.startsWith("/team") ||
  path.startsWith("/game") ||
  path.startsWith("/player") ||
  path.startsWith("/user");

  // Main tabs routes
  const mainTabs = ["/", "/league", "/explore", "/profile"];

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
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
                : "rgba(255, 255, 255, 0.5)",
            },
          ]}
        />
        <View style={styles.tabRow}>
          {TABS.map(({ name, route, icon }) => {
            const focused = activeTabRoute === route;

            const handlePress = () => {
              if (route === pathname) return; // already there

              if (isDetailScreen(pathname) && mainTabs.includes(route)) {
                // From detail screen to main tab → instant navigation
                router.replace(route as any);
              } else {
                // Otherwise normal slide animation
                router.push(route as any);
              }
            };

            return (
              <TouchableOpacity
                key={name}
                onPress={handlePress}
                style={styles.tabButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={`Go to ${name} tab`}
              >
                <Image
                  source={icon}
                  style={{
                    width: 24,
                    height: 24,
                    tintColor: focused ? (isDark ? "white" : "black") : "gray",
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontFamily: "Oswald_400Regular",
                    color: focused ? (isDark ? "white" : "black") : "gray",
                  }}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    shadowColor: "rgba(0, 0, 0, 0.8)",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12, 
    
  },
  tabBarContainer: {
    height: 80,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    flex: 1,
    marginBottom: 10,
    paddingVertical: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
