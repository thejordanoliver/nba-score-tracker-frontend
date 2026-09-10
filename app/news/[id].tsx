import AppVideo from "@/components/AppVideo";
import { CustomHeader } from "@/components/CustomHeader";
import { Ionicons } from "@expo/vector-icons";
import NewsArticleSkeleton from "components/Skeletons/NewsArticleSkeleton";
import { Colors, globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useArticle } from "hooks/NewsHooks/useArticle";
import { useLayoutEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { newsArticleStyles } from "styles/NewsStyles/NewsArticleStyle";

export default function ArticleScreen() {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const { width } = useWindowDimensions();
  const styles = newsArticleStyles(isDark, width);
  const global = globalStyles(isDark);
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const newsId = Array.isArray(id) ? id[0] : id;
  const { article, loading, error } = useArticle(newsId);

  const headline = article?.headline;
  const source = article?.byline || article?.source;

  const thumbnail = article?.images?.[0];
  const firstVideo = article?.videos?.[0];

  const videoThumbnail = firstVideo?.thumbnail || thumbnail?.url || null;
  const videoUrl = firstVideo?.url;
  const hasVideo = typeof videoUrl === "string" && videoUrl.length > 0;
  const isMedia = article?.type === "Media" || article?.type === "Preview";
  const story = article?.story;
  const description = article?.description;
  const duration = firstVideo?.duration ?? 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const formattedSeconds = String(seconds).padStart(2, "0");
  const videoTime = firstVideo ? `${minutes}:${formattedSeconds}` : "";

  const publishedDate = article?.published ? new Date(article.published) : null;
  const timeAgo = publishedDate
    ? formatDistanceToNow(publishedDate, { addSuffix: true })
    : "";
  const formattedDate = publishedDate
    ? publishedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlay = async () => {
    setHasPlayed(true);
    setIsPlaying(true);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <CustomHeader title="" onBack={() => navigation.goBack?.()} />
      ),
    });
  }, [navigation]);

  if (loading) return <NewsArticleSkeleton />;

  if (error)
    return (
      <View style={global.emptyContainer}>
        <Text style={global.errorText}>Failed to load article</Text>
      </View>
    );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{headline}</Text>

      {hasVideo && videoUrl ? (
        <View style={styles.image}>
          {hasPlayed ? (
            <AppVideo
              uri={videoUrl}
              style={styles.image}
              contentFit="contain"
              autoPlay={isPlaying}
              nativeControls
              onPlayingChange={setIsPlaying}
              onEnd={() => {
                setIsPlaying(false);
                setHasPlayed(false);
              }}
            />
          ) : videoThumbnail ? (
            <Pressable style={styles.image} onPress={handlePlay}>
              <Image source={{ uri: videoThumbnail }} style={styles.image} />
              <View
                style={{
                  ...StyleSheet.absoluteFill,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.3)",
                }}
              >
                <Ionicons name="play-circle" size={64} color="white" />
              </View>
            </Pressable>
          ) : null}
        </View>
      ) : thumbnail?.url ? (
        <Image style={styles.image} source={{ uri: thumbnail.url }} />
      ) : null}
      <View style={styles.descriptionContainer}>
        {videoTime && isMedia && (
          <View style={styles.timeContainer}>
            <Ionicons
              name="time-outline"
              size={20}
              color={isDark ? Colors.white : Colors.black}
            />
            <Text style={styles.description}>{videoTime}</Text>
          </View>
        )}
        {description && <Text style={styles.description}>{description}</Text>}
        {source && <Text style={styles.source}>{source}</Text>}
        <View style={styles.publishContainer}>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.date}>{timeAgo}</Text>
        </View>
      </View>

      {story && <Text style={styles.content}>{story}</Text>}
    </ScrollView>
  );
}
