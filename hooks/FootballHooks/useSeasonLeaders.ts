import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "utils/apiClient";

/* ----------------------------- Types ----------------------------- */

export interface Leader {
  id: number | string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  short_name: string | null;
  height: string | null;
  weight: string | null;
  position: string | null;
  jersey_number: number | string | null;
  experience: number | string | null;
  experience_display: string | null;
  experience_abbr: string | null;
  birth_city: string | null;
  birth_state: string | null;
  birth_country: string | null;
  birth_display: string | null;
  team_id: number | string | null;
  headshot_url: string | null;
  active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  birth_date: string | null;
  rank: number | string | null;
  value: number | string | null;
  displayValue: string | null;
  teamId: number | string | null;
  teamName: string | null;
  teamAbbrev: string | null;
  teamLogo: string | null;
}

export interface LeaderCategory {
  categoryName: string;
  shortName: string;
  abbreviation: string;
  leaders: Leader[];
}

interface SeasonLeaderResult {
  categories: LeaderCategory[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/* ----------------------------- Hook ------------------------------ */

export function useSeasonLeaders(
  season: number,
  league: string,
  { enabled = true }: { enabled?: boolean } = {},
): SeasonLeaderResult {
  const [categories, setCategories] = useState<LeaderCategory[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const cacheRef = useRef<Partial<Record<string, LeaderCategory[]>>>({});
  const cacheKey = `${league}:${season}`;

  const fetchLeaders = useCallback(
    async (forceRefresh = false) => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      if (!forceRefresh && cacheRef.current[cacheKey]) {
        setCategories(cacheRef.current[cacheKey]!);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const leaguePath = league.toLowerCase();

        const res = await apiClient.get(`api/leaders/${leaguePath}`, {
          params: { season },
        });

        const rawCategories: LeaderCategory[] = res.data.categories ?? [];

        // ✅ No enrichment — just cache + return
        cacheRef.current[cacheKey] = rawCategories;
        setCategories(rawCategories);
      } catch (err: any) {
        console.error(`❌ [${league}] Season Leaders Error:`, err);
        setError(err.message || "Failed to fetch leaders");
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, enabled, season, league],
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    void fetchLeaders();
  }, [enabled, fetchLeaders]);

  return {
    categories,
    loading,
    error,
    refresh: () => {
      void fetchLeaders(true);
    },
  };
}
