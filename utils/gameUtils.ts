// utils/gameUtils.ts
import { Game, summerGame } from "types/types";

export function mapSummerGameToGame(g: summerGame): Game {
  return {
    ...g,
    status:
      g.status.short === "FT"
        ? "Final"
        : g.status.short === "NS"
        ? "Scheduled"
        : "In Progress",
    period: g.period !== undefined ? String(g.period) : undefined,
  };
}

