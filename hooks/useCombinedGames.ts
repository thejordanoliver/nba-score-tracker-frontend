// hooks/useCombinedGames.ts
import { Game, summerGame } from "types/types";
import { isTodayOrTomorrow } from "utils/dateUtils";
import { mapSummerGameToGame } from "utils/gameUtils";

export function useCombinedGames(
  weeklyGames: Game[],
  summerGames: summerGame[]
) {
  const filteredWeekly = weeklyGames.filter((g) => isTodayOrTomorrow(g.date));
  const filteredSummer = summerGames.filter((g) =>
    isTodayOrTomorrow(g.date)
  );

  const onlySummerLeagueToday =
    filteredWeekly.length === 0 && filteredSummer.length > 0;

  const combinedGames = [...filteredWeekly];
  filteredSummer.forEach((g) => {
    if (!combinedGames.some((cg) => cg.id === g.id)) {
      combinedGames.push(mapSummerGameToGame(g));
    }
  });

  return { combinedGames, filteredSummer, onlySummerLeagueToday };
}
