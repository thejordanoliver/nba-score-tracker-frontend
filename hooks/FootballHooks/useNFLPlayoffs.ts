import type { BracketApiResponse } from "@/types/football/football";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "utils/apiClient";

type UseNFLPlayoffsResult = {
  playoffData: BracketApiResponse | null;
  playoffLoading: boolean;
  playoffError: string | null;
  playoffRefreshing: boolean;
  onRefresh: () => Promise<void>;
};

export const useNFLPlayoffs = (
  season: number,
  { enabled = true }: { enabled?: boolean } = {},
): UseNFLPlayoffsResult => {
  const [playoffData, setPlayoffData] =
    useState<BracketApiResponse | null>(null);

  const [playoffLoading, setPlayoffLoading] =
    useState(false);

  const [playoffError, setPlayoffError] =
    useState<string | null>(null);

  const [playoffRefreshing, setPlayoffRefreshing] =
    useState(false);

  const abortControllerRef =
    useRef<AbortController | null>(null);

  const fetchPlayoffs = useCallback(
    async (refreshing = false) => {
      if (!enabled) {
        setPlayoffLoading(false);
        return;
      }

      if (!Number.isFinite(season)) {
        setPlayoffData(null);
        setPlayoffError("Invalid season");
        return;
      }

      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        if (!refreshing) {
          setPlayoffLoading(true);
        }

        setPlayoffError(null);

        const { data } =
          await apiClient.get<BracketApiResponse>(
            "api/games/football/nfl/playoffs",
            {
              params: {
                season,
              },
              signal: controller.signal,
            },
          );

        if (!data?.success) {
          setPlayoffData(null);
          setPlayoffError(
            "NFL playoff data is unavailable.",
          );
          return;
        }

        setPlayoffData(data);
      } catch (error: any) {
        if (
          error?.code === "ERR_CANCELED" ||
          error?.name === "CanceledError"
        ) {
          return;
        }

        console.warn(
          "[useNFLPlayoffs] Failed to load playoffs:",
          error,
        );

        setPlayoffError(
          error?.response?.data?.error ??
            error?.message ??
            "Failed to load NFL playoffs",
        );

        // Preserve existing data during failed refreshes.
        if (!refreshing) {
          setPlayoffData(null);
        }
      } finally {
        if (!refreshing) {
          setPlayoffLoading(false);
        }
      }
    },
    [enabled, season],
  );

  useEffect(() => {
    if (!enabled) {
      setPlayoffLoading(false);
      return;
    }

    void fetchPlayoffs();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [enabled, fetchPlayoffs]);

  const onRefresh = useCallback(async () => {
    try {
      setPlayoffRefreshing(true);
      await fetchPlayoffs(true);
    } finally {
      setPlayoffRefreshing(false);
    }
  }, [fetchPlayoffs]);

  return {
    playoffData,
    playoffLoading,
    playoffError,
    playoffRefreshing,
    onRefresh,
  };
};
