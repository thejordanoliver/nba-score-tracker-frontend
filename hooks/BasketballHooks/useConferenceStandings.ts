// hooks//useConferenceStandings.ts

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "utils/apiClient";

export interface StandingTeam {
  id: string;
  name: string;
  code: string | null;
  rank: string | number | null;
  overall: string | null;
  confOverall: string | null;
  homeOverall: string | null;
  awayOverall: string | null;
  divisionOverall?: string | null;
  divWins?: string | number | null;
  divLosses?: string | number | null;
  winPercent?: string | number | null;
  confWinPercent?: string | number | null;
  streak: string | null;
  gamesBehind: string | number | null;
  vsAPTop25: string | null;
  pointsFor: string | number | null;
  pointsAgainst: string | number | null;
}

export interface StandingDivision {
  name: string;
  teams: StandingTeam[];
}

export interface StandingConference {
  id: string;
  name: string;
  code: string | null;
  shortName: string | null;
  divisions: StandingDivision[];
}

interface ConferenceStandingsResponse {
  group: string | null;
  conference: StandingConference | null;
  conferences: StandingConference[];
}

export const useConferenceStandings = (
  league: string,
  group?: number | string | null,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const [conference, setConference] = useState<StandingConference | null>(
    null,
  );
  const [conferences, setConferences] = useState<StandingConference[]>([]);
  const [conferencesLoading, setConferencesLoading] = useState(false);
  const [ConferencesRefreshing, setConferencesRefreshing] = useState(false);
  const [conferencesError, setConferencesError] = useState<string | null>(null);

  const normalizedGroup = String(group ?? "").trim();
  const canFetch = /^\d+$/.test(normalizedGroup);

  const fetchStandings = useCallback(
    async (isRefresh = false) => {
      if (!enabled) {
        setConferencesLoading(false);
        setConferencesRefreshing(false);
        return;
      }

      if (!canFetch) {
        setConference(null);
        setConferences([]);
        setConferencesLoading(false);
        setConferencesRefreshing(false);
        setConferencesError(null);
        return;
      }

      try {
        if (isRefresh) {
          setConferencesRefreshing(true);
        } else {
          setConferencesLoading(true);
        }

        setConferencesError(null);

        const { data } = await apiClient.get<ConferenceStandingsResponse>(
          `/api/standings/${league}/conference`,
          {
            params: {
              group: normalizedGroup,
            },
          },
        );

        const rawConferences = Array.isArray(data?.conferences)
          ? data.conferences
          : [];

        const validConferences = rawConferences.filter(
          (item): item is StandingConference =>
            Boolean(
              item && item.id && item.name && Array.isArray(item.divisions),
            ),
        );

        const selectedConference =
          data?.conference ??
          validConferences.find(
            (item) => String(item.id) === normalizedGroup,
          ) ??
          validConferences[0] ??
          null;

        setConference(selectedConference);
        setConferences(validConferences);
      } catch (requestError: unknown) {
        console.error("🔥 CONFERENCE STANDINGS ERROR:", requestError);

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Failed to load  conference standings";

        setConferencesError(message);
        setConference(null);
        setConferences([]);
      } finally {
        setConferencesLoading(false);
        setConferencesRefreshing(false);
      }
    },
    [canFetch, enabled, league, normalizedGroup],
  );

  useEffect(() => {
    fetchStandings(false);
  }, [fetchStandings]);

  const refresh = useCallback(() => {
    return fetchStandings(true);
  }, [fetchStandings]);

  return {
    conference,
    conferences,
    standings: conference?.divisions ?? [],
    conferencesLoading,
    ConferencesRefreshing,
    conferencesError,
    refresh,
  };
};

export default useConferenceStandings;
