import { useCallback, useEffect, useState } from "react";

import { apiClient } from "utils/apiClient";

/* ----------------------------- Types ----------------------------- */

export type CFBTeamRank = {
  current: number;
  previous: number;
  points: number;
  firstPlaceVotes: number;
  trend: string;
  recordSummary: string;

  team: {
    id: number;
    espnId: number;
    name: string;
    shortName: string;
    code: string;
    location: string;
    conferenceId: number;
    conference: {
      id: number;
      logo: string;
      name: string;
      groupId: number;
      shortName: string;
    };

    groups?: {
      id: string;
      shortName: string;

      parent?: {
        id: string;
        shortName: string;
        isConference: boolean;
      };

      isConference: boolean;
    };
  } | null;

  date: string;
  lastUpdated: string;
};

export type CFBRankPoll = {
  type: "ap" | "coaches" | "cfp" | "fcs";
  shortName: string;
  ranks: CFBTeamRank[];
  outsideTop25: CFBTeamRank[];
  droppedOut: CFBTeamRank[];
};

type PollType = CFBRankPoll["type"];

type RawPoll = {
  type?: unknown;
  shortName?: unknown;
  name?: unknown;
  displayName?: unknown;
  headline?: unknown;
  description?: unknown;
  id?: unknown;
  ranks?: unknown;
  outsideTop25?: unknown;
  droppedOut?: unknown;
};

type RawRankingsResponse = {
  league?: unknown;
  rankings?: unknown;
};

/* ----------------------------- Config ----------------------------- */

const RANKINGS_ENDPOINT = "/api/standings/cfb/rankings";

const POLL_NAMES: Record<PollType, string> = {
  ap: "AP Poll",
  coaches: "Coaches Poll",
  cfp: "CFP Rankings",
  fcs: "FCS Coaches Poll",
};

const POLL_TYPES: PollType[] = ["ap", "coaches", "cfp", "fcs"];

/* ----------------------------- Helpers ----------------------------- */

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toStringValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
};

const toTeamRanks = (value: unknown): CFBTeamRank[] => {
  return Array.isArray(value) ? (value as CFBTeamRank[]) : [];
};

const getPollSearchText = (poll: RawPoll): string => {
  return [
    poll.type,
    poll.shortName,
    poll.name,
    poll.displayName,
    poll.headline,
    poll.description,
    poll.id,
  ]
    .map(toStringValue)
    .filter(Boolean)
    .join(" ")
    .trim()
    .toLowerCase();
};

/**
 * ESPN can currently return the FCS Coaches Poll with
 * a misleading poll type such as "ap".
 *
 * Because of that, detecting FCS from the teams themselves
 * is more reliable than trusting poll.type.
 */
const containsFCSTeams = (poll: RawPoll): boolean => {
  const ranks = toTeamRanks(poll.ranks);

  return ranks.some((rank) => {
    const groupShortName = rank.team?.groups?.shortName;
    const parentShortName = rank.team?.groups?.parent?.shortName;

    return (
      groupShortName?.trim().toUpperCase() === "FCS" ||
      parentShortName?.trim().toUpperCase() === "FCS"
    );
  });
};

const isFCSPoll = (poll: RawPoll): boolean => {
  const searchText = getPollSearchText(poll);

  return searchText.includes("fcs") || containsFCSTeams(poll);
};

const matchesPollType = (poll: RawPoll, type: PollType): boolean => {
  const searchText = getPollSearchText(poll);
  const rawType = toStringValue(poll.type).trim().toLowerCase();
  const fcs = isFCSPoll(poll);

  switch (type) {
    case "fcs":
      return fcs && (searchText.includes("coach") || rawType === "ap");

    case "ap":
      return (
        !fcs &&
        (rawType === "ap" ||
          searchText.includes("ap poll") ||
          searchText.includes("associated press") ||
          searchText.includes("ap top 25"))
      );

    case "coaches":
      return (
        !fcs &&
        (rawType === "coaches" ||
          rawType === "coach" ||
          searchText.includes("coaches poll") ||
          searchText.includes("coaches' poll") ||
          searchText.includes("afca coaches") ||
          searchText.includes("usa today coaches"))
      );

    case "cfp":
      return (
        !fcs &&
        (rawType === "cfp" ||
          rawType === "playoff" ||
          searchText.includes("cfp") ||
          searchText.includes("college football playoff") ||
          searchText.includes("playoff rankings"))
      );

    default:
      return false;
  }
};

/**
 * Extract ranking poll objects from the backend response.
 *
 * Expected backend shape:
 *
 * {
 *   league: "CFB",
 *   rankings: [...]
 * }
 */
const getPollCandidates = (rawValue: unknown): RawPoll[] => {
  if (Array.isArray(rawValue)) {
    return rawValue.filter(isRecord) as RawPoll[];
  }

  if (!isRecord(rawValue)) {
    return [];
  }

  if (Array.isArray(rawValue.rankings)) {
    return rawValue.rankings.filter(isRecord) as RawPoll[];
  }

  return [];
};

const normalizePoll = (
  poll: RawPoll | undefined,
  type: PollType,
): CFBRankPoll => {
  if (!poll) {
    return {
      type,
      shortName: POLL_NAMES[type],
      ranks: [],
      outsideTop25: [],
      droppedOut: [],
    };
  }

  return {
    type,
    shortName:
      toStringValue(poll.shortName) ||
      toStringValue(poll.name) ||
      toStringValue(poll.displayName) ||
      POLL_NAMES[type],
    ranks: toTeamRanks(poll.ranks),
    outsideTop25: toTeamRanks(poll.outsideTop25),
    droppedOut: toTeamRanks(poll.droppedOut),
  };
};

const normalizeRankings = (rawValue: unknown): CFBRankPoll[] => {
  const candidates = getPollCandidates(rawValue);

  return POLL_TYPES.map((type) => {
    const matchingPoll = candidates.find((poll) => matchesPollType(poll, type));

    return normalizePoll(matchingPoll, type);
  });
};

/* ----------------------------- Hook ----------------------------- */

export const useCFBRankings = () => {
  const [rankings, setRankings] = useState<CFBRankPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- Request ---------------- */

  const requestRankings = useCallback(async (): Promise<CFBRankPoll[]> => {
    const response =
      await apiClient.get<RawRankingsResponse>(RANKINGS_ENDPOINT);

    const normalized = normalizeRankings(response.data);

    return normalized;
  }, []);

  /* ---------------- Fetch Latest ---------------- */

  const fetchLatest = useCallback(async () => {
    setError(null);

    try {
      const polls = await requestRankings();

      setRankings(polls);
    } catch (err: unknown) {
      console.error("❌ Fetch CFB rankings failed:", err);

      setError(err instanceof Error ? err.message : "Failed to fetch rankings");
    }
  }, [requestRankings]);

  /* ---------------- Initial Fetch ---------------- */

  useEffect(() => {
    let isMounted = true;

    const loadRankings = async () => {
      setLoading(true);
      setError(null);

      try {
        const polls = await requestRankings();

        if (isMounted) {
          setRankings(polls);
        }
      } catch (err: unknown) {
        console.error("❌ Initial CFB rankings fetch failed:", err);

        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch rankings",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadRankings();

    return () => {
      isMounted = false;
    };
  }, [requestRankings]);

  return {
    rankings,
    loading,
    error,
    refresh: fetchLatest,
  };
};
