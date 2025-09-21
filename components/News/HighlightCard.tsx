import { useRouter } from "expo-router";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Fonts } from "constants/fonts";
import { BlurView } from "expo-blur";

type HighlightCardProps = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  channelName?: string;
  thumbnailHeight?: number;
  duration?: string;
};

export function formatDuration(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0)
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function HighlightCard({
  videoId,
  title,
  publishedAt,
  thumbnail,
  channelName,
  thumbnailHeight = 300,
  duration,
}: HighlightCardProps) {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark, thumbnailHeight);

  const handlePress = () => {
    router.push({
      pathname: "/highlights/video",
      params: { videoId, title },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.card}>
        <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        {duration && (
          <BlurView
            intensity={100}
            tint={"systemUltraThinMaterial"}
            style={styles.timeContainer}
          >
            <Text style={styles.time}>{formatDuration(Number(duration))}</Text>
          </BlurView>
        )}
        <View style={styles.details}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          <View style={styles.subtitle}>
            <Text style={styles.date}>{channelName}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (isDark: boolean, thumbnailHeight: number) =>
  StyleSheet.create({
    card: {
      flexDirection: "column",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      paddingBottom: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#3a3a3a" : "#e6e6e6",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    },
    thumbnail: {
      width: "100%",
      height: thumbnailHeight,
      resizeMode: "cover",
    },
    details: {
      paddingHorizontal: 12,
      marginTop: 8,
    },
    title: {
      fontFamily: Fonts.OSBOLD,
      fontSize: 16,
      marginBottom: 4,
      color: isDark ? "#fff" : "#1d1d1d",
    },
    date: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#aaa" : "#666",
    },
    timeContainer: {
      position: "absolute",
      top: 20,
      right: 12,
      borderRadius: 4,
      overflow: "hidden",
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    time: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 14,
      color: "#fff"
    },
    subtitle: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "space-between",
    },
  });
