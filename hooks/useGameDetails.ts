// hooks/useGameDetails.ts
import axios from "axios";
import { useEffect, useState } from "react";

type Official = {
  fullName: string;
  displayName: string;
  position: {
    name: string;
    displayName: string;
    id: string;
  };
  order: number;
};

// Base type for a single team's injuries
export type TeamInjury = {
  team: {
    id: string;
    displayName: string;
    abbreviation: string;
    logo?: string;
  };
  injuries: {
    status: string;
    date: string;
    athlete: {
      id: string;
      fullName: string;
      displayName: string;
      shortName: string;
      jersey?: string;
      position?: {
        name: string;
        displayName: string;
        abbreviation: string;
      };
      headshot?: { href: string; alt: string };
    };
    details?: {
      type?: string;
      location?: string;
      detail?: string;
      side?: string;
      returnDate?: string;
    };
  }[];
};

// Response type
export type GameDetailsResponse = {
  gameId: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  officials: Official[];
  injuries: TeamInjury[]; // 👈 array of TeamInjury, not nested []
};

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export function useGameDetails(date: string, home: string, away: string) {
  const [data, setData] = useState<GameDetailsResponse | null>(null);
  const [detailsLoading, setLoading] = useState(true);
  const [detailsError, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!date || !home || !away) return;

    let cancelled = false;

    async function fetchDetails() {
      setLoading(true);
      setError(null);

      try {
        const compactDate = date.replace(/-/g, "");

        const resp = await axios.get<GameDetailsResponse>(
          `${BASE_URL}/api/espn/game-details?date=${compactDate}&home=${home.toLowerCase()}&away=${away.toLowerCase()}`
        );

        if (!cancelled) {
          setData(resp.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Fetch error:", err);
          setError(err.message || "Failed to fetch game details");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [date, home, away]);

  return { data, detailsLoading, detailsError };
}
