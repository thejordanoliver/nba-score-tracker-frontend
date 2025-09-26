import GameCardSkeleton from "components/Games/GameCardSkeleton";
import GameSquareCardSkeleton from "components/Games/GameSquareCardSkeleton";
import StackedGameCardSkeleton from "components/Games/StackedGameCardSkeleton";
import HeadingTwo from "components/Headings/HeadingTwo";
import NFLGamePreviewModal from "components/NFL/GamePreview/NFLGamePreviewModal";
import NFLGameCard from "components/NFL/Games/NFLGameCard";
import NFLGameSquareCard from "components/NFL/Games/NFLGameSquareCard";
import NFLStackedGameCard from "components/NFL/Games/NFLStackedGameCard";
import { Fonts } from "constants/fonts";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import { ViewStyle } from "react-native";

type Props = {
  games: any[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  error?: string | null;
  expectedCount?: number;
  day?: "todayTomorrow";
  showHeaders?: boolean;
};

type NFLGameSection = {
  title: string;
  data: any[];
};

export default function NFLGamesList({
  games,
  loading,
  refreshing,
  onRefresh,
  error,
  expectedCount,
  day,
  showHeaders,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { viewMode } = usePreferences();

  const [previewGame, setPreviewGame] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // --- Group games by seasonType ---
  const sections: NFLGameSection[] = useMemo(() => {
    const grouped: { [season: string]: any[] } = {};

    games.forEach((g) => {
      const dateStr = g.game?.date?.date;
      let season = "Unknown";

      if (dateStr) {
        const gameDate = new Date(dateStr);
        const month = gameDate.getMonth();
        const dayOfMonth = gameDate.getDate();

        if (month === 7) season = "Preseason";
        else if (
          (month >= 8 && month <= 11) ||
          (month === 0 && dayOfMonth <= 8)
        )
          season = "Regular Season";
      }

      if (!grouped[season]) grouped[season] = [];
      grouped[season].push(g);
    });

    if (!showHeaders) {
      return [{ title: "All", data: games }];
    }

    return ["Preseason", "Regular Season"]
      .filter((s) => grouped[s] && grouped[s].length > 0)
      .map((s) => ({ title: s, data: grouped[s] }));
  }, [games, showHeaders]);

  const handleLongPress = (game: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGame(game);
    setModalVisible(true);
  };

const renderGameCard = (game: any, index?: number) => {
  if ((game as any)?._isPlaceholder) {
    return <View style={[styles.gridItem, { backgroundColor: "transparent" }]} />;
  }

  const wrapper = (child: React.ReactNode, indexInRow?: number) => {
    // Apply marginLeft/marginRight for grid columns
    let gridStyle: ViewStyle = styles.gridItem;
    if (viewMode === "grid" && indexInRow !== undefined) {
      gridStyle = {
        ...styles.gridItem,
        marginLeft: indexInRow % 2 === 0 ? 12 : 6,
        marginRight: indexInRow % 2 === 0 ? 6 : 12,
      };
    }

    return (
      <LongPressGestureHandler
        key={game?.id ?? index}
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
      <View>
        <NFLGameCard game={game} isDark={isDark} />
      </View>
    );
  if (viewMode === "grid") return wrapper(<NFLGameSquareCard game={game} isDark={isDark} />, index);
  return wrapper(
    <View>
      <NFLStackedGameCard game={game} isDark={isDark} />
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

    // Add placeholder if odd count
    const dataWithPlaceholder =
      count % 2 === 1 ? [...skeletons, { _id: `grid-skel-placeholder` }] : skeletons;

    return (
      <FlatList
        data={dataWithPlaceholder}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={({ item, index }) => {
          if (item._id.includes("placeholder")) {
            return <View style={[styles.gridItem, { backgroundColor: "transparent" }]} />;
          }

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

// --- Inside the loading check ---
if (loading) {
  return (
    <View>
      {sections.map((section) => {
        const count = section.data.length > 0 ? section.data.length : expectedCount ?? 4;

        return (
          <View key={`skel-section-${section.title}`} style={{ marginBottom: 16 }}>
            {showHeaders && (
              <View style={styles.headerWrapper}>
                <HeadingTwo>{section.title}</HeadingTwo>
              </View>
            )}
            {renderSkeletons(count)}
          </View>
        );
      })}
    </View>
  );
}



  if (loading) {
    const totalSkeletonCount =
      games.length > 0 ? games.length : expectedCount ?? 4;
    return (
      <View>
        {sections.map((section) => (
          <View
            key={`skel-section-${section.title}`}
          >
            {showHeaders && (
              <View style={styles.headerWrapper}>
                <HeadingTwo>{section.title}</HeadingTwo>
              </View>
            )}
            {renderSkeletons(section.data.length || totalSkeletonCount)}
          </View>
        ))}
      </View>
    );
  }

  if (error) return <Text style={styles.emptyText}>Error: {error}</Text>;

  return (
    <>
      <SectionList<any, NFLGameSection>
        sections={sections as SectionListData<any, NFLGameSection>[]}
        keyExtractor={(item, index) => `${item?.game?.id ?? "game"}-${index}`}
        renderItem={({ item, index }) =>
          viewMode === "grid" ? null : renderGameCard(item, index)
        }
        renderSectionHeader={({ section }) =>
          showHeaders && section.data.length > 0 ? (
            <View style={styles.headerWrapper}>
              <HeadingTwo>{section.title}</HeadingTwo>
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.contentContainer}
        stickySectionHeadersEnabled={false}
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
        renderSectionFooter={({ section }) => {
          if (viewMode === "grid" && section.data.length > 0) {
            const dataWithPlaceholder =
              section.data.length % 2 === 1
                ? [...section.data, { _isPlaceholder: true } as any]
                : section.data;

            return (
              <FlatList
                data={dataWithPlaceholder}
                keyExtractor={(item, index) =>
                  (item as any)?._isPlaceholder
                    ? `placeholder-${index}`
                    : `game-${item?.game?.id ?? index}`
                }
                numColumns={2}
                renderItem={({ item, index }) => renderGameCard(item, index)}
                scrollEnabled={false}
                contentContainerStyle={styles.gridListContainer}
              />
            );
          }
          return null;
        }}
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
    paddingHorizontal: 12,
    gap: 12,
  },
  skeletonGridWrapper: {
    paddingBottom: 20,
    gap: 12,
  },
  gridListContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 12,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 100,
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
  listItem: {
    marginHorizontal: 12,
  },
  gridItem: {
    flex: 1,
    marginBottom: 12,
    marginHorizontal: 12, // ensures equal horizontal padding
  },
  stackedItem: {
    marginHorizontal: 12,
  },
  headerWrapper: {
    marginHorizontal: 12,
    marginBottom: 4,
  },
});
