import { useEffect, useState } from "react";
import axios from "axios";

export type NFLPlayerStat = {
  name: string; // e.g. "comp att", "yards"
  value: string | number | null;
};

export interface NFLPlayer {
  id: string;
  name: string;
  group: string;
  stats: { name: string; value: string | number }[];
  team?: { id: number; name: string }; // 👈 instead of teamId
}


const KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

export function useNFLGameLeaders(gameId: string, teamId: string) {
  const [players, setPlayers] = useState<NFLPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchLeaders() {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await axios.get(
          "https://api-american-football.p.rapidapi.com/games/statistics/players",
          {
            params: { id: gameId, team: teamId },
            headers: {
              "x-rapidapi-key": KEY,
              "x-rapidapi-host": "api-american-football.p.rapidapi.com",
            },
          }
        );

        if (!isMounted) return;

        const raw = response.data?.response?.[0];
        if (!raw?.groups) {
          setPlayers([]);
          return;
        }

        // Flatten groups into players with stats
const formatted: NFLPlayer[] = raw.groups.flatMap((group: any) =>
  group.players.map((p: any) => ({
    id: Number(p.player?.id) || Math.random(),
    name: p.player?.name ?? "Unknown",
    image: p.player?.image ?? undefined,
    group: group.name,
    stats: (p.statistics || []).map((s: any) => ({
      name: s.name,
      value: s.value,
    })),
    team: p.team
      ? {
          id: Number(p.team.id),
          name: p.team.name, // ← often abbreviation like "GB"
        }
      : undefined,
  }))
);

// console.log(JSON.stringify(raw.groups, null, 1));

        setPlayers(formatted);
      } catch (err) {
        console.error("Error fetching NFL game leaders", err);
        setIsError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchLeaders();
    return () => {
      isMounted = false;
    };
  }, [gameId, teamId]);

  return { players, isLoading, isError };
}
