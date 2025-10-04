import { Fonts } from "constants/fonts";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, useColorScheme, View } from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import type { summerGame } from "../../types/types";
import GameCardSkeleton from "../Games/GameCardSkeleton";
import GameSquareCardSkeleton from "../Games/GameSquareCardSkeleton"; // Import your square skeleton
import SummerLeagueGameSquareCard from "./SummerGameSquareCard";
import SummerLeagueGameCard from "./SummerLeagueGameCard";
import SummerLeagueGamePreviewModal from "./SummerLeagueGamePreviewModal";
import SummerLeagueStackedGameCard from "./SummerLeagueStackedGameCard";

type Props = {
  games: summerGame[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  expectedCount?: number;
  scrollEnabled?: boolean; // new prop
};

const SummerGamesList: React.FC<Props> = ({
  games,
  loading,
  refreshing,
  onRefresh,
  expectedCount,
  scrollEnabled = true, // default to true
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [previewGame, setPreviewGame] = useState<summerGame | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { viewMode } = usePreferences();

  const handleLongPress = (game: summerGame) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGame(game);
    setModalVisible(true);
  };

  const renderGameCard = (item: summerGame) => (
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
          <SummerLeagueGameCard game={item} isDark={isDark} />
        ) : viewMode === "grid" ? (
          <SummerLeagueGameSquareCard game={item} isDark={isDark} />
        ) : (
          <SummerLeagueStackedGameCard game={item} isDark={isDark} />
        )}
      </View>
    </LongPressGestureHandler>
  );

  if (loading) {
    const skeletonCount = games.length > 0 ? games.length : expectedCount ?? 4;
    return (
      <View style={styles.skeletonWrapper}>
        {Array.from({ length: skeletonCount }).map((_, index) =>
          viewMode === "list" ? (
            <GameCardSkeleton key={index} />
          ) : (
            <GameSquareCardSkeleton key={index} />
          )
        )}
      </View>
    );
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
        scrollEnabled={scrollEnabled} // <--- added here
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: isDark ? "#aaa" : "#888" }]}>
            No games found for this date.
          </Text>
        }
      />

      {modalVisible && previewGame && (
        <SummerLeagueGamePreviewModal
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
    paddingBottom: 100,
    paddingHorizontal: 12,
    gap: 12,
  },
  skeletonGridWrapper: {
    paddingBottom: 20,
  },
  gridListContainer: {
    paddingBottom: 100,
    gap: 12,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 100,
    paddingHorizontal: 12,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 20,
    fontFamily: Fonts.OSLIGHT,
  },
  gridItem: {
    flex: 1,
    marginLeft: 14,
  },
  stackedItem: {
    marginHorizontal: 12,
  },
});

export default SummerGamesList;
