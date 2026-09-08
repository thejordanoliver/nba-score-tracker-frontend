import type {
  ScheduleMonthGroup,
  ScheduleMonthKey,
  ScheduleMonthOption,
} from "types/schedule";

type GameWithDate = {
  date?: string | null;
};

const SHORT_MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type ScheduleMonthSelection = {
  scheduleIdentity: string;
  selectedMonthKey: ScheduleMonthKey | null;
};

export function getCurrentScheduleMonthKey(
  date: Date = new Date(),
): ScheduleMonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getScheduleMonthKey(
  dateValue: string | Date | null | undefined,
): ScheduleMonthKey | null {
  if (!dateValue) return null;

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  if (Number.isNaN(date.getTime())) return null;

  // Backend schedule groups use UTC calendar months; preserve that contract.
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function buildScheduleMonthOptions<TGame>(
  monthGroups: readonly ScheduleMonthGroup<TGame>[],
): ScheduleMonthOption[] {
  return monthGroups
    .flatMap((group) => {
      if (
        typeof group.year !== "number" ||
        typeof group.month !== "number" ||
        group.month < 1 ||
        group.month > 12
      ) {
        return [];
      }

      return [
        {
          key: group.key,
          label: SHORT_MONTH_LABELS[group.month - 1],
          count: group.games.length,
        },
      ];
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function resolveScheduleMonthSelection(
  selection: ScheduleMonthSelection,
  scheduleIdentity: string,
  months: readonly ScheduleMonthOption[],
  currentMonthKey: ScheduleMonthKey = getCurrentScheduleMonthKey(),
): ScheduleMonthSelection {
  const availableKeys = new Set(months.map((month) => month.key));
  const canPreserveSelection =
    selection.scheduleIdentity === scheduleIdentity &&
    selection.selectedMonthKey !== null &&
    availableKeys.has(selection.selectedMonthKey);

  const selectedMonthKey = canPreserveSelection
    ? selection.selectedMonthKey
    : availableKeys.has(currentMonthKey)
      ? currentMonthKey
      : (months[0]?.key ?? null);

  return {
    scheduleIdentity,
    selectedMonthKey,
  };
}

export function getScheduleGamesForMonth<TGame>(
  monthGroups: readonly ScheduleMonthGroup<TGame>[],
  selectedMonthKey: ScheduleMonthKey | null,
): TGame[] {
  if (!selectedMonthKey) return [];

  return (
    monthGroups.find((group) => group.key === selectedMonthKey)?.games ?? []
  );
}

export function isScheduleOpeningMonth<TGame extends GameWithDate>(
  firstSeasonGame: TGame | null,
  selectedMonthKey: ScheduleMonthKey | null,
): boolean {
  if (!firstSeasonGame || !selectedMonthKey) return false;

  return getScheduleMonthKey(firstSeasonGame.date) === selectedMonthKey;
}
