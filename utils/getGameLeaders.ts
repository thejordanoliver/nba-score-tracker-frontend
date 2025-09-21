// utils/getGameLeaders.ts
import { PlayerInfo } from "types/types";

type StatCategory = "points" | "rebounds" | "assists";

export function getTopPlayerByStat(
  stats: any[],
  category: StatCategory
): any | null {
  if (!stats || stats.length === 0) return null;

  return stats.reduce((top, current) =>
    (current[category] || 0) > (top[category] || 0) ? current : top
  );
}
