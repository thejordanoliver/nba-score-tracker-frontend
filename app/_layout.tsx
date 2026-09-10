import {
  Oswald_200ExtraLight,
  Oswald_300Light,
  Oswald_400Regular,
  Oswald_500Medium,
  Oswald_600SemiBold,
  Oswald_700Bold,
  useFonts,
} from "@expo-google-fonts/oswald";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { CustomHeader } from "../components/CustomHeader";
import CustomTabBar from "../components/CustomTabBar";
import BadgeUnlockedModal from "../components/Profile/Badges/BadgeUnlockedModal";
import ForegroundNotificationBanner from "../components/Notifications/ForegroundNotificationBanner";
import { Colors } from "../constants/styles";
import { ExploreWidgetsProvider } from "../contexts/ExploreWidgetsContext";
import { FavoriteTeamsProvider } from "../contexts/FavoriteTeamsContext";
import { MessagesProvider } from "../contexts/MessagesContext";
import {
  NotificationProvider,
  useNotifications,
} from "../contexts/NotificationContext";
import {
  PreferencesProvider,
  usePreferences,
} from "../contexts/PreferencesContext";
import { useBadgeRealtimeNotifications } from "../hooks/ForumHooks/useBadgeRealtimeNotifications";
import { useAuth } from "../hooks/UserHooks/useAuth";
import { useBadgeNotificationStore } from "../store/badgeNotificationStore";
import { clearAuthSession } from "../utils/apiClient";

SplashScreen.preventAutoHideAsync().catch(() => {});

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

const CustomDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: Colors.black,
    text: Colors.white,
  },
};

const CustomLightTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,
    background: Colors.white,
    text: Colors.black,
  },
};

const hiddenRoutes = [
  "/news/article",
  "/highlights/video",
  "/edit-profile",
  "/edit-favorites",
  "/signup/success",
  "/settings/deleteaccountsplash",
  "/player/",
  "/settings",
  "/settings/index",
  "/login",
  "/forgot-password",
  "/comment-thread/",
];

const publicRoutes = [
  "/login",
  "/forgot-password",
  "/settings/deleteaccountsplash",
];

function BadgeRealtimeBridge({
  token,
  userId,
}: {
  token?: string | null;
  userId?: number | string | null;
}) {
  useBadgeRealtimeNotifications({ token, userId });

  return null;
}

function AppLayout() {
  const pathname = usePathname();

  const { resolvedColorScheme } = usePreferences();

  const { clearCenterNotifications } = useNotifications();

  const isDark = resolvedColorScheme === "dark";

  const router = useRouter();

  const { user, token, loadingUser } = useAuth();

  const opacity = useRef(new Animated.Value(1)).current;

  const [visibleTabBar, setVisibleTabBar] = useState(true);

  const [checkingStoredSession, setCheckingStoredSession] = useState(true);

  const shouldHideTabBar = hiddenRoutes.some((r) => pathname?.startsWith(r));

  const isPublicRoute = publicRoutes.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    let isMounted = true;

    const redirectIfUnauthenticated = async () => {
      if (loadingUser) {
        return;
      }

      if (user || isPublicRoute) {
        if (isMounted) {
          setCheckingStoredSession(false);
        }

        return;
      }

      try {
        const values = await AsyncStorage.multiGet([
          "accessToken",
          "userId",
          "username",
        ]);

        const stored: Record<string, string | null> =
          Object.fromEntries(values);

        const parsedUserId = stored.userId
          ? Number.parseInt(stored.userId, 10)
          : NaN;

        if (!isMounted) return;

        if (
          stored.accessToken &&
          stored.userId &&
          stored.username &&
          !Number.isNaN(parsedUserId)
        ) {
          setCheckingStoredSession(false);

          return;
        }

        useBadgeNotificationStore.getState().clearBadgeNotifications();

        clearCenterNotifications();

        await clearAuthSession(stored.userId);

        if (isMounted) {
          setCheckingStoredSession(false);

          router.replace("/login");
        }
      } catch {
        useBadgeNotificationStore.getState().clearBadgeNotifications();

        clearCenterNotifications();

        if (isMounted) {
          setCheckingStoredSession(false);

          router.replace("/login");
        }
      }
    };

    redirectIfUnauthenticated();

    return () => {
      isMounted = false;
    };
  }, [
    clearCenterNotifications,
    isPublicRoute,
    loadingUser,
    pathname,
    router,
    user,
  ]);

  useEffect(() => {
    if (!pathname) return;

    setVisibleTabBar(!shouldHideTabBar);
  }, [pathname, shouldHideTabBar]);

  useEffect(() => {
    if (!loadingUser && !checkingStoredSession) {
      SplashScreen.hideAsync().catch(() => {
        // Prevents app crashes if the splash screen is already hidden.
      });
    }
  }, [loadingUser, checkingStoredSession]);

  if (loadingUser || checkingStoredSession) {
    return null;
  }

  return (
    <ThemeProvider value={isDark ? CustomDarkTheme : CustomLightTheme}>
      <MessagesProvider
        enabled={!isPublicRoute && Boolean(user && token)}
        token={token}
        userId={user?.id}
      >
        <Stack
          screenOptions={({ route, navigation }) => {
            const isTabScreen = route.name === "(tabs)";

            const isSplashScreen = route.name === "signup/success";

            const isProfileScreen = route.name === "profile";

            return {
              headerShown: !isSplashScreen && !isTabScreen,

              header: !isSplashScreen
                ? () => (
                    <CustomHeader
                      title={route.name}
                      onBack={
                        navigation.canGoBack() ? navigation.goBack : undefined
                      }
                    />
                  )
                : undefined,

              gestureEnabled: !isTabScreen,

              animation: isProfileScreen
                ? "fade"
                : isSplashScreen
                  ? "fade"
                  : isTabScreen
                    ? "none"
                    : "default",

              gestureDirection: "horizontal",
            };
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="+not-found"
            options={{ title: "Page Not Found" }}
          />

          <Stack.Screen
            name="forgot-password"
            options={{ headerShown: false }}
          />

          <Stack.Screen name="signup/success" />
        </Stack>

        <StatusBar style={isDark ? "light" : "dark"} />

        {!shouldHideTabBar && visibleTabBar && (
          <Animated.View
            style={{
              opacity,
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <CustomTabBar isDark={isDark} />
          </Animated.View>
        )}

        {!isPublicRoute && (
          <>
            <BadgeRealtimeBridge token={token} userId={user?.id} />

            <ForegroundNotificationBanner />

            <BadgeUnlockedModal />
          </>
        )}
      </MessagesProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Oswald_200ExtraLight,
    Oswald_300Light,
    Oswald_400Regular,
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <FavoriteTeamsProvider>
          <ExploreWidgetsProvider>
            <BottomSheetModalProvider>
              <NotificationProvider>
                <AppLayout />
              </NotificationProvider>
            </BottomSheetModalProvider>
          </ExploreWidgetsProvider>
        </FavoriteTeamsProvider>
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}
