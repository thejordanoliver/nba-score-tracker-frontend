import { Fonts } from "constants/fonts";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, useColorScheme, View } from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import type { Game } from "../../types/types";
import GamePreviewModal from "../GamePreview/GamePreviewModal";
import GameCard from "./GameCard";
import GameCardSkeleton from "./GameCardSkeleton";
import GameSquareCard from "./GameSquareCard";
import GameSquareCardSkeleton from "./GameSquareCardSkeleton";
import StackedGameCard from "./StackedGameCard";
import StackedGameCardSkeleton from "./StackedGameCardSkeleton";
type GamesListProps = {
  games: Game[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  expectedCount?: number;
  day?: "todayTomorrow";
};

const GamesList: React.FC<GamesListProps> = ({
  games,
  loading,
  refreshing,
  onRefresh,
  expectedCount,
  day,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [previewGame, setPreviewGame] = useState<Game | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { viewMode } = usePreferences(); // global view mode

  const handleLongPress = (game: Game) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGame(game);
    setModalVisible(true);
  };

  const renderGameCard = (item: Game) => (
    <LongPressGestureHandler
      key={item.id}
      minDurationMs={300}
      onHandlerStateChange={({ nativeEvent }) => {
        if (nativeEvent.state === State.ACTIVE) handleLongPress(item);
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
          <GameCard game={item} isDark={isDark} />
        ) : viewMode === "grid" ? (
          <GameSquareCard game={item} isDark={isDark} />
        ) : (
          <StackedGameCard game={item} isDark={isDark} />
        )}
      </View>
    </LongPressGestureHandler>
  );

  if (loading) {
    const skeletonCount = games.length > 0 ? games.length : expectedCount ?? 4;

    if (viewMode === "list") {
      return (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <GameCardSkeleton key={index} />
          ))}
        </View>
      );
    } else if (viewMode === "grid") {
      return (
        <View style={styles.skeletonGridWrapper}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <GameSquareCardSkeleton key={index} style={styles.gridItem} />
          ))}
        </View>
      );
    } else {
      return (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <StackedGameCardSkeleton key={index} />
          ))}
        </View>
      );
    }
  }

  return (
    <>
      <FlatList
        data={games}
        keyExtractor={(item) => item.id.toString()}
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
                ? "No games found for today or tomorrow."
                : "No games found on this date."}
            </Text>
          </View>
        }
      />
      {modalVisible && previewGame && (
        <GamePreviewModal
          visible={modalVisible}
          game={previewGame}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
};

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
    width: "100%", // full width for stacked layout
  },
});

export default GamesList;
