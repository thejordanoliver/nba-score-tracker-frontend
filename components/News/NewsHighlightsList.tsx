// components/NewsHighlightsList.tsx
import { Fonts } from "constants/fonts";
import React from "react";
import { FlatList, Text, useColorScheme, View } from "react-native";
import HighlightCard from "./HighlightCard";
import NewsCard from "./NewsCard";
import NewsCardSkeleton from "./NewsCardSkeleton";
type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  thumbnail?: string;
  publishedAt?: string;
};

type HighlightItem = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  channelName?: string;
  duration?: string;
};

type CombinedItem =
  | (NewsItem & { itemType: "news" })
  | (HighlightItem & { itemType: "highlight" });

type NewsHighlightsListProps = {
  items: CombinedItem[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

const NewsHighlightsList: React.FC<NewsHighlightsListProps> = ({
  items,
  loading,
  refreshing,
  onRefresh,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (loading) {
    return (
      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
      >
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) =>
        item.itemType === "news" ? item.id : item.videoId
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollEnabled={false} // ✅ Disable scrolling
      contentContainerStyle={{
        paddingBottom: 100,
        paddingHorizontal: 12,
        gap: 12,
      }}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) =>
        item.itemType === "news" ? (
          <NewsCard
            id={item.id}
            title={item.title}
            source={item.source}
            url={item.url}
            thumbnail={item.thumbnail}
          />
        ) : (
          <HighlightCard
            videoId={item.videoId}
            title={item.title}
            publishedAt={item.publishedAt}
            thumbnail={item.thumbnail}
            channelName={item.channelName} // <-- now this is defined
            duration={item.duration} // <-- add this line
          />
        )
      }
      ListEmptyComponent={
        <Text
          style={{
            fontFamily: Fonts.OSLIGHT,
            fontSize: 16,
            textAlign: "center",
            marginTop: 20,
            color: isDark ? "#aaa" : "#888",
          }}
        >
          No news or highlights found.
        </Text>
      }
    />
  );
};

export default NewsHighlightsList;
