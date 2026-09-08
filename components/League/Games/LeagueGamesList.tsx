import BasketballGameCard from "@/components/Sports/Basketball/Games/BasketballGameCard";
import BasketballSquareGameCard from "@/components/Sports/Basketball/Games/BasketballSquareGameCard";
import BasketballStackedGameCard from "@/components/Sports/Basketball/Games/BasketballStackedGameCard";
import FootballGameCard from "@/components/Sports/Football/Games/FootballGameCard";
import FootballStackedGameCard from "@/components/Sports/Football/Games/FootballStackedGameCard";
import NHLStackedGameCard from "@/components/Sports/Hockey/Games/HockeyStackedGameCard";
import type { HomeLeagueId } from "@/constants/leagues";
import type { BaseballGame } from "@/types/baseball/baseball";
import type { BasketballGame } from "@/types/basketball/basketball";
import type { FootballGame } from "@/types/football/football";
import type { HockeyGame } from "@/types/hockey/hockey";
import type { HomeGameItem, HomeGameSection } from "@/types/leagues";
import type { SoccerGame } from "@/types/soccer/soccer";
import type { TennisMatch } from "@/types/tennis/tennis";
import GameCardSkeleton from "components/Skeletons/GameCards/GameCardSkeleton";
import StackedGameCardSkeleton from "components/Skeletons/GameCards/StackedGameCardSkeleton";
import BaseballGamePreviewModal from "components/Sports/Baseball/GamePreview/BaseballGamePreviewModal";
import BaseballGameCard from "components/Sports/Baseball/Games/BaseballGameCard";
import BaseballSquareGameCard from "components/Sports/Baseball/Games/BaseballSquareGameCard";
import BaseballStackedGameCard from "components/Sports/Baseball/Games/BaseballStackedGameCard";
import * as Haptics from "expo-haptics";
import { useMemo, useState, type ReactNode } from "react";
import { FlatList, SectionList, View, type ViewStyle } from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import { leagueGamesListStyles } from "styles/GamecardStyles/LeagueGamesListStyles";
import type { MMAFight } from "types/mma/mma";

import TennisGameCard from "@/components/Sports/Tennis/Games/TennisGameCard";
import HeadingTwo from "../../Headings/HeadingTwo";
import SquareGameCardSkeleton from "../../Skeletons/GameCards/SquareGameCardSkeleton";
import HeaderSkeleton from "../../Skeletons/HeaderSkeleton";
import BasketballGamePreviewModal from "../../Sports/Basketball/GamePreview/BasketballGamePreviewModal";
import FootballGamePreviewModal from "../../Sports/Football/GamePreview/FootballGamePreviewModal";
import FootballSquareGameCard from "../../Sports/Football/Games/FootballSquareGameCard";
import NHLGamePreviewModal from "../../Sports/Hockey/GamePreview/HockeyGamePreviewModal";
import NHLGameCard from "../../Sports/Hockey/Games/HockeyGameCard";
import NHLGameSquareCard from "../../Sports/Hockey/Games/HockeySqaureGameCard";
import MMAGamePreviewModal from "../../Sports/MMA/GamePreview/MMAGamePreviewModal";
import MMAGameCard from "../../Sports/MMA/Games/MMAGameCard";
import MMASquareGameCard from "../../Sports/MMA/Games/MMASquareGameCard";
import MMAStackedGameCard from "../../Sports/MMA/Games/MMAStackedGameCard";
import SoccerGamePreviewModal from "../../Sports/Soccer/GamePreview/SoccerGamePreviewModal";
import SoccerGameCard from "../../Sports/Soccer/Games/SoccerGameCard";
import SoccerSquareGameCard from "../../Sports/Soccer/Games/SoccerSquareGameCard";
import SoccerStackedGameCard from "../../Sports/Soccer/Games/SoccerStackedGameCard";
import TennisMatchPreviewModal from "../../Sports/Tennis/GamePreview/TennisMatchPreviewModal";
import ChampionshipGameCard from "./ChampionshipGameCard";

const BASKETBALL_LEAGUES = new Set<HomeLeagueId>([
  "nba",
  "cbb",
  "wcbb",
  "wnba",
]);
const FOOTBALL_LEAGUES = new Set<HomeLeagueId>(["nfl", "cfb", "ufl"]);
const SOCCER_LEAGUES = new Set<HomeLeagueId>([
  "mls",
  "fifa",
  "bundesliga",
  "champions",
  "europa",
  "leaguescup",
  "epl",
]);

type LeagueGamesListProps = {
  sections: HomeGameSection[];
  loading: boolean;
  expectedCount?: number;
  showHeaders?: boolean;
  isDark: boolean;
  viewMode: "list" | "grid" | "stacked";
};

const isChampionshipGame = (item: HomeGameItem): boolean => {
  const headline =
    "headline" in item.game ? String(item.game.headline ?? "") : "";
  return (
    headline.includes("NBA Finals") ||
    headline.includes("Finals") ||
    headline.includes("Championship") ||
    headline.includes("Final")
  );
};

export default function LeagueGamesList({
  sections,
  loading,
  expectedCount,
  showHeaders = true,
  viewMode,
  isDark,
}: LeagueGamesListProps) {
  const styles = leagueGamesListStyles(isDark);
  const [previewItem, setPreviewItem] = useState<HomeGameItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Separate championship games from regular games
  const { championshipGames, regularSections } = useMemo(() => {
    const champs: HomeGameItem[] = [];
    const regular: HomeGameSection[] = [];

    for (const section of sections) {
      const regularInSection: HomeGameItem[] = [];

      for (const item of section.data) {
        if (isChampionshipGame(item)) {
          champs.push(item);
        } else {
          regularInSection.push(item);
        }
      }

      if (regularInSection.length > 0) {
        regular.push({
          ...section,
          data: regularInSection,
        });
      }
    }

    return {
      championshipGames: champs,
      regularSections: regular,
    };
  }, [sections]);

  const handleLongPress = (item: HomeGameItem) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewItem(item);
    setModalVisible(true);
  };

  const renderGameCard = (
    item: HomeGameItem,
    index?: number,
    total?: number,
  ) => {
    const wrapper = (child: ReactNode, indexInRow?: number) => {
      let itemStyle: ViewStyle =
        viewMode === "grid" ? styles.gridItem : styles.listItem;

      if (viewMode === "grid" && typeof indexInRow === "number") {
        const isLastOdd =
          typeof total === "number" &&
          total % 2 === 1 &&
          indexInRow === total - 1;

        if (isLastOdd) {
          itemStyle = { marginLeft: 12, marginRight: 12, flex: 0.49 };
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
          key={item.key}
          minDurationMs={300}
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state === State.ACTIVE) handleLongPress(item);
          }}
        >
          <View style={itemStyle}>{child}</View>
        </LongPressGestureHandler>
      );
    };

    switch (item.league) {
      case "nba": {
        const game = item.game as BasketballGame;
        if (viewMode === "list")
          return wrapper(<BasketballGameCard game={game} />);
        if (viewMode === "grid")
          return wrapper(<BasketballSquareGameCard game={game} />, index);
        return wrapper(<BasketballStackedGameCard game={game} />);
      }

      case "cbb": {
        const game = item.game as BasketballGame;
        if (viewMode === "list")
          return wrapper(<BasketballGameCard game={game} isCBB />);
        if (viewMode === "grid")
          return wrapper(<BasketballSquareGameCard game={game} isCBB />, index);
        return wrapper(<BasketballStackedGameCard game={game} isCBB />);
      }

      case "wcbb": {
        const game = item.game as BasketballGame;
        if (viewMode === "list")
          return wrapper(<BasketballGameCard game={game} isWCBB />);
        if (viewMode === "grid")
          return wrapper(
            <BasketballSquareGameCard game={game} isWCBB />,
            index,
          );
        return wrapper(<BasketballStackedGameCard game={game} isWCBB />);
      }

      case "wnba": {
        const game = item.game as BasketballGame;
        if (viewMode === "list")
          return wrapper(<BasketballGameCard game={game} isWNBA />);
        if (viewMode === "grid")
          return wrapper(
            <BasketballSquareGameCard game={game} isWNBA />,
            index,
          );
        return wrapper(<BasketballStackedGameCard game={game} isWNBA />);
      }

      case "nfl": {
        const game = item.game as FootballGame;
        if (viewMode === "list")
          return wrapper(<FootballGameCard game={game} isNFL />);
        if (viewMode === "grid")
          return wrapper(<FootballSquareGameCard game={game} isNFL />, index);
        return wrapper(<FootballStackedGameCard game={game} isNFL />);
      }

      case "cfb": {
        const game = item.game as FootballGame;
        if (viewMode === "list")
          return wrapper(<FootballGameCard game={game} isCFB />);
        if (viewMode === "grid")
          return wrapper(<FootballSquareGameCard game={game} isCFB />, index);
        return wrapper(<FootballStackedGameCard game={game} isCFB />);
      }

      case "ufl": {
        const game = item.game as FootballGame;
        if (viewMode === "list")
          return wrapper(<FootballGameCard game={game} />);
        if (viewMode === "grid")
          return wrapper(<FootballSquareGameCard game={game} />, index);
        return wrapper(<FootballStackedGameCard game={game} />);
      }

      case "mlb": {
        const game = item.game as BaseballGame;
        if (viewMode === "list")
          return wrapper(<BaseballGameCard game={game} isMLB />);
        if (viewMode === "grid")
          return wrapper(<BaseballSquareGameCard game={game} isMLB />, index);
        return wrapper(<BaseballStackedGameCard game={game} isMLB />);
      }

      case "nhl": {
        const game = item.game as HockeyGame;
        if (viewMode === "list")
          return wrapper(<NHLGameCard game={game} isNHL isMCH={false} />);
        if (viewMode === "grid")
          return wrapper(
            <NHLGameSquareCard game={game} isNHL isMCH={false} />,
            index,
          );
        return wrapper(<NHLStackedGameCard game={game} isNHL isMCH={false} />);
      }

      case "mls":
      case "fifa":
      case "bundesliga":
      case "champions":
      case "europa":
      case "leaguescup":
      case "epl": {
        const game = item.game as SoccerGame;
        if (viewMode === "list") return wrapper(<SoccerGameCard game={game} />);
        if (viewMode === "grid")
          return wrapper(<SoccerSquareGameCard game={game} />, index);
        return wrapper(<SoccerStackedGameCard game={game} />);
      }

      case "ufc": {
        const game = item.game as MMAFight;
        if (viewMode === "list") return wrapper(<MMAGameCard game={game} />);
        if (viewMode === "grid")
          return wrapper(<MMASquareGameCard game={game} />, index);
        return wrapper(<MMAStackedGameCard game={game} />);
      }

      case "atp":
      case "wta": {
        const match = item.game as TennisMatch;
        return wrapper(<TennisGameCard match={match} />, index);
      }
    }
  };

  const renderSkeletons = (count: number) => {
    if (viewMode === "list") {
      return (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: count }).map((_, index) => (
            <GameCardSkeleton key={index} />
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
          keyExtractor={(_, index) => `skeleton-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.skeletonGridRow}
          renderItem={({ item, index }) => {
            const isPlaceholder =
              typeof item === "object" &&
              item !== null &&
              "_isPlaceholder" in item;
            const marginLeft = index % 2 === 0 ? 12 : 6;
            const marginRight = index % 2 === 0 ? 6 : 12;

            return (
              <View
                style={[
                  styles.gridItem,
                  {
                    marginLeft,
                    marginRight,
                  },
                ]}
              >
                {!isPlaceholder && <SquareGameCardSkeleton />}
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
        {Array.from({ length: count }).map((_, index) => (
          <StackedGameCardSkeleton key={index} />
        ))}
      </View>
    );
  };

  if (loading) {
    const skeletonCount = expectedCount ?? 4;

    return (
      <View style={styles.contentContainer}>
        {sections.map((section) => (
          <View key={section.id}>
            {showHeaders && (
              <View style={styles.headerSkeleton}>
                <HeaderSkeleton />
              </View>
            )}
            {renderSkeletons(skeletonCount)}
          </View>
        ))}
      </View>
    );
  }

  const visibleSections = regularSections.filter(
    (section) => section.data.length > 0,
  );
  const previewLeague = previewItem?.league;
  const previewGame = previewItem?.game;

  return (
    <>
      {/* Championship Games Section */}
      {championshipGames.length > 0 && (
        <View style={{ marginTop: 4, marginBottom: 4 }}>
          {championshipGames.map((game) => (
            <LongPressGestureHandler
              key={game.key}
              minDurationMs={300}
              onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.ACTIVE) handleLongPress(game);
              }}
            >
              <View>
                {game.league && BASKETBALL_LEAGUES.has(game.league) && (
                  <ChampionshipGameCard
                    game={game.game as BasketballGame}
                    isCBB={game.league === "cbb"}
                    isWCBB={game.league === "wcbb"}
                    isWNBA={game.league === "wnba"}
                    isSL={false}
                    isGLEAGUE={false}
                  />
                )}
                {game.league === "nfl" ||
                  (game.league === "cfb" && (
                    <ChampionshipGameCard
                      game={game.game}
                      isCBB={false}
                      isWCBB={false}
                      isWNBA={false}
                      isSL={false}
                      isGLEAGUE={false}
                    />
                  ))}
                {game.league === "mlb" && (
                  <ChampionshipGameCard
                    game={game.game}
                    isCBB={false}
                    isWCBB={false}
                    isWNBA={false}
                    isSL={false}
                    isGLEAGUE={false}
                    isNHL={true}
                  />
                )}
              </View>
            </LongPressGestureHandler>
          ))}
        </View>
      )}

      {/* Regular Games Section */}
      <SectionList<HomeGameItem, HomeGameSection>
        sections={visibleSections}
        keyExtractor={(item) => item.key}
        renderItem={({ item, section, index }) => {
          if (viewMode === "grid") return null;

          return renderGameCard(item, index, section.data.length);
        }}
        renderSectionHeader={({ section }) => {
          if (!showHeaders) return null;

          const multipleSections = visibleSections.length > 1;
          const isFirstSection = visibleSections[0]?.id === section.id;

          return (
            <View
              style={{
                marginHorizontal: 12,
                marginTop: multipleSections && !isFirstSection ? 8 : 0,
              }}
            >
              <HeadingTwo isDark={isDark}>{section.title}</HeadingTwo>
            </View>
          );
        }}
        contentContainerStyle={styles.contentContainer}
        stickySectionHeadersEnabled={false}
        scrollEnabled={false}
        ItemSeparatorComponent={() =>
          viewMode !== "grid" ? (
            <View style={styles.itemSeparatorComponent} />
          ) : null
        }
        renderSectionFooter={({ section }) => {
          if (viewMode === "grid") {
            return (
              <View style={{ marginBottom: 16 }}>
                <FlatList
                  data={section.data}
                  keyExtractor={(item) => item.key}
                  numColumns={2}
                  columnWrapperStyle={styles.gridRow}
                  renderItem={({ item, index }) =>
                    renderGameCard(item, index, section.data.length)
                  }
                  scrollEnabled={false}
                  contentContainerStyle={styles.gridListContainer}
                />
              </View>
            );
          }

          return <View style={{ height: 16 }} />;
        }}
      />

      {modalVisible &&
        previewGame &&
        previewLeague &&
        FOOTBALL_LEAGUES.has(previewLeague) && (
          <FootballGamePreviewModal
            visible={modalVisible}
            game={previewGame as FootballGame}
            onClose={() => setModalVisible(false)}
            isNFL={previewLeague === "nfl"}
            isCFB={previewLeague === "cfb"}
          />
        )}

      {modalVisible && previewGame && previewLeague === "mlb" && (
        <BaseballGamePreviewModal
          visible={modalVisible}
          game={previewGame as BaseballGame}
          onClose={() => setModalVisible(false)}
          isMLB
          isCB={false}
          isSB={false}
        />
      )}

      {modalVisible && previewGame && previewLeague === "nhl" && (
        <NHLGamePreviewModal
          visible={modalVisible}
          game={previewGame as HockeyGame}
          onClose={() => setModalVisible(false)}
          isNHL
          isMCH={false}
        />
      )}

      {modalVisible &&
        previewGame &&
        previewLeague &&
        SOCCER_LEAGUES.has(previewLeague) && (
          <SoccerGamePreviewModal
            visible={modalVisible}
            game={previewGame as SoccerGame}
            onClose={() => setModalVisible(false)}
          />
        )}

      {modalVisible &&
        previewGame &&
        previewLeague &&
        BASKETBALL_LEAGUES.has(previewLeague) && (
          <BasketballGamePreviewModal
            visible={modalVisible}
            game={previewGame as BasketballGame}
            isCBB={previewLeague === "cbb"}
            isWCBB={previewLeague === "wcbb"}
            isWNBA={previewLeague === "wnba"}
            isSL={false}
            isGLEAGUE={false}
            onClose={() => setModalVisible(false)}
          />
        )}

      {modalVisible && previewGame && previewLeague === "ufc" && (
        <MMAGamePreviewModal
          visible={modalVisible}
          game={previewGame as MMAFight}
          onClose={() => setModalVisible(false)}
        />
      )}

      {modalVisible &&
        previewGame &&
        (previewLeague === "atp" || previewLeague === "wta") && (
          <TennisMatchPreviewModal
            visible={modalVisible}
            match={previewGame as TennisMatch}
            onClose={() => setModalVisible(false)}
          />
        )}
    </>
  );
}
