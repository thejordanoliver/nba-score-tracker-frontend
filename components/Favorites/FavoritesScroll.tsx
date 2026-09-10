import { Ionicons } from "@expo/vector-icons";
import FavoritesScrollSkeleton from "components/Skeletons/FavoritesScrollSkeleton";
import { LEAGUE_CONFIG } from "constants/leagues";
import { Colors } from "constants/styles";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import * as Haptics from "expo-haptics";
import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import DraggableFlatList, {
  type DragEndParams,
  type DraggableFlatListProps,
  type RenderItemParams,
} from "react-native-draggable-flatlist";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  FAVORITES_RAIL_CELL_WIDTH,
  FAVORITES_RAIL_HORIZONTAL_PADDING,
  FavoritesScrollStyles,
} from "styles/HomeStyles/FavoritesScrollStyles";
import type {
  FavoriteItem,
  FavoriteLeagueItem,
  FavoriteTeamItem,
} from "types/favorites";
import {
  isFavoriteLeague,
  reorderFavoriteRailItems,
  splitFavoriteRailOrder,
} from "types/favorites";
import {
  getFavoriteBaseTeam,
  getFavoriteTeamRoute,
} from "utils/favoriteTeams";
import { FavoritesTab } from "./FavoritesTab";

type Props = {
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
  isDark: boolean;
};

type FavoriteSection = FavoriteItem["kind"];

type FavoriteRailOrder = {
  userId: number | null;
  sectionKeys: Record<FavoriteSection, string[]>;
};

const createRailOrder = (userId: number | null): FavoriteRailOrder => ({
  userId,
  sectionKeys: {
    league: [],
    team: [],
  },
});

const FAVORITES_SNAP_ANIMATION = {
  damping: 24,
  stiffness: 320,
  mass: 0.3,
  overshootClamping: true,
  restDisplacementThreshold: 0.25,
  restSpeedThreshold: 2,
};

const FAVORITE_NAVIGATION_LOCK_MS = 750;

type FavoriteDragAnimationValues = Parameters<
  NonNullable<DraggableFlatListProps<FavoriteItem>["onAnimValInit"]>
>[0];

type FavoriteDragBoundaryProps = {
  animationValues: FavoriteDragAnimationValues;
  itemCount: number;
  sportCount: number;
};

function FavoriteDragBoundary({
  animationValues,
  itemCount,
  sportCount,
}: FavoriteDragBoundaryProps) {
  const {
    activeCellSize,
    activeIndexAnim,
    autoScrollDistance,
    spacerIndexAnim,
    touchTranslate,
  } = animationValues;

  useAnimatedReaction(
    () => ({
      activeIndex: activeIndexAnim.value,
      translatedDistance:
        touchTranslate.value + autoScrollDistance.value,
    }),
    ({ activeIndex, translatedDistance }) => {
      if (activeIndex < 0) {
        return;
      }

      const draggingSport = activeIndex < sportCount;
      const minimumIndex = draggingSport ? 0 : sportCount;
      const maximumIndex = draggingSport ? sportCount - 1 : itemCount - 1;
      const minimumTranslation =
        (minimumIndex - activeIndex) * activeCellSize.value;
      const maximumTranslation =
        (maximumIndex - activeIndex) * activeCellSize.value;
      const boundedTranslation = Math.min(
        maximumTranslation,
        Math.max(minimumTranslation, translatedDistance),
      );

      if (spacerIndexAnim.value < minimumIndex) {
        spacerIndexAnim.value = minimumIndex;
      } else if (spacerIndexAnim.value > maximumIndex) {
        spacerIndexAnim.value = maximumIndex;
      }

      if (boundedTranslation !== translatedDistance) {
        touchTranslate.value =
          boundedTranslation - autoScrollDistance.value;
      }
    },
    [itemCount, sportCount],
  );

  return null;
}

type FavoriteSectionDividerProps = {
  animationValues: FavoriteDragAnimationValues;
  sportCount: number;
  style: StyleProp<ViewStyle>;
};

function FavoriteSectionDivider({
  animationValues,
  sportCount,
  style,
}: FavoriteSectionDividerProps) {
  const dividerContentPosition =
    FAVORITES_RAIL_HORIZONTAL_PADDING +
    sportCount * FAVORITES_RAIL_CELL_WIDTH;
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -animationValues.scrollOffset.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[style, { left: dividerContentPosition }, animatedStyle]}
    />
  );
}

function orderFavoriteItems<T extends FavoriteItem>(
  items: readonly T[],
  orderedKeys: readonly string[],
): T[] {
  const itemsByKey = new Map(items.map((item) => [item.key, item]));
  const orderedItems: T[] = [];

  for (const key of orderedKeys) {
    const item = itemsByKey.get(key);

    if (item) {
      orderedItems.push(item);
      itemsByKey.delete(key);
    }
  }

  return [...orderedItems, ...itemsByKey.values()];
}

export default function FavoritesScroll({
  onInteractionStart,
  onInteractionEnd,
  isDark,
}: Props) {
  const router = useRouter();
  const styles = useMemo(() => FavoritesScrollStyles(isDark), [isDark]);

  const latestReorderIdRef = useRef<Record<FavoriteSection, number>>({
    league: 0,
    team: 0,
  });
  const reorderQueueRef = useRef<Record<FavoriteSection, Promise<void>>>({
    league: Promise.resolve(),
    team: Promise.resolve(),
  });
  const interactionActiveRef = useRef(false);
  const navigationLockedRef = useRef(false);
  const navigationUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [dragAnimationValues, setDragAnimationValues] =
    useState<FavoriteDragAnimationValues | null>(null);

  const {
    favorites: favoriteTeamIds,
    syncFavorites,
    setFavorites,
    isLoading,
    favoriteSports,
    favoriteSportsLoading,
    favoriteSportsReady,
    updateFavoriteSports,
    userId,
  } = useFavoriteTeamsContext();

  const [railOrder, setRailOrder] = useState<FavoriteRailOrder>(() =>
    createRailOrder(userId),
  );

  const teamData = useMemo<FavoriteTeamItem[]>(() => {
    return favoriteTeamIds.reduce<FavoriteTeamItem[]>((teams, favorite) => {
      const separatorIndex = favorite.indexOf(":");

      if (separatorIndex === -1) {
        return teams;
      }

      const league = favorite.slice(0, separatorIndex);

      const favoriteId = favorite.slice(separatorIndex + 1);

      if (!isFavoriteLeague(league) || !favoriteId) {
        return teams;
      }

      const baseTeam = getFavoriteBaseTeam(league, favoriteId);

      if (!baseTeam) {
        return teams;
      }

      teams.push({
        ...baseTeam,
        kind: "team",
        id: favoriteId,
        code: baseTeam.code ?? "",
        league,
        key: `${league}:${favoriteId}`,
        color: baseTeam.color ?? undefined,
      });

      return teams;
    }, []);
  }, [favoriteTeamIds]);

  const leagueData = useMemo<FavoriteLeagueItem[]>(() => {
    return favoriteSports.map((sport) => {
      const config = LEAGUE_CONFIG[sport];

      return {
        kind: "league",
        id: sport,
        league: sport,
        name: config.label,
        logo: config.logoLight,
        color: config.color,
        key: `league:${sport}`,
      };
    });
  }, [favoriteSports]);

  const data = useMemo<FavoriteItem[]>(() => {
    const sectionKeys =
      railOrder.userId === userId
        ? railOrder.sectionKeys
        : createRailOrder(userId).sectionKeys;

    return [
      ...orderFavoriteItems(leagueData, sectionKeys.league),
      ...orderFavoriteItems(teamData, sectionKeys.team),
    ];
  }, [leagueData, railOrder, teamData, userId]);

  useEffect(() => {
    latestReorderIdRef.current.league += 1;
    latestReorderIdRef.current.team += 1;
  }, [userId]);

  const handleInteractionStart = useCallback(() => {
    if (interactionActiveRef.current) {
      return;
    }

    interactionActiveRef.current = true;
    onInteractionStart?.();
  }, [onInteractionStart]);

  const handleInteractionEnd = useCallback(() => {
    if (!interactionActiveRef.current) {
      return;
    }

    interactionActiveRef.current = false;
    onInteractionEnd?.();
  }, [onInteractionEnd]);

  useEffect(
    () => () => {
      handleInteractionEnd();

      if (navigationUnlockTimerRef.current) {
        clearTimeout(navigationUnlockTimerRef.current);
      }
    },
    [handleInteractionEnd],
  );

  const pushOnce = useCallback(
    (href: Href) => {
      if (navigationLockedRef.current) {
        return;
      }

      navigationLockedRef.current = true;
      navigationUnlockTimerRef.current = setTimeout(() => {
        navigationLockedRef.current = false;
        navigationUnlockTimerRef.current = null;
      }, FAVORITE_NAVIGATION_LOCK_MS);

      void Haptics.selectionAsync();
      router.push(href);
    },
    [router],
  );

  const handleFavoritePress = useCallback(
    (item: FavoriteItem) => {
      if (item.kind === "league") {
        const config = LEAGUE_CONFIG[item.id];

        pushOnce({
          pathname: config.route,
          params: {
            league: item.id,
            leagueLabel: config.label,
          },
        });
        return;
      }

      pushOnce({
        pathname: getFavoriteTeamRoute(item.league),
        params: {
          teamId: item.id,
          league: item.league,
        },
      });
    },
    [pushOnce],
  );

  const handleDragBegin = useCallback(() => {
    handleInteractionStart();

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [handleInteractionStart]);

  const handleAnimationValuesInit = useCallback(
    (animationValues: FavoriteDragAnimationValues) => {
      setDragAnimationValues(animationValues);
    },
    [],
  );

  const handleDragEnd = useCallback(
    ({ from, to }: DragEndParams<FavoriteItem>) => {
      handleInteractionEnd();

      const draggedItem = data[from];

      if (!draggedItem) {
        return;
      }

      const section = draggedItem.kind;
      const previousKeys = data
        .filter((item) => item.kind === section)
        .map((item) => item.key);
      const reordered = reorderFavoriteRailItems(data, from, to);
      const orderedKeys = reordered
        .filter((item) => item.kind === section)
        .map((item) => item.key);

      if (orderedKeys.every((key, index) => key === previousKeys[index])) {
        return;
      }

      const reorderId = ++latestReorderIdRef.current[section];

      setRailOrder((current) => {
        const activeOrder =
          current.userId === userId ? current : createRailOrder(userId);

        return {
          ...activeOrder,
          sectionKeys: {
            ...activeOrder.sectionKeys,
            [section]: orderedKeys,
          },
        };
      });

      void Haptics.selectionAsync();

      const {
        favoriteTeamIds: orderedTeamFavorites,
        favoriteSports: orderedFavoriteSports,
      } = splitFavoriteRailOrder(reordered);

      if (section === "team") {
        setFavorites(orderedTeamFavorites);
      }

      const persistReorder = async () => {
        const saved =
          section === "team"
            ? await syncFavorites(orderedTeamFavorites)
            : await updateFavoriteSports(orderedFavoriteSports);

        if (reorderId !== latestReorderIdRef.current[section]) {
          return;
        }

        if (saved) {
          setRailOrder((current) => {
            if (current.userId !== userId) {
              return current;
            }

            return {
              ...current,
              sectionKeys: {
                ...current.sectionKeys,
                [section]: [],
              },
            };
          });
          return;
        }

        setRailOrder((current) => {
          const activeOrder =
            current.userId === userId ? current : createRailOrder(userId);

          return {
            ...activeOrder,
            sectionKeys: {
              ...activeOrder.sectionKeys,
              [section]: previousKeys,
            },
          };
        });

        if (section === "team") {
          setFavorites(favoriteTeamIds);
        }

        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      };

      reorderQueueRef.current[section] = reorderQueueRef.current[section].then(
        persistReorder,
        persistReorder,
      );
    },
    [
      data,
      favoriteTeamIds,
      handleInteractionEnd,
      setFavorites,
      syncFavorites,
      updateFavoriteSports,
      userId,
    ],
  );

  const renderItem = useCallback(
    (props: RenderItemParams<FavoriteItem>) => (
      <FavoritesTab
        {...props}
        onPressItem={handleFavoritePress}
        styles={styles}
      />
    ),
    [handleFavoritePress, styles],
  );

  const renderPlaceholder = useCallback(() => {
    return (
      <View style={styles.dragPlaceholder}>
        <View style={styles.dragPlaceholderCircle} />
      </View>
    );
  }, [styles]);

  const handleEditFavorites = useCallback(() => {
    pushOnce("/edit-favorites");
  }, [pushOnce]);

  const getItemLayout = useCallback(
    (_: ArrayLike<FavoriteItem> | null | undefined, index: number) => ({
      length: FAVORITES_RAIL_CELL_WIDTH,
      offset: FAVORITES_RAIL_CELL_WIDTH * index,
      index,
    }),
    [],
  );

  const renderFooter = useCallback(() => {
    const hasFavorites = data.length > 0;

    return (
      <View style={styles.cell}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit favorites"
          onPress={handleEditFavorites}
          style={({ pressed }) => [
            styles.tabContainer,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.editIcon}>
            <Ionicons
              name={hasFavorites ? "create" : "add"}
              size={28}
              color={isDark ? Colors.dark.background : Colors.light.background}
            />
          </View>

          <View style={styles.labelContainer}>
            <Text style={styles.tabLabel}>
              {hasFavorites ? "Edit" : "Add favorites"}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }, [data.length, handleEditFavorites, isDark, styles]);

  const favoritesLoading =
    isLoading || (favoriteSportsLoading && !favoriteSportsReady);

  if (favoritesLoading) {
    return <FavoritesScrollSkeleton isDark={isDark} />;
  }

  return (
    <View style={styles.railContainer}>
      {dragAnimationValues && (
        <FavoriteDragBoundary
          animationValues={dragAnimationValues}
          itemCount={data.length}
          sportCount={leagueData.length}
        />
      )}

      {dragAnimationValues &&
        leagueData.length > 0 &&
        teamData.length > 0 && (
          <FavoriteSectionDivider
            animationValues={dragAnimationValues}
            sportCount={leagueData.length}
            style={styles.sectionDivider}
          />
        )}

      <DraggableFlatList
        data={data}
        horizontal
        keyExtractor={(item) => item.key}
        getItemLayout={getItemLayout}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        showsHorizontalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.container}
        directionalLockEnabled
        nestedScrollEnabled
        activationDistance={10}
        autoscrollThreshold={56}
        autoscrollSpeed={180}
        dragItemOverflow={false}
        animationConfig={FAVORITES_SNAP_ANIMATION}
        renderItem={renderItem}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onTouchCancel={handleInteractionEnd}
        onDragBegin={handleDragBegin}
        onDragEnd={handleDragEnd}
        onAnimValInit={handleAnimationValuesInit}
        renderPlaceholder={renderPlaceholder}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}
