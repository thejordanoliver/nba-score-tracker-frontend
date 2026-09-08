import { EXPLORE_WIDGET_HEIGHTS } from "constants/exploreWidgetSizes";
import type { ExploreWidgetConfig, ExploreWidgetSize } from "types/widgets";

export type WidgetGridSpan = 1 | 2;

export type WidgetGridItem = Pick<
  ExploreWidgetConfig,
  "id" | "size"
>;

export type WidgetGridLayoutItem = {
  id: string;
  index: number;
  span: WidgetGridSpan;
  column: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WidgetGridLayout = {
  items: WidgetGridLayoutItem[];
  contentHeight: number;
  columnWidth: number;
};

export type WidgetGridPoint = {
  x: number;
  y: number;
};

type WidgetGridLayoutOptions = {
  columnCount?: number;
  horizontalGap?: number;
  verticalGap?: number;
  heights?: Readonly<Record<ExploreWidgetSize, number>>;
};

export const getExploreWidgetSpan = (
  size: ExploreWidgetSize,
): WidgetGridSpan => (size === "small" ? 1 : 2);

/**
 * Packs ordered widgets into responsive rows. Coordinates are derived state;
 * only widget order and size are persisted by the configuration layer.
 */
export const calculateWidgetGridLayout = (
  widgets: readonly WidgetGridItem[],
  containerWidth: number,
  options: WidgetGridLayoutOptions = {},
): WidgetGridLayout => {
  const columnCount = Math.max(Math.floor(options.columnCount ?? 2), 1);
  const horizontalGap = Math.max(options.horizontalGap ?? 0, 0);
  const verticalGap = Math.max(options.verticalGap ?? 0, 0);
  const heights = options.heights ?? EXPLORE_WIDGET_HEIGHTS;
  const usableWidth = Math.max(
    containerWidth - horizontalGap * (columnCount - 1),
    1,
  );
  const columnWidth = usableWidth / columnCount;
  const items: WidgetGridLayoutItem[] = [];
  let cursorColumn = 0;
  let row = 0;
  let rowY = 0;
  let rowHeight = 0;
  let contentHeight = 0;

  const advanceRow = () => {
    if (rowHeight <= 0) return;

    rowY += rowHeight + verticalGap;
    row += 1;
    cursorColumn = 0;
    rowHeight = 0;
  };

  widgets.forEach((widget, index) => {
    const requestedSpan = getExploreWidgetSpan(widget.size);
    const span = Math.min(requestedSpan, columnCount) as WidgetGridSpan;

    if (cursorColumn > 0 && span > columnCount - cursorColumn) {
      advanceRow();
    }

    const width =
      columnWidth * span + horizontalGap * Math.max(span - 1, 0);
    const height = heights[widget.size];
    const x = cursorColumn * (columnWidth + horizontalGap);

    items.push({
      id: widget.id,
      index,
      span,
      column: cursorColumn,
      row,
      x,
      y: rowY,
      width,
      height,
    });

    contentHeight = Math.max(contentHeight, rowY + height);
    cursorColumn += span;
    rowHeight = Math.max(rowHeight, height);

    if (cursorColumn >= columnCount) {
      advanceRow();
    }
  });

  return { items, contentHeight, columnWidth };
};

const normalizedCenterDistance = (
  layout: WidgetGridLayoutItem,
  point: WidgetGridPoint,
) => {
  "worklet";

  const halfWidth = Math.max(layout.width / 2, 1);
  const halfHeight = Math.max(layout.height / 2, 1);
  const dx = (point.x - (layout.x + halfWidth)) / halfWidth;
  const dy = (point.y - (layout.y + halfHeight)) / halfHeight;

  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Returns a logical destination only after the dragged center clearly enters a
 * new slot. The normalized hysteresis keeps narrow and full-width cells stable.
 */
export const findWidgetReorderTargetIndex = (
  layouts: readonly WidgetGridLayoutItem[],
  draggedCenter: WidgetGridPoint,
  currentIndex: number,
  hysteresis = 0.16,
): number => {
  "worklet";

  if (layouts.length <= 1) return 0;

  let candidate = layouts[0];
  let candidateDistance = normalizedCenterDistance(candidate, draggedCenter);

  for (let index = 1; index < layouts.length; index += 1) {
    const layout = layouts[index];
    const distance = normalizedCenterDistance(layout, draggedCenter);

    if (distance < candidateDistance) {
      candidate = layout;
      candidateDistance = distance;
    }
  }

  const current =
    layouts.find((layout) => layout.index === currentIndex) ?? layouts[0];

  if (candidate.index === current.index) return current.index;

  const insetX = Math.min(candidate.width * 0.18, 24);
  const insetY = Math.min(candidate.height * 0.12, 24);
  const isInsideCandidateCore =
    draggedCenter.x >= candidate.x + insetX &&
    draggedCenter.x <= candidate.x + candidate.width - insetX &&
    draggedCenter.y >= candidate.y + insetY &&
    draggedCenter.y <= candidate.y + candidate.height - insetY;
  const currentDistance = normalizedCenterDistance(current, draggedCenter);

  if (
    isInsideCandidateCore ||
    candidateDistance + Math.max(hysteresis, 0) < currentDistance
  ) {
    return candidate.index;
  }

  return current.index;
};

export const moveWidgetToIndex = <T,>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] => {
  if (
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return items.slice();
  }

  const nextItems = items.slice();
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
};
