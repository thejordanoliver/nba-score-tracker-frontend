// hooks/LeagueHooks/useTeamDetails.ts

import { useCallback, useEffect, useRef, useState } from "react";

import { apiClient } from "utils/apiClient";

export type TeamVenue = {
  id: number;
  city: string | null;
  guid: string | null;
  name: string;
  slug: string | null;
  grass: boolean | null;
  image: string | null;
  sport: string | null;
  state: string | null;
  indoor: boolean | null;
  address: string | null;
  apiRef: string | null;
  country: string | null;
  capacity: number | null;
  latitude: number | null;
  zipCode: string | null;
  longitude: number | null;
  venueKey: string | null;
  createdAt: string | null;
  leagueKey: string | null;
  sourceRef: string | null;
  updatedAt: string | null;
  geocodedAt: string | null;
  leagueSlug: string | null;
  sourceType: string | null;
  sourceTeamId: number | null;
  geocodingQuery: string | null;
  sourceImageUrl: string | null;
  geocodingProvider: string | null;
  geocodingConfidence: number | null;
  geocodingNeedsReview: boolean | null;
};

export type Conference = {
  id: number;
  uid: string;
  logo: string | null;
  name: string | null;
  groupId: number;
  createdAt: string | null;
  shortName: string | null;
  updatedAt: string | null;
  parentGroupId: number;
};

export type Coach = {
  id: string | number;
  firstName: string;
  lastName: string;
  image: string | null;
  role: string;
  season: number;
  espnId: number;
  teamId: number;
  isActive: boolean;
  experience: number | null;
  record: string | null;
  birthDate: string | null;
};

export type Championships = {
  id: number;
  notes: string | null;
  league?: string | null;
  season: number | string;
  teamId: number;
  teamName: string;

  // Some championship records include these fields.
  era?: string | null;
  selector?: string | null;
};

export type TeamDetails = {
  id: number;
  espnId: number | null;
  shortName: string;
  name: string;
  code: string;

  primaryColor: string | null;
  secondaryColor: string | null;

  location: string | null;
  city: string | null;
  state?: string | null;

  established: number | null;

  conferenceId?: number | null;

  venueId: string | number | null;
  venueLeagueKey: string | null;

  venue: TeamVenue | null;
  conference: Conference | null;
  coach: Coach | null;

  championships: Championships[];

  league?: string;

  // Supports additional league-specific database columns.
  [key: string]: unknown;
};

type TeamDetailsResponse = {
  success: boolean;
  league: string;
  team: TeamDetails;
};

type ErrorResponse = {
  success?: boolean;
  error?: string;
  details?: string;
};

type UseTeamDetailsResult = {
  teamDetails: TeamDetails | null;
  leagueName: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Returns a normalized team ID or null when the incoming value
 * should not be used for a team-details request.
 */
function normalizeTeamId(teamId: string | number | undefined): string | null {
  if (teamId === undefined || teamId === null) {
    return null;
  }

  const normalized = String(teamId).trim();

  if (!normalized) {
    return null;
  }

  /*
   * Team database IDs are positive integers.
   *
   * This prevents transient/default values such as:
   *   0
   *   "0"
   *   -1
   *   NaN
   *
   * from generating requests like:
   *
   *   /api/teams/cfb/0
   */
  const numericId = Number(normalized);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return null;
  }

  return normalized;
}

function normalizeLeague(league: string | undefined): string | null {
  if (!league) {
    return null;
  }

  const normalized = league.trim().toLowerCase();

  return normalized || null;
}

export default function useTeamDetails(
  league?: string,
  teamId?: string | number,
): UseTeamDetailsResult {
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);

  const [leagueName, setLeagueName] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * Used to prevent an older request from overwriting the result
   * of a newer request when the route/team changes quickly.
   */
  const requestIdRef = useRef(0);

  const fetchTeamDetails = useCallback(async () => {
    const normalizedLeague = normalizeLeague(league);
    const normalizedTeamId = normalizeTeamId(teamId);

    /*
     * Invalidate any request that may currently be running.
     */
    const requestId = ++requestIdRef.current;

    if (!normalizedLeague || !normalizedTeamId) {
      setTeamDetails(null);
      setLeagueName(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<TeamDetailsResponse>(
        `api/teams/${encodeURIComponent(
          normalizedLeague,
        )}/${encodeURIComponent(normalizedTeamId)}`,
      );

      /*
       * Ignore the response if another request began after this one.
       */
      if (requestId !== requestIdRef.current) {
        return;
      }

      setTeamDetails(response.data.team);
      setLeagueName(response.data.league);
    } catch (requestError: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const axiosLikeError = requestError as {
        message?: string;
        response?: {
          status?: number;
          data?: ErrorResponse;
        };
      };

      const responseData = axiosLikeError.response?.data;

      const message =
        responseData?.error ||
        responseData?.details ||
        axiosLikeError.message ||
        "Failed to fetch team details";

      setTeamDetails(null);
      setLeagueName(null);
      setError(message);

      console.error(
        `Error fetching ${normalizedLeague} team ${normalizedTeamId}:`,
        requestError,
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [league, teamId]);

  useEffect(() => {
    void fetchTeamDetails();
  }, [fetchTeamDetails]);

  return {
    teamDetails,
    leagueName,
    loading,
    error,
    refetch: fetchTeamDetails,
  };
}
