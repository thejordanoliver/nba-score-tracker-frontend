// components/Games/CombinedGamesList.tsx
import { Fonts } from "constants/fonts";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import type { Game as NFLGameType, NFLGame as RawNFLGame, NFLTeam, Game } from "types/nfl";
import type { Game as NBAGameType, summerGame } from "types/types";

import CombinedGamePreviewModal from "components/CombinedGamePreviewModal";

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
import SummerGameCard from "components/summer-league/SummerLeagueGameCard";
import SummerGameSquareCard from "components/summer-league/SummerGameSquareCard";
import SummerStackedGameCard from "components/summer-league/SummerLeagueStackedGameCard";

type SportsCategory = "NFL" | "NBA" | "Summer League";
type League = "NBA" | "NFL" | "SL";

type CombinedGamesSection =
  | { category: "NFL"; data: NFLGameType[] }
  | { category: "NBA"; data: NBAGameType[] }
  | { category: "Summer League"; data: summerGame[] };

type CombinedGame = NFLGameType | NBAGameType | summerGame;

type CombinedGamesListProps = {
  gamesByCategory: CombinedGamesSection[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  expectedCount?: number;
  day?: "todayTomorrow";
};

type NFLGameExtended = RawNFLGame & {
  league?: { id?: number; name?: string; season?: string; logo?: string };
};


export default function CombinedGamesList({
  gamesByCategory,
  loading,
  refreshing,
  onRefresh,
  expectedCount,
  day,
}: CombinedGamesListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

const [previewGame, setPreviewGame] = useState<CombinedGame | null>(null);
  const [previewCategory, setPreviewCategory] = useState<SportsCategory | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { viewMode } = usePreferences();

  const getItemId = (item: NFLGameType | NBAGameType | summerGame): string => {
  if ("game" in item) return String(item.game.id); // NFL
  return String(item.id); // NBA & Summer
};


 const handleLongPress = (game: CombinedGame, category: SportsCategory) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  setPreviewGame(game);
  setPreviewCategory(category);
  setModalVisible(true);
};


const transformNFLGame = (nflGame: NFLGameExtended): Game => ({
  game: {
    id: Number(nflGame.game.id),
    stage: "regular",
    week: "1",
    date: {
      timezone: "UTC",
      date: new Date(nflGame.game.date.timestamp * 1000)
        .toISOString()
        .split("T")[0],
      time: new Date(nflGame.game.date.timestamp * 1000)
        .toISOString()
        .split("T")[1]
        .slice(0, 5),
      timestamp: nflGame.game.date.timestamp,
    },
    venue: nflGame.game.venue || { name: "Unknown", city: "Unknown" },
    status: {
      short: nflGame.game.status.short,
      long: nflGame.game.status.long,
      timer: nflGame.game.status.timer ?? null,
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
    home: nflGame.scores.home || {},
    away: nflGame.scores.away || {},
  },
});

const renderGameCard = (item: CombinedGame, category: SportsCategory) => {
    const wrapper = (child: React.ReactNode) => (
      <LongPressGestureHandler
  key={getItemId(item)}
        minDurationMs={300}
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.ACTIVE) handleLongPress(item, category);
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
          {child}
        </View>
      </LongPressGestureHandler>
    );

 if (category === "NFL") {
  const nflGame = transformNFLGame(item as unknown as NFLGameExtended); // safe, because section is NFL
  if (viewMode === "list") return wrapper(<NFLGameCard game={nflGame} isDark={isDark} />);
  if (viewMode === "grid") return wrapper(<NFLGameSquareCard game={nflGame} isDark={isDark} />);
  return wrapper(<NFLStackedGameCard game={nflGame} isDark={isDark} />);
}


 if (category === "NBA") {
  const nbaGame = item as unknown as NBAGameType;
  if (viewMode === "list") return wrapper(<GameCard game={nbaGame} isDark={isDark} />);
  if (viewMode === "grid") return wrapper(<GameSquareCard game={nbaGame} isDark={isDark} />);
  return wrapper(<StackedGameCard game={nbaGame} isDark={isDark} />);
}

if (category === "Summer League") {
  const slGame = item as summerGame;
  if (viewMode === "list") return wrapper(<SummerGameCard game={slGame} isDark={isDark} />);
  if (viewMode === "grid") return wrapper(<SummerGameSquareCard game={slGame} isDark={isDark} />);
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
      case "Summer League":
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
      return (
        <View style={styles.skeletonGridWrapper}>
          {Array.from({ length: count }).map((_, idx) => (
            <GameSquareCardSkeleton key={idx} style={styles.gridItem} />
          ))}
        </View>
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
            <Text style={[styles.sectionHeader, { color: isDark ? "#fff" : "#000" }]}>
              {section.category}
            </Text>
            {renderSkeletons(skeletonCount)}
          </View>
        ))}
      </View>
    );
  }

  return (
    <>
<SectionList<CombinedGame, CombinedGamesSection>
        sections={gamesByCategory as SectionListData<CombinedGame, CombinedGamesSection>[]}
        keyExtractor={(item) => getItemId(item)}
        renderItem={({ item, section }) => renderGameCard(item, section.category)}
        renderSectionHeader={({ section: { category } }) => (
          <Text style={[styles.sectionHeader, { color: isDark ? "#fff" : "#000" }]}>
            {category}
          </Text>
        )}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.emptyText, { color: isDark ? "#aaa" : "#888" }]}>
              {day === "todayTomorrow"
                ? "No games found for today or tomorrow."
                : "No games found on this date."}
            </Text>
          </View>
        }
      />
      {modalVisible && previewGame && (
        <CombinedGamePreviewModal
          visible={modalVisible}
          game={previewGame}
          league={mapCategoryToLeague(previewCategory!)}
          onClose={() => setModalVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 18,
    fontFamily: Fonts.OSBOLD,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 12,
  },
  skeletonWrapper: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  skeletonGridWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 20,
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
  gridItem: { width: "48%" },
  stackedItem: { width: "100%" },
});