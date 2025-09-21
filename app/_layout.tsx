import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import ChatInputBar from "components/GameDetails/ChatInputBar";
import LiveChatBottomSheet from "components/GameDetails/LiveChat";
import FollowersModal from "components/Profile/FollowersModal";
import { PreferencesProvider } from "contexts/PreferencesContext";
import { useChatStore } from "store/chatStore";
import { useFollowersModalStore } from "store/followersModalStore";
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
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  View,
  useColorScheme,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import CustomTabBar from "../components/CustomTabBar";

// --------------------
// Custom themes
// --------------------
const CustomDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: "#1d1d1d",
    text: "#ffffff",
  },
};

const CustomLightTheme = {
  ...NavigationLightTheme,
  colors: {
    ...NavigationLightTheme.colors,
    background: "#ffffff",
    text: "#1d1d1d",
  },
};

// --------------------
// Routes where tab bar should be hidden
// --------------------
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
  "/comment-thread/",
];

export default function RootLayout() {
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Load fonts
  const [fontsLoaded] = useFonts({
    Oswald_200ExtraLight,
    Oswald_300Light,
    Oswald_400Regular,
    Oswald_500Medium,
    Oswald_600SemiBold,
    Oswald_700Bold,
  });

  // State for animations
  const opacity = useRef(new Animated.Value(1)).current;

  // Chat state from Zustand
  const { isOpen, gameId, closeChat } = useChatStore();
  const [input, setInput] = useState("");
  const [sendFn, setSendFn] = useState<((msg: string) => void) | null>(null);

  // Tab bar visibility
  const [visibleTabBar, setVisibleTabBar] = useState(true);

  const shouldHideTabBar = hiddenRoutes.some((r) =>
    pathname?.startsWith(r)
  );

  // Update tab bar visibility + close chat if navigating away
  useEffect(() => {
    if (!pathname) return;

    setVisibleTabBar(!shouldHideTabBar);

    if (!pathname.startsWith("/game/")) {
      closeChat();
    }
  }, [pathname, shouldHideTabBar, closeChat]);

  // Followers modal state from Zustand
  const { isVisible, type, targetUserId, closeModal, currentUserId } =
    useFollowersModalStore();

  // While fonts are loading
  if (!fontsLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isDark ? "#1d1d1d" : "#ffffff",
          }}
        >
          <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemeProvider value={isDark ? CustomDarkTheme : CustomLightTheme}>
          <PreferencesProvider>
            <Stack
              screenOptions={({ route, navigation }) => {
                const isTabScreen = route.name === "(tabs)";
                const isSplashScreen = route.name === "signup/success";
                const isProfileScreen = route.name === "profile";

                return {
                  headerShown: !isSplashScreen && !isTabScreen,
                  header: !isSplashScreen
                    ? () => (
                        <CustomHeaderTitle
                          title={route.name}
                          onBack={
                            navigation.canGoBack()
                              ? navigation.goBack
                              : undefined
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
              <Stack.Screen name="signup/success" />
            </Stack>

            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Tab Bar */}
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
                <CustomTabBar />
              </Animated.View>
            )}

            {/* Global Followers Modal */}
            <FollowersModal
              visible={isVisible}
              onClose={closeModal}
              type={type}
              currentUserId={currentUserId ?? ""}
              targetUserId={targetUserId ?? ""}
            />

            {/* Global Chat */}
            {gameId && isOpen && pathname?.startsWith("/game/") && (
              <>
                <LiveChatBottomSheet
                  gameId={gameId}
                  onChange={(index) => index === -1 && closeChat()}
                  onSend={(sendMessage) => setSendFn(() => sendMessage)}
                />

                <ChatInputBar
                  value={input}
                  onChange={setInput}
                  onSend={() => {
                    if (!input.trim() || !gameId) return;
                    if (sendFn) {
                      sendFn(input);
                      setInput("");
                    }
                  }}
                />
              </>
            )}
          </PreferencesProvider>
        </ThemeProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
