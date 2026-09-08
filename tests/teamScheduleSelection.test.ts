import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's type-stripping test runner requires the .ts extension.
import { getFirstSeasonGame } from "../utils/seasonGames.ts";
// @ts-expect-error Node's type-stripping test runner requires the .ts extension.
import * as teamSchedule from "../utils/teamSchedule.ts";

const {
  buildScheduleMonthOptions,
  getScheduleGamesForMonth,
  isScheduleOpeningMonth,
  resolveScheduleMonthSelection,
} = teamSchedule;

const months = [
  { key: "2026-10", label: "Oct", count: 2 },
  { key: "2026-11", label: "Nov", count: 3 },
  { key: "2026-12", label: "Dec", count: 4 },
  { key: "2027-01", label: "Jan", count: 5 },
  { key: "2027-02", label: "Feb", count: 6 },
];

test("initial selection uses the current month when it is available", () => {
  const selection = resolveScheduleMonthSelection(
    { scheduleIdentity: "nba:1:2027", selectedMonthKey: null },
    "nba:1:2027",
    months,
    "2027-01",
  );

  assert.equal(selection.selectedMonthKey, "2027-01");
});

test("initial selection falls back to the first chronological month", () => {
  const selection = resolveScheduleMonthSelection(
    { scheduleIdentity: "nba:1:2027", selectedMonthKey: null },
    "nba:1:2027",
    months,
    "2026-09",
  );

  assert.equal(selection.selectedMonthKey, "2026-10");
});

test("cross-year backend groups normalize to ordered canonical keys", () => {
  const options = buildScheduleMonthOptions([
    {
      key: "2027-01",
      label: "January 2027",
      year: 2027,
      month: 1,
      games: [{ id: 3 }],
    },
    {
      key: "2026-11",
      label: "November 2026",
      year: 2026,
      month: 11,
      games: [{ id: 1 }, { id: 2 }],
    },
  ]);

  assert.deepEqual(options, [
    { key: "2026-11", label: "Nov", count: 2 },
    { key: "2027-01", label: "Jan", count: 1 },
  ]);
});

test("a live update preserves a selected month that still exists", () => {
  const selection = resolveScheduleMonthSelection(
    { scheduleIdentity: "nba:1:2027", selectedMonthKey: "2027-01" },
    "nba:1:2027",
    months.map((month) => ({ ...month, count: month.count + 1 })),
    "2026-10",
  );

  assert.equal(selection.selectedMonthKey, "2027-01");
});

test("a removed selected month uses the deterministic fallback", () => {
  const selection = resolveScheduleMonthSelection(
    { scheduleIdentity: "nba:1:2027", selectedMonthKey: "2027-01" },
    "nba:1:2027",
    months.filter((month) => month.key !== "2027-01"),
    "2026-11",
  );

  assert.equal(selection.selectedMonthKey, "2026-11");
});

test("a schedule identity change does not preserve the old selection", () => {
  const selection = resolveScheduleMonthSelection(
    { scheduleIdentity: "nba:1:2027", selectedMonthKey: "2027-01" },
    "nba:2:2027",
    months,
    "2026-11",
  );

  assert.deepEqual(selection, {
    scheduleIdentity: "nba:2:2027",
    selectedMonthKey: "2026-11",
  });
});

test("selected games and countdown derive from their correct schedule scopes", () => {
  const allGames = [
    { id: 2, date: "2026-11-10T00:00:00Z" },
    { id: 1, date: "2026-10-05T00:00:00Z" },
  ];
  const groups = [
    {
      key: "2026-10",
      label: "October 2026",
      year: 2026,
      month: 10,
      games: [allGames[1]],
    },
    {
      key: "2026-11",
      label: "November 2026",
      year: 2026,
      month: 11,
      games: [allGames[0]],
    },
  ];

  const firstSeasonGame = getFirstSeasonGame(allGames);

  assert.deepEqual(getScheduleGamesForMonth(groups, "2026-11"), [allGames[0]]);
  assert.equal(firstSeasonGame?.id, 1);
  assert.equal(isScheduleOpeningMonth(firstSeasonGame, "2026-10"), true);
  assert.equal(isScheduleOpeningMonth(firstSeasonGame, "2026-11"), false);
});
