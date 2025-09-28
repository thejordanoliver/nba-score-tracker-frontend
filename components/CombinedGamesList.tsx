// components/Games/CombinedGamesList.tsx
import CombinedGamePreviewModal from "components/CombinedGamePreviewModal";
import { Fonts } from "constants/fonts";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  SectionList,
  SectionListData,
  StyleSheet,
  useColorScheme,
  View,
  ViewStyle,
} from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import type { Game, Game as NFLGameType } from "types/nfl";
import type { Game as NBAGameType, summerGame } from "types/types";
import HeaderSkeleton from "./Headings/HeaderSkeleton"; // ✅ import
import HeadingTwo from "./Headings/HeadingTwo";
import NFLGamePreviewModal from "./NFL/GamePreview/NFLGamePreviewModal";
import GamePreviewModal from "./GamePreview/GamePreviewModal";
import SummerLeagueGamePreviewModal from "./summer-league/SummerLeagueGamePreviewModal";

// ✅ shared skeletons
import GameCardSkeleton from "components/Games/GameCardSkeleton";
import GameSquareCardSkeleton from "components/Games/GameSquareCardSkeleton";
import StackedGameCardSkeleton from "components/Games/StackedGameCardSkeleton";

// ✅ NFL cards
import NFLGameCard from "components/NFL/Games/NFLGameCard";
import NFLGameSquareCard from "components/NFL/Games/NFLGameSquareCard";
import NFLStackedGameCard from "components/NFL/Games/NFLStackedGameCard";

// ✅ NBA cards
import GameCard from "components/Games/GameCard";
import GameSquareCard from "components/Games/GameSquareCard";
import StackedGameCard from "components/Games/StackedGameCard";

// ✅ Summer League cards
import SummerGameSquareCard from "components/summer-league/SummerGameSquareCard";
import SummerGameCard from "components/summer-league/SummerLeagueGameCard";
import SummerStackedGameCard from "components/summer-league/SummerLeagueStackedGameCard";

type SportsCategory = "NFL" | "NBA" | "NBA Summer League";
type League = "NBA" | "NFL" | "SL";

type CombinedGamesSection =
  | { category: "NFL"; data: NFLGameType[] }
  | { category: "NBA"; data: NBAGameType[] }
  | { category: "NBA Summer League"; data: summerGame[] };

type CombinedGame = NFLGameType | NBAGameType | summerGame;

type CombinedGamesListProps = {
  gamesByCategory: CombinedGamesSection[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  expectedCount?: number;
  day?: "todayTomorrow";
  showHeaders?: boolean; // ✅ new prop
};

type NFLGameExtended = NFLGameType & {
  league?: { id?: number; name?: string; season?: string; logo?: string };
};

export default function CombinedGamesList({
  gamesByCategory,
  loading,
  refreshing,
  onRefresh,
  expectedCount,
  day,
  showHeaders = true, // ✅ default true
}: CombinedGamesListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [previewGame, setPreviewGame] = useState<CombinedGame | null>(null);
  const [previewCategory, setPreviewCategory] = useState<SportsCategory | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  const { viewMode } = usePreferences();

  const getItemId = (item: NFLGameType | NBAGameType | summerGame): string => {
    if ("game" in item) return String((item as NFLGameType).game.id);
    if ("id" in item) return String((item as NBAGameType | summerGame).id);
    return "unknown";
  };

  const handleLongPress = (game: CombinedGame, category: SportsCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGame(game);
    setPreviewCategory(category);
    setModalVisible(true);
  };

const transformNFLGame = (nflGame: NFLGameExtended): Game => {
  const gameId = String(nflGame.game?.id ?? "0");
  const gameDate = nflGame.game?.date?.date ?? "";
  const gameTime = nflGame.game?.date?.time ?? "";
  const timestamp = nflGame.game?.date?.timestamp ?? 0;

  console.log("NFL Game:", gameId, "Date:", gameDate, "Time:", gameTime, "Timestamp:", timestamp);

  return {
    game: {
      id: gameId,
      stage: nflGame.game?.stage ?? "regular",
      week: nflGame.game?.week ?? "1",
      date: {
        timezone: nflGame.game?.date?.timezone ?? "UTC",
        date: gameDate,
        time: gameTime,
        timestamp,
      },
      venue: nflGame.game?.venue || { name: "Unknown", city: "Unknown" },
      status: {
        short: nflGame.game?.status?.short ?? "",
        long: nflGame.game?.status?.long ?? "",
        timer: nflGame.game?.status?.timer ?? undefined,
      },
    },
    league: {
      id: Number(nflGame.league?.id ?? 0),
      name: nflGame.league?.name ?? "NFL",
      season: nflGame.league?.season ?? "2025",
      logo: nflGame.league?.logo ?? "",
    },
    teams: nflGame.teams,
    scores: {
      home: nflGame.scores?.home || {},
      away: nflGame.scores?.away || {},
    },
  };
};



  const renderGameCard = (
    item: CombinedGame,
    category: SportsCategory,
    index?: number,
    total?: number
  ) => {
    if ((item as any)?._isPlaceholder) {
      return (
        <View style={[styles.gridItem, { backgroundColor: "transparent" }]} />
      );
    }

    const wrapper = (child: React.ReactNode, indexInRow?: number) => {
      let itemStyle: ViewStyle =
        viewMode === "grid" ? styles.gridItem : styles.listItem;

      // grid-specific margins
      if (viewMode === "grid" && typeof indexInRow === "number") {
        const isLastOdd =
          typeof total === "number" &&
          total % 2 === 1 &&
          indexInRow === total - 1;

        if (isLastOdd) {
          // ✅ special style for last odd item
          itemStyle = {
            marginLeft: 12,
            flex: 0, // only span one column
          };
        } else {
          const isFirst = indexInRow % 2 === 0;
          itemStyle = {
            ...itemStyle,
            marginLeft: isFirst ? 12 : 6,
            marginRight: isFirst ? 6 : 12,
          };
        }
      }

      return (
        <LongPressGestureHandler
          key={getItemId(item)}
          minDurationMs={300}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === State.ACTIVE)
              handleLongPress(item, category);
          }}
        >
          <View style={itemStyle}>{child}</View>
        </LongPressGestureHandler>
      );
    };

    if (category === "NFL") {
      const nflGame = transformNFLGame(item as unknown as NFLGameExtended);
      if (viewMode === "list")
        return wrapper(<NFLGameCard game={nflGame} isDark={isDark} />);
      if (viewMode === "grid")
        return wrapper(
          <NFLGameSquareCard game={nflGame} isDark={isDark} />,
          index
        );
      return wrapper(<NFLStackedGameCard game={nflGame} isDark={isDark} />);
    }

    if (category === "NBA") {
      const nbaGame = item as NBAGameType;
      if (viewMode === "list")
        return wrapper(<GameCard game={nbaGame} isDark={isDark} />);
      if (viewMode === "grid")
        return wrapper(<GameSquareCard game={nbaGame} isDark={isDark} />, index);
      return wrapper(<StackedGameCard game={nbaGame} isDark={isDark} />);
    }

    if (category === "NBA Summer League") {
      const slGame = item as summerGame;
      if (viewMode === "list")
        return wrapper(<SummerGameCard game={slGame} isDark={isDark} />);
      if (viewMode === "grid")
        return wrapper(
          <SummerGameSquareCard game={slGame} isDark={isDark} />,
          index
        );
      return wrapper(<SummerStackedGameCard game={slGame} isDark={isDark} />);
    }

    return null;
  };

  const mapCategoryToLeague = (category: SportsCategory): League => {
    switch (category) {
      case "NBA":
        return "NBA";
      case "NFL":
        return "NFL";
      case "NBA Summer League":
        return "SL";
    }
  };

  const renderSkeletons = (count: number) => {
    if (viewMode === "list") {
      return (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: count }).map((_, idx) => (
            <GameCardSkeleton key={idx} />
          ))}
        </View>
      );
    }

    if (viewMode === "grid") {
      const dataWithPlaceholder =
        count % 2 === 1
          ? [...Array.from({ length: count }), { _isPlaceholder: true }]
          : Array.from({ length: count });

      return (
        <FlatList
          data={dataWithPlaceholder}
          keyExtractor={(_, idx) => `skeleton-${idx}`}
          numColumns={2}
          columnWrapperStyle={styles.skeletonGridRow}
          renderItem={({ item, index }) => {
            const isPlaceholder = (item as any)?._isPlaceholder;
            const marginLeft = index % 2 === 0 ? 12 : 6;
            const marginRight = index % 2 === 0 ? 6 : 12;

            return (
              <View
                key={index}
                style={[
                  styles.gridItem,
                  {
                    marginLeft,
                    marginRight,
                    backgroundColor: isPlaceholder ? "transparent" : undefined,
                  },
                ]}
              >
                {!isPlaceholder && <GameSquareCardSkeleton />}
              </View>
            );
          }}
          scrollEnabled={false}
          contentContainerStyle={styles.skeletonGridWrapper}
        />
      );
    }

    return (
      <View style={styles.skeletonWrapper}>
        {Array.from({ length: count }).map((_, idx) => (
          <StackedGameCardSkeleton key={idx} />
        ))}
      </View>
    );
  };

  if (loading) {
    const skeletonCount = expectedCount ?? 4;
    return (
      <View>
        {gamesByCategory.map((section, idx) => (
          <View key={idx}>
            {showHeaders && <HeaderSkeleton />}
            {renderSkeletons(skeletonCount)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <>
      <SectionList<CombinedGame, CombinedGamesSection>
        sections={
          gamesByCategory as SectionListData<
            CombinedGame,
            CombinedGamesSection
          >[]
        }
        keyExtractor={(item) => getItemId(item)}
        renderItem={({ item, section, index }) => {
          if (viewMode === "grid") return null;
          return renderGameCard(item, section.category, index, section.data.length);
        }}
        renderSectionHeader={({ section: { category, data } }) =>
          showHeaders && data.length > 0 ? (
            <View style={{ marginHorizontal: 12 }}>
              <HeadingTwo>{category}</HeadingTwo>
            </View>
          ) : null
        }
        contentContainerStyle={[styles.contentContainer]}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() =>
          viewMode !== "grid" ? <View style={{ height: 12 }} /> : null
        }
        renderSectionFooter={({ section }) => {
          if (viewMode === "grid" && section.data.length > 0) {
            return (
           <FlatList<CombinedGame>
  data={section.data as CombinedGame[]}
  keyExtractor={(item, index) => getItemId(item) ?? `idx-${index}`}
  numColumns={2}
  columnWrapperStyle={styles.gridRow}
  renderItem={({ item, index }) =>
    renderGameCard(item, section.category, index, section.data.length)
  }
  scrollEnabled={false}
  contentContainerStyle={styles.gridListContainer}
/>

            );
          }
          return null;
        }}
      />

     {modalVisible && previewGame && previewCategory === "NFL" && (
  <NFLGamePreviewModal
    visible={modalVisible}
    game={previewGame as NFLGameType}
    onClose={() => setModalVisible(false)}
  />
)}

{modalVisible && previewGame && previewCategory === "NBA" && (
  <GamePreviewModal
    visible={modalVisible}
    game={previewGame as NBAGameType}
    onClose={() => setModalVisible(false)}
  />
)}

{modalVisible && previewGame && previewCategory === "NBA Summer League" && (
  <SummerLeagueGamePreviewModal
    visible={modalVisible}
    game={previewGame as summerGame}
    onClose={() => setModalVisible(false)}
  />
)}

    </>
  );
}

const styles = StyleSheet.create({
  skeletonWrapper: {
    paddingBottom: 20,
    gap: 12,
    marginHorizontal: 12,
  },
  skeletonGridWrapper: {
    paddingBottom: 20,
    gap: 12,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  skeletonGridRow: {
    justifyContent: "space-between",
  },
  gridItem: {
    flex: 1,
  },
  listItem: {
    marginHorizontal: 12,
  },
  gridListContainer: {
    paddingBottom: 100,
  },
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 20,
    fontFamily: Fonts.OSLIGHT,
  },
});
