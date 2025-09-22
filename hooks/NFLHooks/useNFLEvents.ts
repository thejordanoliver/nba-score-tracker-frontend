import { useState, useEffect, useMemo } from "react";
import axios from "axios";

type Team = {
  id: number;
  name: string;
  logo: string;
};

type Player = {
  id: number;
  name: string;
  image: string;
};

type GameEvent = {
  quarter: string;
  minute: string;
  team: Team;
  player: Player;
  type: string;
  comment: string;
  score: {
    home: number;
    away: number;
  };
};

type UseNFLGameEventsResult = {
  events: GameEvent[] | null;
  loading: boolean;
  error: string | null;
};

const KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;

export function useNFLGameEvents(gameId: string | number): UseNFLGameEventsResult {
  const [rawEvents, setRawEvents] = useState<GameEvent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameId) return;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      const options = {
        method: "GET",
        url: "https://api-american-football.p.rapidapi.com/games/events",
        params: { id: gameId },
        headers: {
          "x-rapidapi-key": `${KEY}`,
          "x-rapidapi-host": "api-american-football.p.rapidapi.com",
        },
      };

      try {
        const response = await axios.request(options);
        setRawEvents(response.data.response);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error fetching game events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [gameId]);

  // Memoize the events so the reference only changes when rawEvents actually changes
  const events = useMemo(() => rawEvents, [rawEvents]);

  return { events, loading, error };
}
