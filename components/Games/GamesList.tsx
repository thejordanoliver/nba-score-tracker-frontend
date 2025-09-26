import GamePreviewModal from "components/GamePreview/GamePreviewModal";
import GameCard from "components/Games/GameCard";
import GameCardSkeleton from "components/Games/GameCardSkeleton";
import GameSquareCard from "components/Games/GameSquareCard";
import GameSquareCardSkeleton from "components/Games/GameSquareCardSkeleton";
import StackedGameCard from "components/Games/StackedGameCard";
import StackedGameCardSkeleton from "components/Games/StackedGameCardSkeleton";
import { Fonts } from "constants/fonts";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import type { Game } from "types/types";

type GamesListProps = {
  games: Game[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  expectedCount?: number;
  day?: "todayTomorrow";
};

export default function GamesList({
  games,
  loading,
  refreshing,
  onRefresh,
  expectedCount,
  day,
}: GamesListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { viewMode } = usePreferences();

  const [previewGame, setPreviewGame] = useState<Game | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleLongPress = (game: Game) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGame(game);
    setModalVisible(true);
  };

  const renderGameCard = (game: Game, index?: number) => {
    if ((game as any)?._isPlaceholder) {
      return (
        <View style={[styles.gridItem, { backgroundColor: "transparent" }]} />
      );
    }

    const wrapper = (child: React.ReactNode, indexInRow?: number) => {
      let gridStyle: ViewStyle = {};

      if (viewMode === "grid" && indexInRow !== undefined) {
        gridStyle = {
          flex: 1,
          marginLeft: indexInRow % 2 === 0 ? 12 : 6,
          marginRight: indexInRow % 2 === 0 ? 6 : 12,
        };
      }

      return (
        <LongPressGestureHandler
          key={game.id}
          minDurationMs={300}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === State.ACTIVE) handleLongPress(game);
          }}
        >
          <View style={gridStyle}>{child}</View>
        </LongPressGestureHandler>
      );
    };

    if (viewMode === "list")
      return wrapper(
        <View style={{ marginBottom: 12 }}>
          <GameCard game={game} isDark={isDark} />
        </View>
      );
    if (viewMode === "grid")
      return wrapper(<GameSquareCard game={game} isDark={isDark} />, index);
    return wrapper(
      <View style={{ marginBottom: 12 }}>
        <StackedGameCard game={game} isDark={isDark} />
      </View>
    );
  };

  const renderSkeletons = (count: number) => {
    if (viewMode === "list") {
      return (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: count }).map((_, i) => (
            <GameCardSkeleton key={`list-skel-${i}`} />
          ))}
        </View>
      );
    }

    if (viewMode === "grid") {
      const skeletons = Array.from({ length: count }).map((_, i) => ({
        _id: `grid-skel-${i}`,
      }));

      return (
        <FlatList
          data={skeletons}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item, index }) => {
            const isLastOdd = count % 2 === 1 && index === count - 1;

            const itemStyle: ViewStyle = {
              flex: 1,
              marginLeft: isLastOdd ? 12 : index % 2 === 0 ? 12 : 6,
              marginRight: isLastOdd ? 12 : index % 2 === 0 ? 6 : 12,
            };

            return <GameSquareCardSkeleton key={item._id} style={itemStyle} />;
          }}
          scrollEnabled={false}
          contentContainerStyle={styles.skeletonGridWrapper}
        />
      );
    }

    return (
      <View style={styles.skeletonWrapper}>
        {Array.from({ length: count }).map((_, i) => (
          <StackedGameCardSkeleton key={`stack-skel-${i}`} />
        ))}
      </View>
    );
  };

  if (loading) {
    const count = games.length > 0 ? games.length : expectedCount ?? 4;
    return renderSkeletons(count);
  }

  if (!loading && games.length === 0) {
    return (
      <View>
        <Text style={[styles.emptyText, { color: isDark ? "#aaa" : "#888" }]}>
          {day === "todayTomorrow"
            ? "No games found for today or tomorrow."
            : "No games found on this date."}
        </Text>
      </View>
    );
  }

  if (viewMode === "grid") {
    // Add placeholder for odd count
    const dataWithPlaceholder =
      games.length % 2 === 1
        ? [...games, { _isPlaceholder: true } as any]
        : games;

    return (
      <>
        <FlatList
          data={dataWithPlaceholder}
          keyExtractor={(item, index) =>
            (item as any)?._isPlaceholder
              ? `placeholder-${index}`
              : `game-${item.id}`
          }
          numColumns={2}
          renderItem={({ item, index }) => renderGameCard(item, index)}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.gridListContainer}
          showsVerticalScrollIndicator={false}
        />
        {modalVisible && previewGame && (
          <GamePreviewModal
            game={previewGame}
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
          />
        )}
      </>
    );
  }

  // list + stacked
  return (
    <>
      <FlatList
        data={games}
        keyExtractor={(item) => `game-${item.id}`}
        renderItem={({ item, index }) => renderGameCard(item, index)}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
      {modalVisible && previewGame && (
        <GamePreviewModal
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
