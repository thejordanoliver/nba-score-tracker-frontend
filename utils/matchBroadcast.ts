// utils/matchBroadcast.ts

type SimpleTeam = {
  name: string;
};

type SimpleGame = {
  date: string;
  home: SimpleTeam;
  away: SimpleTeam;
};

type BroadcastEntry = {
  gameId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  name: string;
  status: string;
  broadcasts: {
    market: any;
    type?: any;
    name?: string;
    network?: string | null;
  }[];
};

export function normalizeTeamName(name: string): string {
  return name?.toLowerCase().replace(/[^a-z]/g, "");
}

export function matchBroadcastToGame(
  game: SimpleGame,
  broadcastData?: BroadcastEntry[]
) {
  if (!Array.isArray(broadcastData)) return null;

  const gameDate = game.date.split("T")[0]; // e.g., 2025-08-01
  const awayName = normalizeTeamName(game.away.name);
  const homeName = normalizeTeamName(game.home.name);

  return broadcastData.find((b) => {
    const dateMatch = b.date === gameDate;
    const homeMatch = normalizeTeamName(b.homeTeam) === homeName;
    const awayMatch = normalizeTeamName(b.awayTeam) === awayName;

    return dateMatch && homeMatch && awayMatch;
  });
}
