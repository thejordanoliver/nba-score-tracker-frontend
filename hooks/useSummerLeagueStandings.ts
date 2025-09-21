import { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const RATE_LIMIT_MS = 30 * 1000;

type Standing = {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  games: {
    played: number;
    win: { total: number };
    lose: { total: number };
  };
};

export function useSummerLeagueStandings() {
  const [standings, setStandings] = useState<Map<string, string> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  async function fetchStandings() {
    const now = Date.now();
    if (now - lastFetchTimeRef.current < RATE_LIMIT_MS) {
      console.warn("Rate limit hit: please wait before refreshing standings again.");
      return;
    }
    lastFetchTimeRef.current = now;

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const headers = {
        Authorization: `Bearer ${token}`,
        "x-api-key": API_KEY || "",
      };

      const [mainRes, utahRes] = await Promise.all([
        axios.get(`${API_URL}/api/standings`, { headers }),
        axios.get(`${API_URL}/api/standings/utah`, { headers }),
      ]);

   const mainTeams: Standing[] = mainRes.data.response;
const utahTeams: Standing[] = utahRes.data.response;


      const map = new Map<string, string>();

      function normalizeName(name: string) {
        return name.toLowerCase().replace(/[^a-z]/g, "");
      }

      for (const t of mainTeams) {
        const record = `${t.games.win.total}-${t.games.lose.total}`;
        map.set(normalizeName(t.team.name), record);
      }

      for (const t of utahTeams) {
        const record = `${t.games.win.total}-${t.games.lose.total}`;
        map.set(normalizeName(t.team.name), record);
      }

      setStandings(map);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch standings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStandings();
  }, []);

  return { standings, loading, error, refreshStandings: fetchStandings };
}
