import HeadingTwo from "@/components/Headings/HeadingTwo";
import GameCardSkeleton from "components/Skeletons/GameCards/GameCardSkeleton";
import SquareGameCardSkeleton from "components/Skeletons/GameCards/SquareGameCardSkeleton";
import StackedGameCardSkeleton from "components/Skeletons/GameCards/StackedGameCardSkeleton";
import { globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";
import { useCallback, useMemo } from "react";
import { FlatList, SectionList, Text, View } from "react-native";
import { gameListStyles } from "styles/GamecardStyles/GameListStyles";
import type { TennisMatch } from "types/tennis/tennis";
import TennisGameCard from "./TennisGameCard";

type Props = {
  matches: TennisMatch[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  error: Error | null;
  scrollEnabled?: boolean;
};

type MatchSection = {
  title: string;
  tournamentId: string;
  data: TennisMatch[];
};

export default function TennisGamesList({
  matches,
  loading,
  refreshing,
  onRefresh,
  error,
  scrollEnabled = true,
}: Props) {
  const { viewMode, resolvedColorScheme } = usePreferences();

  const isDark = resolvedColorScheme === "dark";

  const global = globalStyles(isDark);
  const styles = gameListStyles;

  const sections = useMemo<MatchSection[]>(() => {
    const sectionMap = new Map<string, MatchSection>();

    matches.forEach((match) => {
      const tournamentId = String(match.tournamentId ?? "unknown");

      const existing = sectionMap.get(tournamentId);

      if (existing) {
        existing.data.push(match);
        return;
      }

      sectionMap.set(tournamentId, {
        tournamentId,
        title: match.tournamentName || "Tennis",
        data: [match],
      });
    });

    return Array.from(sectionMap.values());
  }, [matches]);

  const renderGameCard = useCallback((match: TennisMatch) => {
    return <TennisGameCard match={match} />;
  }, []);

  const keyExtractor = useCallback((item: TennisMatch, index: number) => {
    return `${item.id ?? "tennis-match"}-${index}`;
  }, []);

  if (loading && matches.length === 0) {
    const Skeleton =
      viewMode === "grid"
        ? SquareGameCardSkeleton
        : viewMode === "stacked"
          ? StackedGameCardSkeleton
          : GameCardSkeleton;

    return (
      <View style={styles.skeletonWrapper}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`tennis-skeleton-${index}`} />
        ))}
      </View>
    );
  }

  if (error && matches.length === 0) {
    return (
      <View style={global.emptyContainer}>
        <Text selectable style={global.errorText}>
          Unable to load tennis matches.
        </Text>

        <Text selectable style={global.emptySubText}>
          Pull down to try again.
        </Text>
      </View>
    );
  }

  if (!matches.length) {
    return (
      <View style={global.emptyContainer}>
        <Text selectable style={global.emptyTitle}>
          No matches on court today.
        </Text>

        <Text selectable style={global.emptyText}>
          Comeback later to see the next serve.
        </Text>
      </View>
    );
  }

  if (viewMode === "grid") {
    return (
      <FlatList
        key="tennis-grid"
        data={matches}
        keyExtractor={keyExtractor}
        numColumns={2}
        renderItem={({ item }) => renderGameCard(item)}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridListContainer}
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <SectionList<TennisMatch, MatchSection>
      key={`tennis-${viewMode}`}
      sections={sections}
      keyExtractor={keyExtractor}
      renderSectionHeader={({ section }) => (
        <HeadingTwo isDark>{section.title}</HeadingTwo>
      )}
      renderSectionFooter={() => <View style={{ height: 24 }} />}
      renderItem={({ item }) => renderGameCard(item)}
      refreshing={refreshing}
      onRefresh={onRefresh}
      stickySectionHeadersEnabled={false}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
    />
  );
}
