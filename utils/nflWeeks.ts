import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

export type NFLWeek = {
  label: string;
  stage: string;
  weekNumber: number;
  start: dayjs.Dayjs;
  end: dayjs.Dayjs;
};

/**
 * Generate all NFL weeks for a given season
 */
export function generateNFLWeeks(): NFLWeek[] {
  const result: NFLWeek[] = [];

  // --- Preseason ---
  const preseasonStarts = [
    dayjs("2025-08-07"), // Pre1 Thu
    dayjs("2025-08-14"), // Pre2 Thu
    dayjs("2025-08-21"), // Pre3 Thu
  ];
  preseasonStarts.forEach((start, i) => {
    result.push({
      label: `Pre Wk ${i + 1}`,
      stage: "Preseason",
      weekNumber: i + 1,
      start,
      end: start.add(6, "day"),
    });
  });

  // --- Regular Season ---
  const regularStart = dayjs("2025-09-04"); // Thu, Week 1
  for (let i = 0; i < 18; i++) {
    const start = regularStart.add(i, "week");
    const end = start.add(6, "day");
    result.push({
      label: `Week ${i + 1}`,
      stage: "Regular Season",
      weekNumber: i + 1,
      start,
      end,
    });
  }

  // --- Playoffs ---
  const playoffs = [
    { label: "Wild Card", start: dayjs("2026-01-03"), end: dayjs("2026-01-05") },
    { label: "Divisional Round", start: dayjs("2026-01-10"), end: dayjs("2026-01-12") },
    { label: "Conference Championships", start: dayjs("2026-01-18"), end: dayjs("2026-01-19") },
    { label: "Super Bowl", start: dayjs("2026-02-02"), end: dayjs("2026-02-02") },
  ];

  playoffs.forEach((p, i) => {
    result.push({
      label: p.label,
      stage: i < 3 ? "Playoffs" : "Super Bowl",
      weekNumber: i + 1,
      start: p.start,
      end: p.end,
    });
  });

  return result;
}

/**
 * Auto-detect the current week index based on today
 */
export function getCurrentWeekIndex(weeks: NFLWeek[]): number {
  const today = dayjs();
  let index = weeks.findIndex((w) => today.isBetween(w.start, w.end, null, "[]"));

  if (index === -1) {
    // pick the closest past week
    const pastWeeks = weeks.filter((w) => today.isAfter(w.end));
    if (pastWeeks.length > 0) {
      index = weeks.indexOf(pastWeeks[pastWeeks.length - 1]);
    } else {
      // before first week → first week
      index = 0;
    }
  }

  return index;
}
