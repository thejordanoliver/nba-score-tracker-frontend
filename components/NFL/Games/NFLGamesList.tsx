import GameCardSkeleton from "components/Games/GameCardSkeleton";
import GameSquareCardSkeleton from "components/Games/GameSquareCardSkeleton";
import StackedGameCardSkeleton from "components/Games/StackedGameCardSkeleton";
import NFLGamePreviewModal from "components/NFL/GamePreview/NFLGamePreviewModal";
import NFLGameCard from "components/NFL/Games/NFLGameCard";
import NFLGameSquareCard from "components/NFL/Games/NFLGameSquareCard";
import NFLStackedGameCard from "components/NFL/Games/NFLStackedGameCard";
import { Fonts } from "constants/fonts";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, useColorScheme, View } from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import HeadingTwo from "components/Headings/HeadingTwo";

type Props = {
  games: any[]; // Team games
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  error?: string | null;
  expectedCount?: number;
  day?: "todayTomorrow";
  showHeaders?: boolean; // NEW: whether to show season headers
};

export default function NFLGamesList({
  games,
  loading,
  refreshing,
  onRefresh,
  error,
  expectedCount,
  day, showHeaders
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { viewMode } = usePreferences();

  const [previewGame, setPreviewGame] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- Group games by seasonType ---
const flattenedGames = useMemo(() => {
  const grouped: { [season: string]: any[] } = {};

  games.forEach((g) => {
    const dateStr = g.game?.date?.date;
    let season = "Unknown";

    if (dateStr) {
      const gameDate = new Date(dateStr);
      const month = gameDate.getMonth();
      const day = gameDate.getDate();

      if (month === 7) season = "Preseason";
      else if ((month >= 8 && month <= 11) || (month === 0 && day <= 8))
        season = "Regular Season";
    }

    if (!grouped[season]) grouped[season] = [];
    grouped[season].push(g);
  });

  // Only show headers if showHeaders is true
  if (!showHeaders) {
    // Flatten without headers
    return games.map((g) => ({ type: "game", game: g }));
  }

  const flat: any[] = [];
  ["Preseason", "Regular Season"].forEach((season) => {
    if (grouped[season]) {
      flat.push({ type: "header", title: season });
      grouped[season].forEach((game) => flat.push({ type: "game", game }));
    }
  });

  return flat;
}, [games, showHeaders]);


  const handleLongPress = (game: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGame(game);
    setModalVisible(true);
  };

  const renderGameCard = (item: any) => {
    if (item.type === "header") {
      return (
        <View style={{ marginTop: 8, }}>
          <HeadingTwo
          >
            {item.title}
          </HeadingTwo>
        </View>
      );
    }

    return (
      <LongPressGestureHandler
        key={item?.game?.id}
        minDurationMs={300}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) handleLongPress(item.game);
        }}
      >
        <View
          style={
            viewMode === "grid"
              ? styles.gridItem
              : viewMode === "stacked"
                ? styles.stackedItem
                : undefined
          }
        >
          {viewMode === "list" ? (
            <NFLGameCard game={item.game} isDark={isDark} />
          ) : viewMode === "grid" ? (
            <NFLGameSquareCard game={item.game} isDark={isDark} />
          ) : (
            <NFLStackedGameCard game={item.game} isDark={isDark} />
          )}
        </View>
      </LongPressGestureHandler>
    );
  };

  if (loading) {
    const skeletonCount =
      games.length > 0 ? games.length : (expectedCount ?? 4);
    return viewMode === "list" ? (
      <View style={styles.skeletonWrapper}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <GameCardSkeleton key={i} />
        ))}
      </View>
    ) : viewMode === "grid" ? (
      <View style={styles.skeletonGridWrapper}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <GameSquareCardSkeleton key={i} style={styles.gridItem} />
        ))}
      </View>
    ) : (
      <View style={styles.skeletonWrapper}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <StackedGameCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error) return <Text style={styles.emptyText}>Error: {error}</Text>;

  return (
    <>
      <FlatList
        data={flattenedGames}
        keyExtractor={(item, index) =>
          item.type === "header"
            ? `header-${item.title}`
            : `game-${item.game.game.id}-${index}`
        }
        renderItem={({ item }) => renderGameCard(item)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        numColumns={viewMode === "grid" ? 2 : 1}
        key={viewMode}
        columnWrapperStyle={
          viewMode === "grid" ? { justifyContent: "space-between" } : undefined
        }
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ marginTop: 10 }}>
            <Text
              style={[styles.emptyText, { color: isDark ? "#aaa" : "#888" }]}
            >
              {day === "todayTomorrow"
                ? "No NFL games found for today or tomorrow."
                : "No NFL games found."}
            </Text>
          </View>
        }
      />
      {modalVisible && previewGame && (
        <NFLGamePreviewModal
          game={previewGame}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  skeletonWrapper: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  skeletonGridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 100,
    gap: 12,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 100,
    paddingHorizontal: 12,
    gap: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 20,
    fontFamily: Fonts.OSLIGHT,
  },
  gridItem: {
    width: "48%",
  },
  stackedItem: {
    width: "100%",
  },
});
