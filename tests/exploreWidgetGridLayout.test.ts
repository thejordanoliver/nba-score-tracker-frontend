import assert from "node:assert/strict";
import test from "node:test";
import type { ExploreWidgetSize } from "../types/widgets";
import {
  calculateWidgetGridLayout,
  findWidgetReorderTargetIndex,
  moveWidgetToIndex,
  type WidgetGridItem,
  type WidgetGridLayoutItem,
} from "../utils/exploreWidgetLayout";

const WIDTH = 390;
const HORIZONTAL_GAP = 12;
const VERTICAL_GAP = 16;

const items = (
  definitions: readonly (readonly [id: string, size: ExploreWidgetSize])[],
): WidgetGridItem[] =>
  definitions.map(([id, size]) => ({
    id,
    size,
  }));

const layout = (widgets: readonly WidgetGridItem[], width = WIDTH) =>
  calculateWidgetGridLayout(widgets, width, {
    columnCount: 2,
    horizontalGap: HORIZONTAL_GAP,
    verticalGap: VERTICAL_GAP,
  });

const center = (item: WidgetGridLayoutItem) => ({
  x: item.x + item.width / 2,
  y: item.y + item.height / 2,
});

const assertValidLayout = (
  widgets: readonly WidgetGridItem[],
  width = WIDTH,
) => {
  const result = layout(widgets, width);

  assert.equal(result.items.length, widgets.length);

  result.items.forEach((item) => {
    assert.ok(item.x >= 0);
    assert.ok(item.y >= 0);
    assert.ok(item.width > 0);
    assert.ok(item.height > 0);
    assert.ok(item.x + item.width <= width + Number.EPSILON);
    assert.ok(item.y + item.height <= result.contentHeight);
  });

  for (let firstIndex = 0; firstIndex < result.items.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < result.items.length;
      secondIndex += 1
    ) {
      const first = result.items[firstIndex];
      const second = result.items[secondIndex];
      const overlaps =
        first.x < second.x + second.width &&
        first.x + first.width > second.x &&
        first.y < second.y + second.height &&
        first.y + first.height > second.y;

      assert.equal(overlaps, false, `${first.id} overlaps ${second.id}`);
    }
  }

  return result;
};

test("all-small widgets pack into measured two-column rows", () => {
  const widgets = items([
    ["A", "small"],
    ["B", "small"],
    ["C", "small"],
    ["D", "small"],
    ["E", "small"],
    ["F", "small"],
  ]);
  const result = assertValidLayout(widgets);

  assert.deepEqual(
    result.items.map(({ id, column, row }) => ({ id, column, row })),
    [
      { id: "A", column: 0, row: 0 },
      { id: "B", column: 1, row: 0 },
      { id: "C", column: 0, row: 1 },
      { id: "D", column: 1, row: 1 },
      { id: "E", column: 0, row: 2 },
      { id: "F", column: 1, row: 2 },
    ],
  );
  assert.equal(result.columnWidth, (WIDTH - HORIZONTAL_GAP) / 2);
});

test("all-small reorder cases preserve a valid grid", () => {
  const original = items([
    ["A", "small"],
    ["B", "small"],
    ["C", "small"],
    ["D", "small"],
    ["E", "small"],
    ["F", "small"],
  ]);
  const cases = [
    { from: 5, to: 0, expected: ["F", "A", "B", "C", "D", "E"] },
    { from: 0, to: 3, expected: ["B", "C", "D", "A", "E", "F"] },
    { from: 2, to: 4, expected: ["A", "B", "D", "E", "C", "F"] },
  ];

  cases.forEach(({ from, to, expected }) => {
    const reordered = moveWidgetToIndex(original, from, to);
    assert.deepEqual(
      reordered.map((widget) => widget.id),
      expected,
    );
    assertValidLayout(reordered);
  });
});

test("mixed sizes use one deterministic span-aware packing model", () => {
  const widgets = items([
    ["A", "small"],
    ["B", "small"],
    ["C", "medium"],
    ["D", "small"],
    ["E", "small"],
    ["F", "large"],
  ]);
  const result = assertValidLayout(widgets);

  assert.deepEqual(
    result.items.map(({ id, span, column, row }) => ({
      id,
      span,
      column,
      row,
    })),
    [
      { id: "A", span: 1, column: 0, row: 0 },
      { id: "B", span: 1, column: 1, row: 0 },
      { id: "C", span: 2, column: 0, row: 1 },
      { id: "D", span: 1, column: 0, row: 2 },
      { id: "E", span: 1, column: 1, row: 2 },
      { id: "F", span: 2, column: 0, row: 3 },
    ],
  );
  assert.equal(result.items[2].width, WIDTH);
  assert.equal(result.items[5].width, WIDTH);
});

test("mixed-size reorder cases never overlap", () => {
  const original = items([
    ["A", "small"],
    ["B", "small"],
    ["C", "medium"],
    ["D", "small"],
    ["E", "small"],
    ["F", "large"],
  ]);
  const cases = [
    { from: 4, to: 0, expected: ["E", "A", "B", "C", "D", "F"] },
    { from: 2, to: 5, expected: ["A", "B", "D", "E", "F", "C"] },
    { from: 0, to: 2, expected: ["B", "C", "A", "D", "E", "F"] },
    { from: 5, to: 0, expected: ["F", "A", "B", "C", "D", "E"] },
  ];

  cases.forEach(({ from, to, expected }) => {
    const reordered = moveWidgetToIndex(original, from, to);
    assert.deepEqual(
      reordered.map((widget) => widget.id),
      expected,
    );
    assertValidLayout(reordered);
  });
});

test("target detection supports horizontal, vertical, and diagonal movement", () => {
  const result = layout(
    items([
      ["A", "small"],
      ["B", "small"],
      ["C", "small"],
      ["D", "small"],
    ]),
  );
  const [a, b, c, d] = result.items;

  assert.equal(findWidgetReorderTargetIndex(result.items, center(a), 1), 0);
  assert.equal(findWidgetReorderTargetIndex(result.items, center(c), 3), 2);
  assert.equal(findWidgetReorderTargetIndex(result.items, center(a), 3), 0);
  assert.equal(findWidgetReorderTargetIndex(result.items, center(b), 0), 1);
  assert.equal(findWidgetReorderTargetIndex(result.items, center(d), 0), 3);
});

test("target detection crosses full-span rows in mixed-size layouts", () => {
  const result = layout(
    items([
      ["A", "small"],
      ["B", "small"],
      ["C", "medium"],
      ["D", "small"],
      ["E", "small"],
      ["F", "large"],
    ]),
  );
  const a = result.items[0];
  const c = result.items[2];
  const e = result.items[4];
  const f = result.items[5];

  assert.equal(findWidgetReorderTargetIndex(result.items, center(a), 4), 0);
  assert.equal(findWidgetReorderTargetIndex(result.items, center(f), 2), 5);
  assert.equal(findWidgetReorderTargetIndex(result.items, center(c), 0), 2);
  assert.equal(findWidgetReorderTargetIndex(result.items, center(a), 5), 0);
  assert.equal(findWidgetReorderTargetIndex(result.items, center(e), 0), 4);
});

test("target hysteresis ignores tiny movement around the active slot", () => {
  const result = layout(
    items([
      ["A", "small"],
      ["B", "small"],
    ]),
  );
  const activeCenter = center(result.items[0]);

  assert.equal(
    findWidgetReorderTargetIndex(
      result.items,
      { x: activeCenter.x + 8, y: activeCenter.y + 5 },
      0,
    ),
    0,
  );
});

test("one and two widget boards remain stable", () => {
  const one = items([["A", "small"]]);
  const two = items([
    ["A", "small"],
    ["B", "small"],
  ]);

  assertValidLayout(one);
  assert.deepEqual(moveWidgetToIndex(one, 0, 0), one);
  assert.deepEqual(
    moveWidgetToIndex(two, 1, 0).map((widget) => widget.id),
    ["B", "A"],
  );
  assert.deepEqual(
    moveWidgetToIndex(two, 0, 1).map((widget) => widget.id),
    ["B", "A"],
  );
  assertValidLayout(moveWidgetToIndex(two, 1, 0));
});

test("many widgets remain responsive and extend beyond one viewport", () => {
  const sizes: ExploreWidgetSize[] = ["small", "small", "medium", "large"];
  const widgets = items(
    Array.from({ length: 24 }, (_, index) => [
      `widget-${index}`,
      sizes[index % sizes.length],
    ] as const),
  );

  const phoneLayout = assertValidLayout(widgets, 360);
  const tabletLayout = assertValidLayout(widgets, 768);

  assert.ok(phoneLayout.contentHeight > 800);
  assert.equal(tabletLayout.items[0].width, (768 - HORIZONTAL_GAP) / 2);
});
