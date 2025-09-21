import { Fonts } from "constants/fonts";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
// ✅ Import fallback image
import FallbackImage from "../../assets/Logos/ThumbnailFallback.png";

type NewsCardProps = {
  id: string;
  title: string;
  source: string;
  url: string;
  thumbnail?: string;
  publishedAt?: string;
  date?: string;
};

export default function NewsCard({
  title,
  source,
  url,
  thumbnail,
}: NewsCardProps) {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const styles = getStyles(isDark);

  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    router.push({
      pathname: "/news/article",
      params: { url, title, thumbnail },
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.card}>
        <Image
          source={imageError || !thumbnail ? FallbackImage : { uri: thumbnail }}
          onError={() => setImageError(true)}
          style={styles.thumbnail}
        />
        <View style={styles.details}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          <Text style={styles.source}>{source}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: "column",
      backgroundColor: isDark ? "#2e2e2e" : "#eee",
      paddingBottom: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#3a3a3a" : "#e6e6e6",
      overflow: "hidden",
    },
    thumbnail: {
      width: "100%",
      height: 300,
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
    source: {
      fontFamily: Fonts.OSREGULAR,
      fontSize: 12,
      color: isDark ? "#aaa" : "#888",
    },
  });
