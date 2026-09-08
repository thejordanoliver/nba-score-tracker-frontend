// utils/dateUtils.ts

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function shouldShowGameChat(gameDate: Date | null): boolean {
  if (!gameDate || Number.isNaN(gameDate.getTime())) {
    return false;
  }

  // Start at midnight on the calendar day of the game.
  const chatStart = new Date(gameDate);
  chatStart.setHours(0, 0, 0, 0);
  chatStart.setDate(chatStart.getDate() - 0);

  // End at midnight on the calendar day after the game.
  const chatEnd = new Date(gameDate);
  chatEnd.setHours(0, 0, 0, 0);
  chatEnd.setDate(chatEnd.getDate() + 1);

  const currentTime = Date.now();

  return currentTime >= chatStart.getTime() && currentTime < chatEnd.getTime();
}

export function formatDateToUTCYYYYMMDD(
  value: Date | string | number | null | undefined,
) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    if (/^\d{8}$/.test(trimmedValue)) {
      return trimmedValue;
    }

    value = trimmedValue;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return [
    date.getUTCFullYear(),
    padDatePart(date.getUTCMonth() + 1),
    padDatePart(date.getUTCDate()),
  ].join("");
}

export const isTodayOrTomorrow = (dateString: string) => {
  const gameDate = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return (
    (gameDate >= today && gameDate < new Date(today.getTime() + 86400000)) ||
    (gameDate >= tomorrow && gameDate < new Date(tomorrow.getTime() + 86400000))
  );
};

export function getNBASeason(): number {
  const today = dayjs();
  const year = today.year();
  const month = today.month() + 1; // 1–12

  // Beginning in September, use the upcoming season's ending year.
  // September 2026–December 2026 represents the 2026–2027 season.
  if (month >= 9) {
    return year + 1;
  }

  // January–August use the current calendar year.
  // January 2026–August 2026 represents the 2025–2026 season.
  return year;
}

export function getWNBASeason(): number {
  const today = dayjs();
  const year = today.year();
  const month = today.month() + 1; // 1–12

  // Beginning in March, use the upcoming/current WNBA season.
  if (month >= 3) {
    return year;
  }

  // January–February continue showing the previous WNBA season.
  return year - 1;
}

export function getCBBSeason(): number {
  const today = dayjs();
  const year = today.year();
  const month = today.month() + 1; // 1–12

  // January–July use the season ending in the current year.
  // Example: January–July 2026 returns 2026.
  if (month <= 8) {
    return year;
  }

  // August–December use the upcoming season's ending year.
  // Example: August–December 2026 returns 2027.
  return year + 1;
}

export function getMLBSeason(date: Date = new Date()): string {
  // MLB seasons use a single calendar year.
  return String(date.getFullYear());
}

export function getNHLSeason(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = January, 9 = October

  // January–September belong to the season that started last year.
  if (month < 9) {
    return String(year - 1);
  }

  // October–December begin the season for the current year.
  return String(year);
}

export function getNBACalendarSeason(): string {
  const today = dayjs();
  const year = today.year();
  const month = today.month() + 1; // 1–12

  return String(month >= 10 ? year + 1 : year);
}

export function getFootballSeason(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return month < 5 ? year - 1 : year;
}

export function getRecruitYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  return month < 7 ? year + 1 : year;
}

export const getHolidayLabel = (
  date: Date | null | undefined,
): string | null => {
  if (!date) return null;

  const month = date.getMonth(); // 0 = Jan, 11 = Dec
  const day = date.getDate();

  if (month === 11 && day === 25) return "Christmas Day";
  if (month === 0 && day === 1) return "New Year's Day";

  return null; // add more holidays here if needed
};

export function getMLBStandingsSeason(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = Jan, 1 = Feb, 2 = March

  // Before March (Jan & Feb) → use previous season
  if (month < 2) {
    return String(year - 1);
  }

  // March and later → use current year
  return String(year);
}

export const calculateAge = (birthDate?: string | null) => {
  if (!birthDate) return null;
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
};

export const formatBirth = (birthDate: string | null) => {
  if (!birthDate) return null;
  return new Date(birthDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const safeDate = (date?: string | null) => {
  if (!date) return new Date();
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const formatTime = (date: Date) => {
  return (
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) || ""
  );
};

export function filterByDate<
  Game extends { date?: string | number | Date | null },
>(games: readonly Game[], date: Date): Game[] {
  const selectedLocal = dayjs(date).format("YYYY-MM-DD");

  return games.filter((g) => {
    if (!g.date) return false;
    const gameLocal = dayjs(g.date).format("YYYY-MM-DD");
    return gameLocal === selectedLocal;
  });
}
