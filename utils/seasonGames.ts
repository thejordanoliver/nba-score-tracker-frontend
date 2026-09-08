type GameWithDate = {
  date?: string | null;
};

function getValidDateTime(dateValue: string | Date | null | undefined) {
  if (!dateValue) return null;

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const time = date.getTime();

  return Number.isNaN(time) ? null : time;
}

export function getFirstSeasonGame<T extends GameWithDate>(
  games: readonly T[] | null | undefined,
): T | null {
  return (
    games?.reduce<{ game: T | null; time: number | null }>(
      (earliest, game) => {
        const time = getValidDateTime(game.date);

        if (time === null) return earliest;

        if (earliest.time === null || time < earliest.time) {
          return { game, time };
        }

        return earliest;
      },
      { game: null, time: null },
    ).game ?? null
  );
}
