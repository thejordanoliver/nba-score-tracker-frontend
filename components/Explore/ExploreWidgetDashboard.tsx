import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import {
  EXPLORE_WIDGET_MAX_HEIGHTS,
  EXPLORE_WIDGET_MIN_HEIGHTS,
} from "constants/exploreWidgetSizes";
import {
  EXPLORE_WIDGET_EMPTY_COPY,
  getWidgetOption,
  getWidgetSizeOptions,
  isGameWidgetType,
} from "constants/exploreWidgets";
import { activeOpacity, Colors } from "constants/styles";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  type StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { exploreStyles } from "styles/ExploreStyles/ExploreStyles";
import {
  EXPLORE_WIDGET_GRID_GAP,
  EXPLORE_WIDGET_ROW_GAP,
  WidgetDashboardStyles,
} from "styles/ExploreStyles/WidgetDashboardStyles";
import type {
  ExploreCollegePollLeague,
  ExploreCollegePollType,
  ExploreWidgetConfig,
  ExploreWidgetGame,
  ExploreStandingsLeague,
  ExploreWidgetSize,
  ExploreWidgetType,
} from "types/widgets";
import SortableWidgetGrid, {
  type SortableWidgetRenderArgs,
} from "./SortableWidgetGrid";
import CollegePollWidget from "./Widgets/CollegePollWidget";
import CreatePostWidget from "./Widgets/CreatePostWidget";
import FavoriteTeamsWidget from "./Widgets/FavoriteTeamsWidget";
import StandingsWidget from "./Widgets/StandingsWidget";
import WidgetSlider, {
  WidgetEditControls,
  type WidgetSlide,
} from "./Widgets/WidgetSlider";

type ExploreWidgetDashboardProps = {
  isDark: boolean;
  selectedWidgets: ExploreWidgetConfig[];
  widgetsReady: boolean;
  games: ExploreWidgetGame[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onAddWidget: () => void;
  onRemoveWidget: (widgetId: string) => void;
  onResizeWidget: (widgetId: string, size: ExploreWidgetSize) => void;
  onSetStandingsLeague: (
    widgetId: string,
    league: ExploreStandingsLeague,
  ) => void;
  onSetCollegePollSelection: (
    widgetId: string,
    league: ExploreCollegePollLeague,
    pollType: ExploreCollegePollType,
  ) => void;
  onMoveWidget: (widgetId: string, direction: -1 | 1) => void;
  onReorderWidgets: (widgets: ExploreWidgetConfig[]) => void;
  isEditing: boolean;
  onBeginEditing: () => void;
};

type GameWidgetSection = {
  type: ExploreWidgetType;
  slides: WidgetSlide[];
};

type WidgetEditProps = {
  widgetId: string;
  widgetSize: ExploreWidgetSize;
  isEditing: boolean;
  availableSizeOptions: readonly ExploreWidgetSize[];
  onResizeWidget: (widgetId: string, size: ExploreWidgetSize) => void;
  onRemoveWidget: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  placeholderHeight?: number;
};

type WidgetFrameProps = {
  children: ReactNode;
  style: StyleProp<ViewStyle>;
  isEditing: boolean;
  isActive: boolean;
  isDark: boolean;
};

function toWidgetSlide(envelope: ExploreWidgetGame): WidgetSlide {
  switch (envelope.league) {
    case "nba":
      return { type: "nba", data: envelope.game };
    case "wnba":
      return { type: "wnba", data: envelope.game };
    case "cbb":
      return { type: "cbb", data: envelope.game };
    case "wcbb":
      return { type: "wcbb", data: envelope.game };
    case "mlb":
      return { type: "mlb", data: envelope.game };
    case "nfl":
      return { type: "nfl", data: envelope.game };
    case "cfb":
      return { type: "cfb", data: envelope.game };
    case "nhl":
      return { type: "nhl", data: envelope.game };
  }
}

function WidgetFrame({
  children,
  style,
  isEditing,
  isActive,
  isDark,
}: WidgetFrameProps) {
  return (
    <View
      style={[
        style,
        isEditing && draggableFrameStyles.dragEnabled,
        isActive && draggableFrameStyles.dragActive,
      ]}
    >
      {children}

      {isEditing && (
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          style={draggableFrameStyles.dragHandle}
        >
          <Ionicons
            name="reorder-three-outline"
            size={20}
            color={isDark ? Colors.white : Colors.black}
          />
        </View>
      )}
    </View>
  );
}

export default function ExploreWidgetDashboard({
  isDark,
  selectedWidgets,
  widgetsReady,
  games,
  loading: gameWidgetsLoading,
  refreshing,
  error,
  onRefresh,
  onAddWidget,
  onRemoveWidget,
  onResizeWidget,
  onSetStandingsLeague,
  onSetCollegePollSelection,
  onMoveWidget,
  onReorderWidgets,
  isEditing,
  onBeginEditing,
}: ExploreWidgetDashboardProps) {
  const isFocused = useIsFocused();
  const styles = exploreStyles(isDark);
  const dashboardStyles = WidgetDashboardStyles(isDark);
  const visibleWidgets = useMemo(
    () =>
      selectedWidgets
        .filter((widget) => Boolean(getWidgetOption(widget.type)))
        .slice()
        .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt),
    [selectedWidgets],
  );
  const selectedGameWidgetTypes = useMemo(
    () => visibleWidgets.map((widget) => widget.type).filter(isGameWidgetType),
    [visibleWidgets],
  );
  const favoriteGameSlides = useMemo(() => games.map(toWidgetSlide), [games]);
  const gameSections: GameWidgetSection[] = useMemo(
    () => [
      {
        type: "favorite_games",
        slides: favoriteGameSlides,
      },
      {
        type: "nba_games",
        slides: favoriteGameSlides.filter((slide) => slide.type === "nba"),
      },
      {
        type: "mlb_games",
        slides: favoriteGameSlides.filter((slide) => slide.type === "mlb"),
      },
      {
        type: "wnba_games",
        slides: favoriteGameSlides.filter((slide) => slide.type === "wnba"),
      },
      {
        type: "cbb_games",
        slides: favoriteGameSlides.filter((slide) => slide.type === "cbb"),
      },
      {
        type: "wcbb_games",
        slides: favoriteGameSlides.filter((slide) => slide.type === "wcbb"),
      },
      {
        type: "nfl_games",
        slides: favoriteGameSlides.filter((slide) => slide.type === "nfl"),
      },
      {
        type: "cfb_games",
        slides: favoriteGameSlides.filter((slide) => slide.type === "cfb"),
      },
      {
        type: "nhl_games",
        slides: favoriteGameSlides.filter((slide) => slide.type === "nhl"),
      },
    ],
    [favoriteGameSlides],
  );
  const hasSelectedGameWidget = selectedGameWidgetTypes.length > 0;

  const renderEmptyBoard = () => (
    <View style={[styles.centerPrompt, dashboardStyles.emptyWrap]}>
      <View style={dashboardStyles.emptyIcon}>
        <Ionicons
          name="grid-outline"
          size={28}
          color={isDark ? Colors.white : Colors.black}
        />
      </View>
      <Text style={dashboardStyles.emptyTitle}>Build your Explore board</Text>
      <Text style={dashboardStyles.emptyText}>
        Add game cards and favorite-team shortcuts.
      </Text>
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onAddWidget}
        style={dashboardStyles.cta}
        accessibilityRole="button"
        accessibilityLabel="Add your first widget"
      >
        <Ionicons
          name="add"
          size={18}
          color={isDark ? Colors.black : Colors.white}
        />
        <Text style={dashboardStyles.ctaText}>Add your first widget</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyCard = (
    type: ExploreWidgetType,
    title: string,
    editProps?: WidgetEditProps,
  ) => (
    <View
      style={[
        dashboardStyles.placeholderCard,
        editProps?.placeholderHeight
          ? { height: editProps.placeholderHeight }
          : null,
      ]}
    >
      <Text style={dashboardStyles.placeholderTitle}>{title}</Text>
      <Text style={dashboardStyles.placeholderText}>
        {EXPLORE_WIDGET_EMPTY_COPY[type] ??
          "This widget has been added to your Explore board."}
      </Text>
      {editProps?.isEditing && (
        <WidgetEditControls
          isDark={isDark}
          widgetId={editProps.widgetId}
          widgetSize={editProps.widgetSize}
          availableSizeOptions={editProps.availableSizeOptions}
          onResizeWidget={editProps.onResizeWidget}
          onRemoveWidget={editProps.onRemoveWidget}
          onMoveWidget={editProps.onMoveWidget}
          canMoveUp={editProps.canMoveUp}
          canMoveDown={editProps.canMoveDown}
          compact={editProps.widgetSize === "small"}
        />
      )}
    </View>
  );

  if (!widgetsReady) {
    return (
      <View style={[styles.centerPrompt, dashboardStyles.emptyWrap]}>
        <CustomActivityIndicator />
      </View>
    );
  }

  if (visibleWidgets.length === 0) {
    return renderEmptyBoard();
  }

  const renderWidget = ({
    widget,
    index,
    width,
    height,
    isActive,
  }: SortableWidgetRenderArgs) => {
    const gameSection = gameSections.find(
      (section) => section.type === widget.type,
    );
    const editProps = {
      widgetId: widget.id,
      widgetSize: widget.size,
      isEditing,
      availableSizeOptions: getWidgetSizeOptions(widget.type),
      onResizeWidget,
      onRemoveWidget,
      onMoveWidget,
      canMoveUp: index > 0,
      canMoveDown: index < visibleWidgets.length - 1,
    };
    let content: ReactNode;

    if (gameSection) {
      content = (
        <View style={dashboardStyles.section}>
          <WidgetSlider
            games={gameSection.slides}
            loading={gameWidgetsLoading}
            initialHeight={height}
            initialWidth={width}
            isDark={isDark}
            dashboardMode
            orientation="horizontal"
            {...editProps}
          />
        </View>
      );
    } else if (widget.type === "favorite_teams") {
      content = (
        <View style={dashboardStyles.section}>
          <FavoriteTeamsWidget
            isDark={isDark}
            size={widget.size}
            width={width}
            height={height}
            containerWidth={width}
            containerHeight={height}
            {...editProps}
          />
        </View>
      );
    } else if (widget.type === "create_post") {
      content = (
        <View style={dashboardStyles.section}>
          <CreatePostWidget
            isDark={isDark}
            size={widget.size}
            width={width}
            height={height}
            {...editProps}
          />
        </View>
      );
    } else if (widget.type === "standings") {
      content = (
        <View style={dashboardStyles.section}>
          <StandingsWidget
            isDark={isDark}
            size={widget.size}
            width={width}
            height={height}
            league={widget.standingsLeague ?? "nba"}
            onChangeLeague={(league) =>
              onSetStandingsLeague(widget.id, league)
            }
            {...editProps}
          />
        </View>
      );
    } else if (widget.type === "college_polls") {
      content = (
        <View style={dashboardStyles.section}>
          <CollegePollWidget
            isDark={isDark}
            size={widget.size}
            width={width}
            height={height}
            league={widget.collegePollLeague ?? "cfb"}
            pollType={widget.collegePollType ?? "ap"}
            onChangeSelection={(league, pollType) =>
              onSetCollegePollSelection(widget.id, league, pollType)
            }
            {...editProps}
          />
        </View>
      );
    } else {
      content = renderEmptyCard(widget.type, widget.title, {
        ...editProps,
        placeholderHeight: height,
      });
    }

    return (
      <WidgetFrame
        isEditing={isEditing}
        isActive={isActive}
        isDark={isDark}
        style={[
          dashboardStyles.gridCell,
          isEditing && dashboardStyles.draggableCell,
          {
            width,
            height,
            minHeight: EXPLORE_WIDGET_MIN_HEIGHTS[widget.size],
            maxHeight: EXPLORE_WIDGET_MAX_HEIGHTS[widget.size],
          },
        ]}
      >
        {content}
      </WidgetFrame>
    );
  };

  const dashboardHeader =
    error && hasSelectedGameWidget ? (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={() => {
          void onRefresh();
        }}
        style={dashboardStyles.errorCard}
        accessibilityRole="button"
        accessibilityLabel="Retry loading widget games"
      >
        <Text style={dashboardStyles.placeholderTitle}>
          Unable to load widget games
        </Text>
        <Text style={dashboardStyles.placeholderText}>{error}</Text>
      </TouchableOpacity>
    ) : null;

  return (
    <SortableWidgetGrid
      widgets={visibleWidgets}
      enabled={isFocused}
      isEditing={isEditing}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onBeginEditing={onBeginEditing}
      onReorder={onReorderWidgets}
      renderWidget={renderWidget}
      header={dashboardHeader}
      style={dashboardStyles.scroll}
      contentContainerStyle={dashboardStyles.content}
      horizontalGap={EXPLORE_WIDGET_GRID_GAP}
      verticalGap={EXPLORE_WIDGET_ROW_GAP}
    />
  );
}

const draggableFrameStyles = StyleSheet.create({
  dragEnabled: {
    zIndex: 20,
  },
  dragActive: {
    opacity: 0.98,
  },
  dragHandle: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 40,
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(127,127,127,0.18)",
  },
});
