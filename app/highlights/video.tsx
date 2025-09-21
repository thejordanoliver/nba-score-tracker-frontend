import { CustomHeaderTitle } from "components/CustomHeaderTitle";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { goBack } from "expo-router/build/global-state/routing";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import HighlightCard from "../../components/News/HighlightCard";
import { useHighlights } from "../../hooks/useHighlights";

const OSEXTRALIGHT = "Oswald_200ExtraLight";
const OSLIGHT = "Oswald_300Light";
const OSREGULAR = "Oswald_400Regular";
const OSMEDIUM = "Oswald_500Medium";
const OSSEMIBOLD = "Oswald_600SemiBold";
const OSBOLD = "Oswald_700Bold";

export default function HighlightVideoScreen() {
  const { videoId: initialVideoId, title: initialTitle } =
    useLocalSearchParams<{
      videoId: string;
      title: string;
    }>();

  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);
  const router = useRouter();
  const navigation = useNavigation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const playerRef = useRef<any>(null);

  const {
    highlights,
    loading: highlightsLoading,
    error: highlightsError,
  } = useHighlights(
    "NBA dunks OR game winners OR buzzer beaters OR crossovers OR trending",
    10
  );

  const queue = React.useMemo(
    () => highlights.filter((item) => item.videoId !== initialVideoId),
    [highlights, initialVideoId]
  );

  const currentVideo =
    currentIndex === 0
      ? { videoId: initialVideoId, title: initialTitle }
      : queue[currentIndex - 1]; // Because initial video is index 0

  const handleVideoEnd = useCallback(() => {
    if (currentIndex < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, queue.length]);

  if (!initialVideoId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No video ID provided.</Text>
      </View>
    );
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeaderTitle
          title=""
          tabName=""
          isTeamScreen={false}
          onBack={goBack}
        />
      ),
    });
  }, [navigation, isDark]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.title}>{currentVideo.title}</Text>

      <View style={styles.videoContainer}>
        <YoutubePlayer
          ref={playerRef}
          height={230}
          play={true}
          videoId={currentVideo.videoId}
          onChangeState={(
            state:
              | "playing"
              | "paused"
              | "ended"
              | "buffering"
              | "unstarted"
              | "video-cued"
          ) => {
            if (state === "ended") handleVideoEnd();
          }}
          webViewProps={{
            injectedJavaScript: `
      var style = document.createElement('style');
      style.innerHTML = '.ytp-large-play-button { display: none !important; }';
      document.head.appendChild(style);
      true;
    `,
          }}
          initialPlayerParams={{
            controls: 1, // hide player controls
            modestbranding: 1, // minimal YouTube branding
            rel: 0, // don't show related videos
            fs: 1, // disable fullscreen button
            showinfo: 0, // hide video title
            autoplay: true, // auto-play video
          }}
        />
      </View>

      <Text style={styles.subheading}>Up Next</Text>

      {highlightsLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : highlightsError ? (
        <Text style={styles.errorText}>{highlightsError}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {queue.map((item) => (
            <View key={item.videoId} style={{ width: 240, marginRight: 12 }}>
              <HighlightCard
                videoId={item.videoId}
                title={item.title}
                thumbnail={item.thumbnail}
                publishedAt={item.publishedAt}
                thumbnailHeight={200} // smaller for Up Next
              />
            </View>
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#1d1d1d" : "#fff",
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontFamily: OSBOLD,
      marginBottom: 12,
      color: isDark ? "#fff" : "#000",
    },
    subheading: {
      fontSize: 24,
      fontFamily: OSMEDIUM,
      marginBottom: 8,
      marginTop: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#444" : "#ccc",
      color: isDark ? "#fff" : "#1d1d1d",
    },
    videoContainer: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: isDark ? "#000" : "#fff", // ✅ prevent WebView bleed-through
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      fontSize: 16,
      color: "red",
      marginTop: 20,
    },
  });
