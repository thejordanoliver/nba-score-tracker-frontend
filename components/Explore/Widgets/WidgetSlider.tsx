import CustomActivityIndicator from "@/components/CustomActivityIndicator";
import { BaseballGame } from "@/types/baseball/baseball";
import { BasketballGame } from "@/types/basketball/basketball";
import { FootballGame } from "@/types/football/football";
import { HockeyGame } from "@/types/hockey/hockey";
import { supportsLiquidGlass } from "@/utils/glass";
import { Ionicons } from "@expo/vector-icons";
import { EXPLORE_WIDGET_SLIDE_INDICATOR_BOTTOM } from "constants/exploreWidgetSizes";
import { EXPLORE_WIDGET_SIZES } from "constants/exploreWidgets";
import { Colors, activeOpacity } from "constants/styles";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  LayoutAnimation,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { ExploreWidgetSize } from "types/widgets";
import BaseballGameWidget from "./GameCards/BaseballGameWidget";
import BasketballGameWidget from "./GameCards/BasketballGameWidget";
import FootballGameWidget from "./GameCards/FootballGameWidget";
import NHLGameWidget from "./GameCards/HockeyGameWidget";

// Outside component — never changes
const ENABLE_AUTO_SLIDE = false;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type WidgetSlide =
  | { type: "nba"; data: BasketballGame }
  | { type: "nfl"; data: FootballGame }
  | { type: "cfb"; data: FootballGame }
  | { type: "ufl"; data: FootballGame }
  | { type: "mlb"; data: BaseballGame }
  | { type: "cbb"; data: BasketballGame }
  | { type: "wcbb"; data: BasketballGame }
  | { type: "wnba"; data: BasketballGame }
  | { type: "nhl"; data: HockeyGame };

type WidgetSliderOrientation = "vertical" | "horizontal";

type WidgetSliderProps = {
  games: WidgetSlide[];
  loading: boolean;
  initialHeight?: number;
  initialWidth?: number;
  isDark: boolean;
  dashboardMode?: boolean;
  orientation?: WidgetSliderOrientation;
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

type WidgetEditControlsProps = {
  isDark: boolean;
  widgetId: string;
  widgetSize: ExploreWidgetSize;
  availableSizeOptions?: readonly ExploreWidgetSize[];
  onResizeWidget?: (widgetId: string, size: ExploreWidgetSize) => void;
  onRemoveWidget?: (widgetId: string) => void;
  onMoveWidget?: (widgetId: string, direction: -1 | 1) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  compact?: boolean;
};

const DEFAULT_SIZE_OPTIONS: readonly ExploreWidgetSize[] = EXPLORE_WIDGET_SIZES;

export function WidgetEditControls({
  isDark,
  widgetId,
  widgetSize,
  availableSizeOptions = DEFAULT_SIZE_OPTIONS,
  onResizeWidget,
  onRemoveWidget,
  onMoveWidget,
  canMoveUp = false,
  canMoveDown = false,
  compact = false,
}: WidgetEditControlsProps) {
  const styles = editControlStyles(isDark, compact);

  return (
    <View style={styles.editOverlay} pointerEvents="box-none">
      <View style={styles.editControls}>
        {onMoveWidget && (
          <View style={styles.moveControls}>
            <TouchableOpacity
              activeOpacity={activeOpacity}
              onPress={() => onMoveWidget(widgetId, -1)}
              disabled={!canMoveUp}
              style={[
                styles.moveButton,
                !canMoveUp && styles.moveButtonDisabled,
              ]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Move widget up"
              accessibilityState={{ disabled: !canMoveUp }}
            >
              <Ionicons
                name="chevron-up"
                size={compact ? 13 : 15}
                color={isDark ? Colors.white : Colors.black}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={activeOpacity}
              onPress={() => onMoveWidget(widgetId, 1)}
              disabled={!canMoveDown}
              style={[
                styles.moveButton,
                !canMoveDown && styles.moveButtonDisabled,
              ]}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Move widget down"
              accessibilityState={{ disabled: !canMoveDown }}
            >
              <Ionicons
                name="chevron-down"
                size={compact ? 13 : 15}
                color={isDark ? Colors.white : Colors.black}
              />
            </TouchableOpacity>
          </View>
        )}

        {onResizeWidget && (
          <View style={styles.sizeControls}>
            {availableSizeOptions.map((size) => (
              <TouchableOpacity
                key={size}
                activeOpacity={activeOpacity}
                onPress={() => onResizeWidget(widgetId, size)}
                style={[
                  styles.sizeButton,
                  widgetSize === size && styles.sizeButtonSelected,
                ]}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={`Resize widget to ${size}`}
              >
                <Text
                  style={[
                    styles.sizeButtonText,
                    widgetSize === size && styles.sizeButtonTextSelected,
                  ]}
                >
                  {size[0].toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {onRemoveWidget && (
          <TouchableOpacity
            activeOpacity={activeOpacity}
            onPress={() => onRemoveWidget(widgetId)}
            style={styles.removeButton}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel="Remove widget"
          >
            <Ionicons
              name="close"
              size={compact ? 14 : 16}
              color={isDark ? Colors.white : Colors.black}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function WidgetSlider({
  games,
  loading,
  initialHeight = 220,
  initialWidth,
  isDark,
  dashboardMode = false,
  orientation = "vertical",
  widgetId,
  widgetSize,
  isEditing = false,
  availableSizeOptions,
  onResizeWidget,
  onRemoveWidget,
  onMoveWidget,
  canMoveUp,
  canMoveDown,
}: WidgetSliderProps) {
  const liquid = supportsLiquidGlass();
  const { width: screenWidth, height: screenHeight } = useMemo(
    () => Dimensions.get("window"),
    [],
  );

  const resolvedInitialWidth = initialWidth ?? Math.max(screenWidth - 24, 280);
  const isHorizontal = orientation === "horizontal";
  const canResize = !dashboardMode && !isHorizontal;
  const aspectRatio = resolvedInitialWidth / initialHeight;

  const scrollPosition = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const currentOffset = useRef(0);

  const [slideHeight, setSlideHeight] = useState(initialHeight);
  const [slideWidth, setSlideWidth] = useState(resolvedInitialWidth);

  const slideHeightRef = useRef(initialHeight);
  const slideWidthRef = useRef(resolvedInitialWidth);

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);

  const isResizing = useRef(false);
  const lockedIndex = useRef(0);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (!dashboardMode) return;

    slideHeightRef.current = initialHeight;
    slideWidthRef.current = resolvedInitialWidth;
    setSlideHeight(initialHeight);
    setSlideWidth(resolvedInitialWidth);
  }, [dashboardMode, initialHeight, resolvedInitialWidth]);

  useEffect(() => {
    if (dashboardMode) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [dashboardMode]);

  const slides = useMemo<WidgetSlide[]>(() => {
    return games.filter((game) => "data" in game) as WidgetSlide[];
  }, [games]);

  useEffect(() => {
    if (!ENABLE_AUTO_SLIDE || slides.length <= 1 || !flatListRef.current) {
      return;
    }

    const interval = setInterval(() => {
      const nextIndex = currentIndexRef.current + 1;
      const from = currentOffset.current;
      const itemLength = isHorizontal
        ? slideWidthRef.current
        : slideHeightRef.current;
      const to = nextIndex < slides.length ? nextIndex * itemLength : 0;

      let start: number | null = null;
      const duration = 600;

      const animate = (timestamp: number) => {
        if (!start) start = timestamp;

        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = progress * progress;

        flatListRef.current?.scrollToOffset({
          offset: from + (to - from) * eased,
          animated: false,
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          currentOffset.current = to;
          setCurrentIndex(nextIndex >= slides.length ? 0 : nextIndex);
        }
      };

      requestAnimationFrame(animate);
    }, 15000);

    return () => clearInterval(interval);
  }, [isHorizontal, slides.length]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isResizing.current) return;

      const offset = isHorizontal
        ? event.nativeEvent.contentOffset.x
        : event.nativeEvent.contentOffset.y;

      const itemLength = isHorizontal
        ? slideWidthRef.current
        : slideHeightRef.current;

      currentOffset.current = offset;
      scrollPosition.setValue(offset);
      setCurrentIndex(Math.round(offset / itemLength));
    },
    [isHorizontal, scrollPosition],
  );

  const snapToCurrentSlide = useCallback(() => {
    if (!flatListRef.current) return;

    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({
        offset:
          lockedIndex.current *
          (isHorizontal ? slideWidthRef.current : slideHeightRef.current),
        animated: true,
      });
    });
  }, [isHorizontal]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        isResizing.current = true;
        lockedIndex.current = currentIndexRef.current;
      },

      onPanResponderMove: (_, { dy }) => {
        const minH = initialHeight;
        const maxH = screenHeight;
        const minW = resolvedInitialWidth;
        const maxW = screenWidth;

        let newH = slideHeightRef.current + dy;
        let newW = newH * aspectRatio;

        if (newW > maxW) {
          newW = maxW;
          newH = newW / aspectRatio;
        }

        if (newW < minW) {
          newW = minW;
          newH = newW / aspectRatio;
        }

        if (newH > maxH) {
          newH = maxH;
          newW = newH * aspectRatio;
        }

        if (newH < minH) {
          newH = minH;
          newW = newH * aspectRatio;
        }

        slideHeightRef.current = newH;
        slideWidthRef.current = newW;
        setSlideHeight(newH);
        setSlideWidth(newW);
      },

      onPanResponderRelease: () => {
        isResizing.current = false;
        snapToCurrentSlide();
      },

      onPanResponderTerminate: () => {
        isResizing.current = false;
        snapToCurrentSlide();
      },
    }),
  ).current;

  const progressOpacity = useRef(new Animated.Value(0)).current;
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  const progressHeight = useMemo(
    () =>
      scrollPosition.interpolate({
        inputRange: [
          0,
          Math.max(
            (slides.length - 1) * (isHorizontal ? slideWidth : slideHeight),
            1,
          ),
        ],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      }),
    [isHorizontal, slides.length, slideHeight, slideWidth, scrollPosition],
  );

  const showProgress = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }

    Animated.timing(progressOpacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [progressOpacity]);

  const hideProgress = useCallback(() => {
    hideTimeout.current = setTimeout(() => {
      Animated.timing(progressOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }, 400);
  }, [progressOpacity]);

  const scaleX = useMemo(
    () =>
      progressOpacity.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.95],
      }),
    [progressOpacity],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: isHorizontal ? slideWidth : slideHeight,
      offset: (isHorizontal ? slideWidth : slideHeight) * index,
      index,
    }),
    [isHorizontal, slideHeight, slideWidth],
  );

  const keyExtractor = useCallback(
    (_: unknown, index: number) => String(index),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: WidgetSlide }) => {
      switch (item.type) {
        case "nba":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <BasketballGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
              />
            </View>
          );

        case "nfl":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <FootballGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
                isNFL={true}
                isCFB={false}
              />
            </View>
          );

        case "cfb":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <FootballGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
                isNFL={false}
                isCFB={true}
              />
            </View>
          );

        case "ufl":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <FootballGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
                isNFL={false}
                isCFB={true}
              />
            </View>
          );

        case "mlb":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <BaseballGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
              />
            </View>
          );

        case "cbb":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <BasketballGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
                isCBB={true}
              />
            </View>
          );

        case "wcbb":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <BasketballGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
                isWCBB={true}
              />
            </View>
          );

        case "wnba":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <BasketballGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
                isWNBA={true}
              />
            </View>
          );

        case "nhl":
          return (
            <View style={{ height: slideHeight, width: slideWidth }}>
              <NHLGameWidget
                game={item.data}
                height={slideHeight}
                width={slideWidth}
                isDark={isDark}
              />
            </View>
          );

        default:
          return <View style={{ height: slideHeight, width: slideWidth }} />;
      }
    },
    [slideHeight, slideWidth, isDark],
  );

  const styles = useMemo(
    () => sliderStyles(isDark, dashboardMode),
    [dashboardMode, isDark],
  );

  const showEditControls = isEditing && widgetId != null && widgetSize != null;
  const showDots = dashboardMode && slides.length > 1 && !showEditControls;

  if (loading)
    return (
      <View style={styles.emptyContainer}>
        <CustomActivityIndicator />
      </View>
    );

  return (
    <Animated.View
      style={{
        height: slideHeight,
        width: dashboardMode ? "100%" : slideWidth,
        minWidth: dashboardMode ? undefined : "48%",
        maxWidth: "100%",
        transform: dashboardMode ? undefined : [{ scaleX }],
      }}
    >
      <View style={styles.container}>
        {liquid ? (
          <GlassView style={styles.glassSurface}>
            <FlatList
              ref={flatListRef}
              data={slides}
              keyExtractor={keyExtractor}
              horizontal={isHorizontal}
              pagingEnabled
              snapToInterval={isHorizontal ? slideWidth : slideHeight}
              decelerationRate="fast"
              disableIntervalMomentum
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              getItemLayout={getItemLayout}
              onScrollBeginDrag={showProgress}
              onMomentumScrollBegin={showProgress}
              onMomentumScrollEnd={hideProgress}
              onScrollEndDrag={hideProgress}
              onScroll={onScroll}
              scrollEventThrottle={16}
              renderItem={renderItem}
              scrollEnabled={!showEditControls}
            />

            {canResize && (
              <View style={styles.resizeHandle} {...panResponder.panHandlers} />
            )}

            {showEditControls && widgetId && widgetSize && (
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
                compact={slideWidth < 240 || slideHeight < 260}
              />
            )}
          </GlassView>
        ) : (
          <BlurView style={styles.glassSurface} intensity={100}>
            <FlatList
              ref={flatListRef}
              data={slides}
              keyExtractor={keyExtractor}
              horizontal={isHorizontal}
              pagingEnabled
              snapToInterval={isHorizontal ? slideWidth : slideHeight}
              decelerationRate="fast"
              disableIntervalMomentum
              directionalLockEnabled
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              getItemLayout={getItemLayout}
              onScrollBeginDrag={showProgress}
              onMomentumScrollBegin={showProgress}
              onMomentumScrollEnd={hideProgress}
              onScrollEndDrag={hideProgress}
              onScroll={onScroll}
              scrollEventThrottle={16}
              renderItem={renderItem}
              scrollEnabled={!showEditControls}
            />

            {canResize && (
              <View style={styles.resizeHandle} {...panResponder.panHandlers} />
            )}

            {showEditControls && widgetId && widgetSize && (
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
                compact={slideWidth < 240 || slideHeight < 260}
              />
            )}
          </BlurView>
        )}
      </View>

      {!dashboardMode && (
        <Animated.View
          style={[styles.progressContainer, { opacity: progressOpacity }]}
        >
          <Animated.View
            style={[styles.progressBar, { height: progressHeight }]}
          />
        </Animated.View>
      )}

      {showDots && (
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.activeDot]}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const sliderStyles = (isDark: boolean, dashboardMode: boolean) =>
  StyleSheet.create({
    container: {
      position: "relative",
      flexDirection: "row",
      width: "100%",
      height: "100%",
      padding: dashboardMode ? 0 : 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.midTone,
      borderRadius: 8,
      overflow: "hidden",
    },
    glassSurface: {
      flex: 1,
      width: "100%",
      height: "100%",
      borderRadius: 8,
      overflow: "hidden",
    },
    emptyContainer: {
      justifyContent: "center",
      alignItems: "center",
      flex: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Colors.midTone,
      borderRadius: 8,
    },
    progressContainer: {
      position: "absolute",
      top: "25%",
      right: -14,
      width: 4,
      height: "50%",
      borderRadius: 2,
      backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
      overflow: "hidden",
    },
    progressBar: {
      width: "100%",
      borderRadius: 2,
      backgroundColor: isDark ? Colors.dark.white : Colors.light.black,
    },
    resizeHandle: {
      position: "absolute",
      right: 0,
      bottom: 0,
      zIndex: 10,
      width: 20,
      height: 20,
      borderTopLeftRadius: 8,
      backgroundColor: isDark ? Colors.dark.white : Colors.light.black,
    },
    dots: {
      position: "absolute",
      bottom: EXPLORE_WIDGET_SLIDE_INDICATOR_BOTTOM,
      zIndex: 5,
      flexDirection: "row",
      alignSelf: "center",
      gap: 5,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)",
    },
    activeDot: {
      width: 16,
      backgroundColor: isDark ? Colors.dark.white : Colors.light.black,
    },
  });

const editControlStyles = (isDark: boolean, compact: boolean) =>
  StyleSheet.create({
    editOverlay: {
      position: "absolute",
      right: 0,
      bottom: compact ? 6 : 8,
      left: 0,
      zIndex: 30,
      alignItems: "center",
      justifyContent: "center",
    },
    editControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: compact ? 4 : 6,
      paddingHorizontal: compact ? 5 : 7,
      paddingVertical: compact ? 4 : 5,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.92)",
      shadowColor: Colors.black,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.16,
      shadowRadius: 8,
      elevation: 5,
    },
    moveControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
    },
    moveButton: {
      alignItems: "center",
      justifyContent: "center",
      width: compact ? 22 : 24,
      height: compact ? 22 : 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 999,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    moveButtonDisabled: {
      opacity: 0.35,
    },
    sizeControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    sizeButton: {
      alignItems: "center",
      justifyContent: "center",
      width: compact ? 22 : 24,
      height: compact ? 22 : 24,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 999,
      backgroundColor: isDark ? Colors.black : Colors.white,
    },
    sizeButtonSelected: {
      backgroundColor: isDark ? Colors.white : Colors.black,
    },
    sizeButtonText: {
      fontSize: compact ? 9 : 10,
      fontWeight: "700",
      color: isDark ? Colors.white : Colors.black,
    },
    sizeButtonTextSelected: {
      color: isDark ? Colors.black : Colors.white,
    },
    removeButton: {
      alignItems: "center",
      justifyContent: "center",
      width: compact ? 24 : 28,
      height: compact ? 24 : 28,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? Colors.darkGray : Colors.lightGray,
      borderRadius: 999,
      backgroundColor: isDark ? Colors.darkGray : Colors.white,
    },
  });
