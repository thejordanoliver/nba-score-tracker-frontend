import CountdownClock from "@/components/CountdownClock";
import FootballGamePreviewModal from "@/components/Sports/Football/GamePreview/FootballGamePreviewModal";
import FootballGameCard from "@/components/Sports/Football/Games/FootballGameCard";
import FootballSquareGameCard from "@/components/Sports/Football/Games/FootballSquareGameCard";
import { FootballGame } from "@/types/football/football";
import HeadingTwo from "components/Headings/HeadingTwo";
import GameCardSkeleton from "components/Skeletons/GameCards/GameCardSkeleton";
import HeaderSkeleton from "components/Skeletons/HeaderSkeleton";
import SquareGameCardSkeleton from "components/Skeletons/GameCards/SquareGameCardSkeleton";
import StackedGameCardSkeleton from "components/Skeletons/GameCards/StackedGameCardSkeleton";
import { globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo, useState } from "react";
import {
  SectionList,
  SectionListData,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import { footballGamesListStyle } from "styles/GamecardStyles/FootballGamesListStyles";
import FootballStackedGameCard from "./FootballStackedGameCard";

type Props = {
  games: FootballGame[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  error?: string | null;
  expectedCount?: number;
  day?: "todayTomorrow";
  showHeaders?: boolean;
  scrollEnabled?: boolean; // ✅ new prop
  isNFL?: boolean;
  isCFB?: boolean;
  showCountdown?: boolean;
  countdownGame?: FootballGame | null;
  teamLogo?: any;
  teamName?: string;
  teamColor?: string;
  teamSecondaryColor?: string;
};

type FootballGameSection = {
  title: string;
  data: FootballGame[];
};

export default function GamesList({
  games,
  loading,
  refreshing,
  onRefresh,
  error,
  expectedCount,
  day,
  showHeaders,
  scrollEnabled,
  isNFL = false,
  isCFB = false,
  showCountdown = false,
  countdownGame = null,
  teamLogo,
  teamName,
  teamColor,
  teamSecondaryColor,
}: Props) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";
  const styles = footballGamesListStyle;
  const global = globalStyles(isDark);
  const { viewMode } = usePreferences();
  const [previewGame, setPreviewGame] = useState<FootballGame | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  const chunkIntoRows = (
    data: FootballGame[],
    size = 2,
  ): (FootballGame | null)[][] => {
    const rows: (FootballGame | null)[][] = [];

    for (let i = 0; i < data.length; i += size) {
      const row: (FootballGame | null)[] = data.slice(i, i + size);

      if (row.length < size) {
        row.push(null);
      }

      rows.push(row);
    }

    return rows;
  };

  const paginatedGames = useMemo(() => {
    return games.slice(0, page * PAGE_SIZE);
  }, [games, page]);

  // Build sections AFTER pagination
  const sections: FootballGameSection[] = useMemo(() => {
    if (!showHeaders) {
      return [{ title: "All", data: paginatedGames }];
    }

    const preseasonGames = paginatedGames.filter(
      (game) => game?.season.slug === "pre-season",
    );
    const postseasonGames = paginatedGames.filter(
      (game) => game?.season.slug === "post-season",
    );

    const regularSeasonGames = paginatedGames.filter(
      (game) => game?.season.slug === "regular-season",
    );

    const builtSections: FootballGameSection[] = [];

    if (preseasonGames.length > 0) {
      builtSections.push({
        title: "Pre Season",
        data: preseasonGames,
      });
    }

    if (regularSeasonGames.length > 0) {
      builtSections.push({
        title: "Regular Season",
        data: regularSeasonGames,
      });
    }

    if (postseasonGames.length > 0) {
      builtSections.push({
        title: "Postseason",
        data: postseasonGames,
      });
    }

    return builtSections;
  }, [paginatedGames, showHeaders]);

  const gridSections = useMemo(() => {
    return sections.map((section) => ({
      title: section.title,
      data: chunkIntoRows(section.data),
    }));
  }, [sections]);

  const renderGridRow = ({ item }: { item: (FootballGame | null)[] }) => {
    return (
      <View style={styles.gridRow}>
        {item.map((game, index) => {
          if (!game) {
            return <View key={`empty-${index}`} style={styles.gridItem} />;
          }

          return (
            <View key={game.id} style={styles.gridItem}>
              <FootballSquareGameCard game={game} isNFL={isNFL} isCFB={isCFB} />
            </View>
          );
        })}
      </View>
    );
  };

  const loadMore = () => {
    if (paginatedGames.length >= games.length) return;
    setPage((prev) => prev + 1);
  };

  const handleLongPress = (game: FootballGame) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewGame(game);
    setModalVisible(true);
  };

  const renderGameCard = (game: FootballGame, index?: number) => {
    const wrapper = (child: React.ReactNode, indexInRow?: number) => {
      let wrapperStyle: ViewStyle = {};

      // ✅ ONLY apply grid styles in grid mode
      if (viewMode === "grid" && indexInRow !== undefined) {
        wrapperStyle = {
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
          <View style={wrapperStyle}>{child}</View>
        </LongPressGestureHandler>
      );
    };

    if (viewMode === "list")
      return wrapper(
        <View>
          <FootballGameCard game={game} isNFL={isNFL} isCFB={isCFB} />
        </View>,
      );
    if (viewMode === "grid")
      return wrapper(
        <FootballSquareGameCard game={game} isNFL={isNFL} isCFB={isCFB} />,
        index,
      );
    return wrapper(
      <View>
        <FootballStackedGameCard game={game} isNFL={isNFL} isCFB={isCFB} />
      </View>,
    );
  };

  const renderSkeletons = useCallback(
    (count: number) => {
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
        const pairs: number[][] = [];
        for (let i = 0; i < count; i += 2) {
          pairs.push(i + 1 < count ? [i, i + 1] : [i]);
        }

        return (
          <View style={styles.skeletonGridWrapper}>
            {pairs.map((pair, rowIndex) => (
              <View key={`skel-row-${rowIndex}`} style={styles.gridRow}>
                <SquareGameCardSkeleton style={{ flex: 1 }} />
                {pair.length === 2 ? (
                  <SquareGameCardSkeleton style={{ flex: 1 }} />
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            ))}
          </View>
        );
      }

      return (
        <View style={styles.skeletonWrapper}>
          {Array.from({ length: count }).map((_, i) => (
            <StackedGameCardSkeleton key={`stack-skel-${i}`} />
          ))}
        </View>
      );
    },
    [viewMode, styles],
  );

  if (loading) {
    const totalSkeletonCount = expectedCount ?? 4;

    // When we already have games, preserve their real season sections.
    if (sections.length > 0) {
      return (
        <View>
          {showCountdown && countdownGame && (
            <CountdownClock
              game={countdownGame}
              loading
              teamLogo={teamLogo}
              teamName={teamName}
              teamColor={teamColor}
              teamSecondaryColor={teamSecondaryColor}
            />
          )}

          {sections.map((section, sectionIndex) => (
            <View
              key={`skel-section-${section.title}`}
              style={{ marginTop: sectionIndex > 0 ? 12 : 0 }}
            >
              {showHeaders && <HeaderSkeleton style={styles.headerSkeleton} />}

              {renderSkeletons(section.data.length)}
            </View>
          ))}
        </View>
      );
    }

    // Initial load: games/sections do not exist yet,
    // so always render a fallback set of skeletons.
    return (
      <View>
        {showCountdown && countdownGame && (
          <CountdownClock
            game={countdownGame}
            loading
            teamLogo={teamLogo}
            teamName={teamName}
            teamColor={teamColor}
            teamSecondaryColor={teamSecondaryColor}
          />
        )}

        {showHeaders && <HeaderSkeleton style={styles.headerSkeleton} />}

        {renderSkeletons(totalSkeletonCount)}
      </View>
    );
  }
  
  if (error) return <Text style={global.errorText}>Error: {error}</Text>;

  return (
    <>
      {viewMode === "grid" ? (
        <SectionList
          sections={gridSections}
          keyExtractor={(item, index) => `row-${index}`}
          renderItem={renderGridRow}
          ListHeaderComponent={
            showHeaders && showCountdown && countdownGame ? (
              <CountdownClock
                game={countdownGame}
                loading={loading}
                teamLogo={teamLogo}
                teamName={teamName}
                teamColor={teamColor}
                teamSecondaryColor={teamSecondaryColor}
              />
            ) : null
          }
          renderSectionHeader={({ section }) =>
            showHeaders ? (
              <HeadingTwo isDark={isDark}>{section.title}</HeadingTwo>
            ) : null
          }
          stickySectionHeadersEnabled={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          scrollEnabled={scrollEnabled ?? true}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.gridListContainer}
          ListEmptyComponent={
            <View style={global.emptyContainer}>
              <Text style={global.emptyTitle}>No kickoffs on the schedule...</Text>
              <Text style={global.emptyText}>
                The next drive is just downfield.
              </Text>
            </View>
          }
        />
      ) : (
        <SectionList
          sections={
            sections as SectionListData<FootballGame, FootballGameSection>[]
          }
          keyExtractor={(item, index) => `${item.id ?? "game"}-${index}`}
          renderItem={({ item, index }) => renderGameCard(item, index)}
          ListHeaderComponent={
            showHeaders && showCountdown && countdownGame ? (
              <CountdownClock
                game={countdownGame}
                loading={loading}
                teamLogo={teamLogo}
                teamName={teamName}
                teamColor={teamColor}
                teamSecondaryColor={teamSecondaryColor}
              />
            ) : null
          }
          renderSectionHeader={({ section }) => {
            if (!showHeaders) return null;

            const sectionIndex = gridSections.findIndex(
              (s) => s.title === section.title,
            );

            return (
              <View style={{ marginTop: sectionIndex > 0 ? 12 : 0 }}>
                <HeadingTwo isDark={isDark}>{section.title}</HeadingTwo>
              </View>
            );
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.contentContainer}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          scrollEnabled={scrollEnabled ?? true}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            paginatedGames.length < games.length ? (
              <View style={{ paddingVertical: 20 }}>
                <GameCardSkeleton />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={global.emptyContainer}>
              <Text style={global.emptyTitle}>
                {day === "todayTomorrow"
                  ? "No kickoffs on the schedule today."
                  : "No football was played on this date."}
              </Text>
              <Text style={global.emptyText}>
                The next drive is just downfield.
              </Text>
            </View>
          }
        />
      )}

      {modalVisible && previewGame && (
        <FootballGamePreviewModal
          game={previewGame}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          isNFL={isNFL}
          isCFB={isCFB}
        />
      )}
    </>
  );
}
