import CustomActivityIndicator from "components/CustomActivityIndicator";
import { EXPLORE_WIDGET_HEIGHTS } from "constants/exploreWidgetSizes";
import { Colors, Fonts } from "constants/styles";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { isFavoriteLeague } from "types/favorites";
import { ExploreWidgetSize } from "types/widgets";

import { supportsLiquidGlass } from "@/utils/glass";
import FavoriteTeamsSlider, { FavoriteTeamSlide } from "./FavoriteTeamsSlider";
import { WidgetEditControls } from "./WidgetSlider";

type FavoriteTeamsWidgetProps = {
  isDark: boolean;
  size?: ExploreWidgetSize;
  width?: number;
  height?: number;
  containerWidth?: number;
  containerHeight?: number;
  widgetId?: string;
  widgetSize?: ExploreWidgetSize;
  isEditing?: boolean;
  availableSizeOptions?: readonly ExploreWidgetSize[];
  onResizeWidget?: (widgetId: string, size: ExploreWidgetSize) => void;
  onRemoveWidget?: (widgetId: string) => void;
  onMoveWidget?: (widgetId: string, direction: -1 | 1) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
};

const sizeFallback: Record<ExploreWidgetSize, number> = {
  ...EXPLORE_WIDGET_HEIGHTS,
};

export default function FavoriteTeamsWidget({
  isDark,
  size = "medium",
  width,
  height,
  containerWidth,
  containerHeight,
  widgetId,
  widgetSize = size,
  isEditing = false,
  availableSizeOptions,
  onResizeWidget,
  onRemoveWidget,
  onMoveWidget,
  canMoveUp,
  canMoveDown,
}: FavoriteTeamsWidgetProps) {
  const { favorites, isLoading, ready, allTeams } = useFavoriteTeamsContext();

  const liquid = supportsLiquidGlass();

  const resolvedWidth = Math.max(
    width ?? containerWidth ?? sizeFallback[size],
    1,
  );

  const resolvedHeight = Math.max(
    height ?? containerHeight ?? sizeFallback[size],
    1,
  );

  const compact = size === "small" || resolvedWidth < 240;

  const styles = useMemo(
    () => favoriteTeamsWidgetStyles(isDark, compact),
    [compact, isDark],
  );

  const showActions = isEditing && Boolean(widgetId);

  const teamByFavoriteKey = useMemo(
    () =>
      new Map(
        allTeams.map((team) => [
          `${team.league.toLowerCase()}:${team.id}`,
          team,
        ]),
      ),
    [allTeams],
  );

  const slides = useMemo<FavoriteTeamSlide[]>(
    () =>
      favorites.flatMap((key) => {
        const separatorIndex = key.indexOf(":");

        if (separatorIndex === -1) {
          return [];
        }

        const league = key.slice(0, separatorIndex);
        const id = key.slice(separatorIndex + 1);

        if (!isFavoriteLeague(league)) {
          return [];
        }

        const favorite = {
          key,
          league,
          id,
        };

        const team = teamByFavoriteKey.get(key);

        return [
          {
            favorite,
            name: team?.name ?? team?.shortName ?? favorite.id,
            code: team?.code,
            color: team?.color ?? Colors.midTone,
            secondaryColor: team?.secondaryColor ?? Colors.midTone,
            fullName:
              team?.fullName ?? team?.name ?? team?.shortName ?? favorite.id,
            logo: team
              ? isDark
                ? (team.logoLight ?? team.logo)
                : team.logo
              : undefined,
          },
        ];
      }),
    [favorites, isDark, teamByFavoriteKey],
  );

  const renderContent = () => {
    if (isLoading || !ready) {
      return (
        <View style={styles.stateCard}>
          <CustomActivityIndicator />
        </View>
      );
    }

    if (slides.length === 0) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle} numberOfLines={1}>
            No teams saved
          </Text>

          <Text style={styles.stateText}>
            Add favorite teams to show shortcuts here.
          </Text>
        </View>
      );
    }

    return (
      <FavoriteTeamsSlider
        teams={slides}
        width={resolvedWidth}
        height={resolvedHeight}
        isDark={isDark}
        compact={compact}
      />
    );
  };

  const cardStyle = [
    styles.card,
    {
      width: resolvedWidth,
      height: resolvedHeight,
    },
  ];

  const widgetContent = (
    <View
      style={[
        styles.body,
        {
          width: resolvedWidth,
          height: resolvedHeight,
        },
      ]}
    >
      {renderContent()}

      {showActions && widgetId && (
        <WidgetEditControls
          isDark={isDark}
          widgetId={widgetId}
          widgetSize={widgetSize}
          availableSizeOptions={availableSizeOptions}
          onResizeWidget={onResizeWidget}
          onRemoveWidget={onRemoveWidget}
          onMoveWidget={onMoveWidget}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          compact={compact}
        />
      )}
    </View>
  );

  if (liquid) {
    return (
      <GlassView
        style={cardStyle}
        glassEffectStyle="regular"
        
      >
        {widgetContent}
      </GlassView>
    );
  }

  return (
    <BlurView
      style={cardStyle}
      intensity={100}
      tint={isDark ? "dark" : "light"}
    >
      {widgetContent}
    </BlurView>
  );
}

const favoriteTeamsWidgetStyles = (isDark: boolean, compact: boolean) =>
  StyleSheet.create({
    card: {
      position: "relative",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.midTone,
      borderRadius: 8,
      overflow: "hidden",
    },

    body: {
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
    },

    stateCard: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: compact ? 6 : 8,
      padding: compact ? 8 : 12,
    },

    stateTitle: {
      fontFamily: Fonts.MEDIUM,
      fontSize: compact ? 14 : 16,
      color: isDark ? Colors.white : Colors.black,
    },

    stateText: {
      fontFamily: Fonts.REGULAR,
      fontSize: compact ? 11 : 13,
      lineHeight: compact ? 15 : 18,
      color: isDark ? Colors.lightGray : Colors.darkGray,
      textAlign: "center",
    },
  });
