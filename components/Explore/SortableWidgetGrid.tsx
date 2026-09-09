import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  type LayoutChangeEvent,
  RefreshControl,
  ScrollView,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { ExploreWidgetConfig } from "types/widgets";
import {
  calculateWidgetGridLayout,
  findWidgetReorderTargetIndex,
  moveWidgetToIndex,
  type WidgetGridLayoutItem,
} from "utils/exploreWidgetLayout";

const LONG_PRESS_DURATION_MS = 320;
const EDGE_SCROLL_ZONE = 76;
const EDGE_SCROLL_STEP = 5;
const POSITION_SPRING = {
  damping: 22,
  stiffness: 240,
  mass: 0.82,
};
const LIFT_SPRING = {
  damping: 18,
  stiffness: 280,
  mass: 0.7,
};

type ActiveWidgetDrag = {
  id: string;
  fromIndex: number;
  currentIndex: number;
};

export type SortableWidgetRenderArgs = {
  widget: ExploreWidgetConfig;
  index: number;
  width: number;
  height: number;
  isActive: boolean;
};

type SortableWidgetGridProps = {
  widgets: readonly ExploreWidgetConfig[];
  enabled: boolean;
  isEditing: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onBeginEditing: () => void;
  onReorder: (widgets: ExploreWidgetConfig[]) => void;
  renderWidget: (args: SortableWidgetRenderArgs) => ReactNode;
  header: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  horizontalGap: number;
  verticalGap: number;
};

type SortableWidgetProps = {
  widget: ExploreWidgetConfig;
  layout: WidgetGridLayoutItem;
  slots: WidgetGridLayoutItem[];
  currentIndex: number;
  enabled: boolean;
  isEditing: boolean;
  activeWidgetId: string | null;
  scrollOffset: SharedValue<number>;
  viewportTop: SharedValue<number>;
  viewportBottom: SharedValue<number>;
  onDragStart: (widgetId: string) => void;
  onTargetIndexChange: (widgetId: string, targetIndex: number) => void;
  onDrop: (widgetId: string) => void;
  onCancel: (widgetId: string) => void;
  onEdgeDirectionChange: (direction: -1 | 0 | 1) => void;
  renderWidget: (args: SortableWidgetRenderArgs) => ReactNode;
};

const performImpact = (style: Haptics.ImpactFeedbackStyle) => {
  Haptics.impactAsync(style).catch(() => {});
};

const performSelection = () => {
  Haptics.selectionAsync().catch(() => {});
};

function SortableWidget({
  widget,
  layout,
  slots,
  currentIndex,
  enabled,
  isEditing,
  activeWidgetId,
  scrollOffset,
  viewportTop,
  viewportBottom,
  onDragStart,
  onTargetIndexChange,
  onDrop,
  onCancel,
  onEdgeDirectionChange,
  renderWidget,
}: SortableWidgetProps) {
  const positionX = useSharedValue(layout.x);
  const positionY = useSharedValue(layout.y);
  const targetX = useSharedValue(layout.x);
  const targetY = useSharedValue(layout.y);
  const dragOriginX = useSharedValue(layout.x);
  const dragOriginY = useSharedValue(layout.y);
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const dragStartScrollOffset = useSharedValue(0);
  const scale = useSharedValue(1);
  const isGestureActive = useSharedValue(false);
  const completedGesture = useSharedValue(false);
  const currentIndexValue = useSharedValue(currentIndex);
  const slotLayouts = useSharedValue(slots);
  const edgeDirection = useSharedValue<-1 | 0 | 1>(0);

  useEffect(() => {
    targetX.value = layout.x;
    targetY.value = layout.y;

    if (activeWidgetId !== widget.id) {
      positionX.value = withSpring(layout.x, POSITION_SPRING);
      positionY.value = withSpring(layout.y, POSITION_SPRING);
    }
  }, [
    activeWidgetId,
    layout.x,
    layout.y,
    positionX,
    positionY,
    targetX,
    targetY,
    widget.id,
  ]);

  useEffect(() => {
    currentIndexValue.value = currentIndex;
    slotLayouts.value = slots;
  }, [currentIndex, currentIndexValue, slotLayouts, slots]);

  useEffect(() => {
    if (activeWidgetId === widget.id) return;

    isGestureActive.value = false;
    scale.value = withSpring(1, LIFT_SPRING);
  }, [activeWidgetId, isGestureActive, scale, widget.id]);

  useAnimatedReaction(
    () => {
      if (!isGestureActive.value) return null;

      return {
        x: dragOriginX.value + translationX.value,
        y:
          dragOriginY.value +
          translationY.value +
          (scrollOffset.value - dragStartScrollOffset.value),
      };
    },
    (dragPosition) => {
      if (!dragPosition) return;

      const targetIndex = findWidgetReorderTargetIndex(
        slotLayouts.value,
        {
          x: dragPosition.x + layout.width / 2,
          y: dragPosition.y + layout.height / 2,
        },
        currentIndexValue.value,
      );

      if (targetIndex === currentIndexValue.value) return;

      currentIndexValue.value = targetIndex;
      scheduleOnRN(onTargetIndexChange, widget.id, targetIndex);
    },
    [layout.height, layout.width, onTargetIndexChange, widget.id],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .maxPointers(1)
        .activateAfterLongPress(LONG_PRESS_DURATION_MS)
        .shouldCancelWhenOutside(false)
        .onStart(() => {
          completedGesture.value = false;
          isGestureActive.value = true;
          dragOriginX.value = positionX.value;
          dragOriginY.value = positionY.value;
          dragStartScrollOffset.value = scrollOffset.value;
          translationX.value = 0;
          translationY.value = 0;
          scale.value = withSpring(1.025, LIFT_SPRING);
          scheduleOnRN(onDragStart, widget.id);
        })
        .onUpdate((event) => {
          translationX.value = event.translationX;
          translationY.value = event.translationY;

          if (viewportBottom.value <= viewportTop.value) return;

          let nextDirection: -1 | 0 | 1 = 0;

          if (event.absoluteY < viewportTop.value + EDGE_SCROLL_ZONE) {
            nextDirection = -1;
          } else if (
            event.absoluteY >
            viewportBottom.value - EDGE_SCROLL_ZONE
          ) {
            nextDirection = 1;
          }

          if (nextDirection !== edgeDirection.value) {
            edgeDirection.value = nextDirection;
            scheduleOnRN(onEdgeDirectionChange, nextDirection);
          }
        })
        .onEnd(() => {
          completedGesture.value = true;
          // Freeze the lifted card exactly where the gesture ended. The JS drop
          // handler will commit the optimistic layout and start the final spring;
          // targetX/targetY can still describe the previous slot on this frame.
          positionX.value = dragOriginX.value + translationX.value;
          positionY.value =
            dragOriginY.value +
            translationY.value +
            (scrollOffset.value - dragStartScrollOffset.value);
          isGestureActive.value = false;
          edgeDirection.value = 0;
          scale.value = withSpring(1, LIFT_SPRING);
          scheduleOnRN(onEdgeDirectionChange, 0);
          scheduleOnRN(onDrop, widget.id);
        })
        .onFinalize(() => {
          if (completedGesture.value) return;

          isGestureActive.value = false;
          edgeDirection.value = 0;
          positionX.value = withSpring(targetX.value, POSITION_SPRING);
          positionY.value = withSpring(targetY.value, POSITION_SPRING);
          scale.value = withSpring(1, LIFT_SPRING);
          scheduleOnRN(onEdgeDirectionChange, 0);
          scheduleOnRN(onCancel, widget.id);
        }),
    [
      completedGesture,
      dragOriginX,
      dragOriginY,
      dragStartScrollOffset,
      edgeDirection,
      enabled,
      isGestureActive,
      onCancel,
      onDragStart,
      onDrop,
      onEdgeDirectionChange,
      positionX,
      positionY,
      scale,
      scrollOffset,
      targetX,
      targetY,
      translationX,
      translationY,
      viewportBottom,
      viewportTop,
      widget.id,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const active = isGestureActive.value;
    const x = active
      ? dragOriginX.value + translationX.value
      : positionX.value;
    const y = active
      ? dragOriginY.value +
        translationY.value +
        (scrollOffset.value - dragStartScrollOffset.value)
      : positionY.value;

    return {
      zIndex: active ? 1000 : 1,
      elevation: active ? 12 : 0,
      shadowOpacity: active ? 0.24 : 0,
      transform: [{ translateX: x }, { translateY: y }, { scale: scale.value }],
    };
  });

  const isActive = activeWidgetId === widget.id;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        pointerEvents={activeWidgetId && !isActive ? "none" : "auto"}
        style={[
          sortableStyles.item,
          { width: layout.width, height: layout.height },
          animatedStyle,
        ]}
        accessibilityHint={
          isEditing
            ? "Press and hold, then drag in any direction to reorder"
            : undefined
        }
      >
        {renderWidget({
          widget,
          index: currentIndex,
          width: layout.width,
          height: layout.height,
          isActive,
        })}
      </Animated.View>
    </GestureDetector>
  );
}

export default function SortableWidgetGrid({
  widgets,
  enabled,
  isEditing,
  refreshing,
  onRefresh,
  onBeginEditing,
  onReorder,
  renderWidget,
  header,
  style,
  contentContainerStyle,
  horizontalGap,
  verticalGap,
}: SortableWidgetGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [temporaryOrder, setTemporaryOrder] = useState<string[] | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveWidgetDrag | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const viewportRef = useRef<View | null>(null);
  const activeDragRef = useRef<ActiveWidgetDrag | null>(null);
  const orderRef = useRef<string[]>(widgets.map((widget) => widget.id));
  const scrollOffsetRef = useRef(0);
  const scrollContentHeightRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const autoScrollDirectionRef = useRef<-1 | 0 | 1>(0);
  const autoScrollFrameRef = useRef<number | null>(null);
  const scrollOffset = useSharedValue(0);
  const viewportTop = useSharedValue(0);
  const viewportBottom = useSharedValue(0);
  const canonicalIds = useMemo(
    () => widgets.map((widget) => widget.id),
    [widgets],
  );
  const configurationKey = widgets
    .map((widget) => `${widget.id}:${widget.size}`)
    .join("|");
  const widgetsById = useMemo(
    () => new Map(widgets.map((widget) => [widget.id, widget])),
    [widgets],
  );
  const orderedWidgets = useMemo(
    () =>
      (temporaryOrder ?? canonicalIds).flatMap((widgetId) => {
        const widget = widgetsById.get(widgetId);
        return widget ? [widget] : [];
      }),
    [canonicalIds, temporaryOrder, widgetsById],
  );
  const gridLayout = useMemo(
    () =>
      calculateWidgetGridLayout(orderedWidgets, containerWidth, {
        columnCount: 2,
        horizontalGap,
        verticalGap,
      }),
    [containerWidth, horizontalGap, orderedWidgets, verticalGap],
  );
  const layoutsById = useMemo(
    () => new Map(gridLayout.items.map((item) => [item.id, item])),
    [gridLayout.items],
  );
  const indexesById = useMemo(
    () => new Map(orderedWidgets.map((widget, index) => [widget.id, index])),
    [orderedWidgets],
  );

  const stopAutoScroll = useCallback(() => {
    autoScrollDirectionRef.current = 0;

    if (autoScrollFrameRef.current !== null) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }, []);

  const autoScrollTick = useCallback(
    function tick() {
      autoScrollFrameRef.current = null;

      if (!activeDragRef.current || autoScrollDirectionRef.current === 0) {
        return;
      }

      const maximumOffset = Math.max(
        scrollContentHeightRef.current - viewportHeightRef.current,
        0,
      );
      const nextOffset = Math.min(
        Math.max(
          scrollOffsetRef.current +
            autoScrollDirectionRef.current * EDGE_SCROLL_STEP,
          0,
        ),
        maximumOffset,
      );

      if (nextOffset === scrollOffsetRef.current) {
        stopAutoScroll();
        return;
      }

      scrollOffsetRef.current = nextOffset;
      scrollOffset.value = nextOffset;
      scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
      autoScrollFrameRef.current = requestAnimationFrame(tick);
    },
    [scrollOffset, stopAutoScroll],
  );

  const handleEdgeDirectionChange = useCallback(
    (direction: -1 | 0 | 1) => {
      autoScrollDirectionRef.current = direction;

      if (direction === 0) {
        stopAutoScroll();
        return;
      }

      if (autoScrollFrameRef.current === null) {
        autoScrollFrameRef.current = requestAnimationFrame(autoScrollTick);
      }
    },
    [autoScrollTick, stopAutoScroll],
  );

  const updateViewportBounds = useCallback(() => {
    viewportRef.current?.measureInWindow((_x, y, _width, height) => {
      viewportTop.value = y;
      viewportBottom.value = y + height;
      viewportHeightRef.current = height;
    });
  }, [viewportBottom, viewportTop]);

  const cancelDrag = useCallback(
    (widgetId?: string) => {
      if (widgetId && activeDragRef.current?.id !== widgetId) return;

      stopAutoScroll();
      activeDragRef.current = null;
      orderRef.current = canonicalIds;
      setActiveDrag(null);
      setTemporaryOrder(null);
    },
    [canonicalIds, stopAutoScroll],
  );

  const handleDragStart = useCallback(
    (widgetId: string) => {
      if (activeDragRef.current) return;

      const initialOrder = canonicalIds.slice();
      const fromIndex = initialOrder.indexOf(widgetId);

      if (fromIndex < 0) return;

      const nextDrag = { id: widgetId, fromIndex, currentIndex: fromIndex };

      orderRef.current = initialOrder;
      activeDragRef.current = nextDrag;
      setTemporaryOrder(initialOrder);
      setActiveDrag(nextDrag);
      onBeginEditing();
      updateViewportBounds();
      performImpact(Haptics.ImpactFeedbackStyle.Light);
    },
    [canonicalIds, onBeginEditing, updateViewportBounds],
  );

  const handleTargetIndexChange = useCallback(
    (widgetId: string, targetIndex: number) => {
      const drag = activeDragRef.current;

      if (!drag || drag.id !== widgetId) return;

      const currentOrder = orderRef.current;
      const fromIndex = currentOrder.indexOf(widgetId);

      if (
        fromIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= currentOrder.length ||
        targetIndex === fromIndex
      ) {
        return;
      }

      const nextOrder = moveWidgetToIndex(
        currentOrder,
        fromIndex,
        targetIndex,
      );
      const nextDrag = { ...drag, currentIndex: targetIndex };

      orderRef.current = nextOrder;
      activeDragRef.current = nextDrag;
      setTemporaryOrder(nextOrder);
      setActiveDrag(nextDrag);
      performSelection();
    },
    [],
  );

  const handleDrop = useCallback(
    (widgetId: string) => {
      const drag = activeDragRef.current;

      if (!drag || drag.id !== widgetId) return;

      const finalIds = orderRef.current;
      const finalWidgets = finalIds.flatMap((id) => {
        const widget = widgetsById.get(id);
        return widget ? [widget] : [];
      });
      const orderChanged = finalIds.some(
        (id, index) => canonicalIds[index] !== id,
      );

      stopAutoScroll();
      activeDragRef.current = null;
      setActiveDrag(null);
      performImpact(Haptics.ImpactFeedbackStyle.Light);

      if (orderChanged && finalWidgets.length === widgets.length) {
        // Keep the optimistic order mounted until the controlled widgets prop
        // acknowledges it. Clearing it here briefly restores the old order and
        // makes the released widget spring backward before moving forward again.
        setTemporaryOrder(finalIds.slice());
        onReorder(finalWidgets);
      } else {
        orderRef.current = canonicalIds;
        setTemporaryOrder(null);
      }
    },
    [canonicalIds, onReorder, stopAutoScroll, widgets.length, widgetsById],
  );

  useEffect(() => {
    if (activeDragRef.current) {
      cancelDrag();
      return;
    }

    orderRef.current = canonicalIds;
    setTemporaryOrder(null);
  }, [cancelDrag, canonicalIds, configurationKey]);

  useEffect(() => {
    if (enabled) return;
    cancelDrag();
  }, [cancelDrag, enabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") cancelDrag();
    });

    return () => subscription.remove();
  }, [cancelDrag]);

  useEffect(
    () => () => {
      stopAutoScroll();
    },
    [stopAutoScroll],
  );

  const handleGridLayout = useCallback((event: LayoutChangeEvent) => {
    const measuredWidth = event.nativeEvent.layout.width;

    setContainerWidth((currentWidth) =>
      Math.abs(currentWidth - measuredWidth) > 0.5
        ? measuredWidth
        : currentWidth,
    );
  }, []);

  const handleViewportLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeightRef.current = event.nativeEvent.layout.height;
      updateViewportBounds();
    },
    [updateViewportBounds],
  );

  return (
    <View
      ref={viewportRef}
      style={style}
      onLayout={handleViewportLayout}
    >
      <ScrollView
        ref={scrollRef}
        style={sortableStyles.scroll}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!activeDrag}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={(_width, height) => {
          scrollContentHeightRef.current = height;
        }}
        onScroll={(event) => {
          const nextOffset = event.nativeEvent.contentOffset.y;
          scrollOffsetRef.current = nextOffset;
          scrollOffset.value = nextOffset;
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            enabled={!activeDrag}
            onRefresh={() => {
              void onRefresh();
            }}
          />
        }
      >
        {header}

        <View
          onLayout={handleGridLayout}
          style={[
            sortableStyles.grid,
            { height: Math.max(gridLayout.contentHeight, 1) },
          ]}
        >
          {widgets.map((widget) => {
            const layout = layoutsById.get(widget.id);
            const currentIndex = indexesById.get(widget.id);

            if (!layout || currentIndex === undefined || containerWidth <= 0) {
              return null;
            }

            return (
              <SortableWidget
                key={widget.id}
                widget={widget}
                layout={layout}
                slots={gridLayout.items}
                currentIndex={currentIndex}
                enabled={enabled}
                isEditing={isEditing}
                activeWidgetId={activeDrag?.id ?? null}
                scrollOffset={scrollOffset}
                viewportTop={viewportTop}
                viewportBottom={viewportBottom}
                onDragStart={handleDragStart}
                onTargetIndexChange={handleTargetIndexChange}
                onDrop={handleDrop}
                onCancel={cancelDrag}
                onEdgeDirectionChange={handleEdgeDirectionChange}
                renderWidget={renderWidget}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const sortableStyles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  grid: {
    position: "relative",
    width: "100%",
    overflow: "visible",
  },
  item: {
    position: "absolute",
    top: 0,
    left: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
  },
});
