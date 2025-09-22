// hooks/NFLHooks/useNFLPlayer.ts
import { useEffect, useState } from "react";
import axios from "axios";

export interface NFLPlayer {
  id: number;
  name: string;
  age?: number;
  height?: string;
  weight?: string;
  college?: string;
  group?: string;
  position?: string;
  number?: number;
  salary?: string;
  experience?: number;
  image?: string;
  team?: {
    id: number;
    name: string;
    logo: string;
  };
}

const KEY = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
const HOST = process.env.EXPO_PUBLIC_FOOTBALL_RAPIDAPI_HOST;
export const useNFLPlayer = (id?: string) => {
  const [player, setPlayer] = useState<NFLPlayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchPlayer = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get("https://api-american-football.p.rapidapi.com/players", {
          params: { id }, // ✅ use player id
          headers: {
            "x-rapidapi-key": KEY!,
            "x-rapidapi-host": HOST,
          },
        });

        setPlayer(res.data.response[0] || null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch player.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  return { player, loading, error };
};
