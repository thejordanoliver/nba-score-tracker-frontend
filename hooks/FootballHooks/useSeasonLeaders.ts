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
        return;
      }

      const cachedCategories = cacheRef.current[cacheKey];

      if (!forceRefresh && cachedCategories) {
        setCategories(cachedCategories);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const leaguePath = league.toLowerCase();

        const response = await apiClient.get(`api/leaders/${leaguePath}`, {
          params: {
            season,
          },
        });

        const rawCategories: LeaderCategory[] = response.data.categories ?? [];

        cacheRef.current[cacheKey] = rawCategories;

        setCategories(rawCategories);
      } catch (error: unknown) {
        console.error(`❌ [${league}] Season Leaders Error:`, error);

        const message =
          error instanceof Error ? error.message : "Failed to fetch leaders";

        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [cacheKey, enabled, league, season],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void fetchLeaders();
  }, [enabled, fetchLeaders]);

  const refresh = useCallback(() => {
    if (!enabled) {
      return;
    }

    void fetchLeaders(true);
  }, [enabled, fetchLeaders]);

  return {
    categories,

    // No state update is necessary when the hook is disabled.
    // We can derive the disabled loading state directly.
    loading: enabled ? loading : false,

    error,

    refresh,
  };
}
