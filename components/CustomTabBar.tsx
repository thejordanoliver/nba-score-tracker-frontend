import { activeOpacity, Colors, Fonts } from "constants/styles";
import { BlurView } from "expo-blur";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Balls, Compass, Home, User } from "reicon-react-native";

export type TabBarProps = {
  isDark: boolean;
};

export default function CustomTabBar({ isDark }: TabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const iconColor = isDark ? Colors.white : Colors.black;

  const TABS = [
    {
      name: "Home",
      route: "/",
      renderIcon: (focused: boolean) => (
        <Home
          size={24}
          color={iconColor}
          weight={focused ? "Filled" : "Outline"}
        />
      ),
    },
    {
      name: "Leagues",
      route: "/league",
      renderIcon: (focused: boolean) => (
        <Balls
          size={24}
          color={iconColor}
          weight={focused ? "Filled" : "Outline"}
        />
      ),
    },
    {
      name: "Explore",
      route: "/explore",
      renderIcon: (focused: boolean) => (
        <Compass
          size={24}
          color={iconColor}
          weight={focused ? "Filled" : "Outline"}
        />
      ),
    },
    {
      name: "Profile",
      route: "/profile",
      renderIcon: (focused: boolean) => (
        <User
          size={24}
          color={iconColor}
          weight={focused ? "Filled" : "Outline"}
        />
      ),
    },
  ];

  const TAB_ROUTE_PARENTS: Record<string, string> = {
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

  const HIDDEN_TAB_ROUTES = ["/login", "/forgot-password", "/create-post"];

  const HIDDEN_TAB_PREFIXES = [
    "/messages",
    "/comment-thread",
    "/post",
    "/edit-profile",
  ];

  const DETAIL_SCREEN_PREFIXES = [
    "/team",
    "/game",
    "/messages",
    "/player",
    "/user",
    "/comment-thread",
    "/post",
  ];

  const MAIN_TABS = ["/", "/league", "/explore", "/profile"];

  function getActiveTab(currentPathname: string): string {
    if (TAB_ROUTE_PARENTS[currentPathname]) {
      return TAB_ROUTE_PARENTS[currentPathname];
    }

    const keys = Object.keys(TAB_ROUTE_PARENTS).sort(
      (a, b) => b.length - a.length,
    );

    for (const key of keys) {
      if (currentPathname.startsWith(key)) {
        return TAB_ROUTE_PARENTS[key];
      }
    }

    return "/";
  }

  function shouldHideTabBar(currentPathname: string) {
    return (
      HIDDEN_TAB_ROUTES.includes(currentPathname) ||
      HIDDEN_TAB_PREFIXES.some((prefix) => currentPathname.startsWith(prefix))
    );
  }

  function isDetailScreen(currentPathname: string) {
    return DETAIL_SCREEN_PREFIXES.some((prefix) =>
      currentPathname.startsWith(prefix),
    );
  }

  const [lastActiveTab, setLastActiveTab] = useState("/");

  const currentActiveTab = getActiveTab(pathname);
  const detailScreen = isDetailScreen(pathname);

  useEffect(() => {
    if (!detailScreen) {
      setLastActiveTab(currentActiveTab);
    }
  }, [currentActiveTab, detailScreen]);

  if (shouldHideTabBar(pathname)) {
    return null;
  }

  const activeTabRoute = detailScreen ? lastActiveTab : currentActiveTab;

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        <BlurView intensity={100} style={StyleSheet.absoluteFill} />

        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark
                ? "rgba(0, 0, 0, 0.3)"
                : "rgba(255, 255, 255, 0.5)",
            },
          ]}
        />

        <View style={styles.tabRow}>
          {TABS.map(({ name, route, renderIcon }) => {
            const focused = activeTabRoute === route;

            const handlePress = () => {
              if (route === pathname) {
                return;
              }

              if (detailScreen && MAIN_TABS.includes(route)) {
                router.replace(route as any);
                return;
              }

              router.push(route as any);
            };

            return (
              <TouchableOpacity
                key={name}
                onPress={handlePress}
                style={styles.tabButton}
                activeOpacity={activeOpacity}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={`Go to ${name} tab`}
              >
                {renderIcon(focused)}

                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: focused
                        ? isDark
                          ? Colors.white
                          : Colors.black
                        : Colors.midTone,
                    },
                  ]}
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
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "rgba(0, 0, 0, 0.8)",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },

  tabBarContainer: {
    height: 80,
    backgroundColor: "transparent",
    overflow: "hidden",
  },

  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 10,
    paddingVertical: 20,
  },

  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  tabLabel: {
    marginTop: 4,
    fontFamily: Fonts.REGULAR,
    fontSize: 12,
  },
});
