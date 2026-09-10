import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PlayerResult,
  ResultItem,
  TeamResult,
  UserResult,
} from "types/explore";
import { apiClient } from "utils/apiClient";

const RECENT_SEARCHES_KEY_PREFIX = "recentSearches";
const RECENT_SEARCHES_LEGACY_KEY = RECENT_SEARCHES_KEY_PREFIX;
const RECENT_SEARCHES_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;
const COLLAPSED_SEARCH_LIMIT = 5;
const EXPANDED_SEARCH_LIMIT = 25;

export type ExploreSearchScope = "all" | "players" | "teams" | "users";

type ExploreSearchResponse = {
  players: PlayerResult[];
  teams: TeamResult[];
  users: UserResult[];
};

function getResultKey(item: ResultItem) {
  if (item.type === "player") return String(item.id);
  if (item.type === "team") return String(item.id);
  if (item.type === "user") return String(item.id);
  return null;
}

const getRecentSearchesKey = (userId: string | number) =>
  `${RECENT_SEARCHES_KEY_PREFIX}:${userId}`;

async function getCurrentRecentSearchesKey() {
  const userId = await AsyncStorage.getItem("userId");
  return userId ? getRecentSearchesKey(userId) : null;
}

function isValidResultItem(item: unknown): item is ResultItem {
  if (!item || typeof item !== "object") return false;

  const value = item as Partial<ResultItem>;

  if (!("type" in value)) return false;

  if (value.type === "player") {
    return "id" in value && value.id !== undefined;
  }

  if (value.type === "team") {
    return "id" in value && value.id !== undefined;
  }

  if (value.type === "user") {
    return "id" in value && value.id !== undefined;
  }

  return false;
}

function safeParseRecentSearches(value: string | null): ResultItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidResultItem).slice(0, RECENT_SEARCHES_LIMIT);
  } catch {
    return [];
  }
}

function isCanceledRequest(error: unknown) {
  const err = error as {
    name?: string;
    code?: string;
    message?: string;
  };

  return (
    err?.name === "CanceledError" ||
    err?.code === "ERR_CANCELED" ||
    err?.message === "canceled"
  );
}

function sortByScoreDesc<T extends { score?: number | null }>(items: T[]) {
  return [...items].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

function normalizeUsers(users: UserResult[], query: string): ResultItem[] {
  const q = query.toLowerCase();

  return users.map((user) => {
    const username = user.username?.toLowerCase() ?? "";
    let score = user.score ?? 0;

    if (username === q) {
      score += 1000;
    } else if (username.startsWith(q)) {
      score += 500;
    }

    return {
      ...user,
      type: "user" as const,
      score,
    };
  });
}

function normalizePlayers(players: PlayerResult[]): ResultItem[] {
  return players.map((player) => ({
    ...player,
    type: "player" as const,
  }));
}

function normalizeTeams(teams: TeamResult[]): ResultItem[] {
  return teams.map((team) => ({
    ...team,
    type: "team" as const,
  }));
}

function buildResults(
  data: ExploreSearchResponse,
  query: string,
): ResultItem[] {
  const teams = sortByScoreDesc(normalizeTeams(data.teams));
  const users = sortByScoreDesc(normalizeUsers(data.users, query));
  const players = sortByScoreDesc(normalizePlayers(data.players));

  return [...teams, ...users, ...players];
}

function removeDuplicateRecentSearch(
  searches: ResultItem[],
  itemToRemove: ResultItem,
) {
  const itemKey = getResultKey(itemToRemove);
  if (!itemKey) return searches;

  return searches.filter((item) => {
    const key = getResultKey(item);
    return key !== itemKey || item.type !== itemToRemove.type;
  });
}

async function persistRecentSearches(
  storageKey: string,
  searches: ResultItem[],
) {
  await AsyncStorage.setItem(storageKey, JSON.stringify(searches));
}

export function useExplore() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<ResultItem[]>([]);
  const [recentSearchesKey, setRecentSearchesKey] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchScope, setSearchScope] = useState<ExploreSearchScope>("all");
  const [expandedSearch, setExpandedSearch] = useState(false);

  const requestIdRef = useRef(0);
  const recentSearchLoadRequestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const normalizedQuery = query.trim();
  const normalizedDebouncedQuery = debouncedQuery.trim();
  const searchLimit = expandedSearch
    ? EXPANDED_SEARCH_LIMIT
    : COLLAPSED_SEARCH_LIMIT;

  const isSearching = useMemo(() => {
    return (
      loading ||
      (normalizedQuery.length > 0 &&
        normalizedQuery !== normalizedDebouncedQuery)
    );
  }, [loading, normalizedQuery, normalizedDebouncedQuery]);

  const loadRecentSearches = useCallback(async () => {
    const requestId = ++recentSearchLoadRequestIdRef.current;

    try {
      const storageKey = await getCurrentRecentSearchesKey();

      if (requestId !== recentSearchLoadRequestIdRef.current) return;

      setRecentSearchesKey(storageKey);
      AsyncStorage.removeItem(RECENT_SEARCHES_LEGACY_KEY).catch(() => {});

      if (!storageKey) {
        setRecentSearches([]);
        return;
      }

      const stored = await AsyncStorage.getItem(storageKey);

      if (requestId !== recentSearchLoadRequestIdRef.current) return;

      setRecentSearches(safeParseRecentSearches(stored));
    } catch (err) {
      if (requestId !== recentSearchLoadRequestIdRef.current) return;
      console.warn("Error loading recent searches", err);
      setRecentSearchesKey(null);
      setRecentSearches([]);
    }
  }, []);

  const search = useCallback(
    async (
      searchQuery: string,
      options: {
        scope?: ExploreSearchScope;
        limit?: number;
      } = {},
    ) => {
      const trimmedQuery = searchQuery.trim();
      const requestScope = options.scope ?? searchScope;
      const requestLimit = options.limit ?? searchLimit;

      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      abortControllerRef.current?.abort();

      if (!trimmedQuery) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get<ExploreSearchResponse>(
          "api/explore/search",
          {
            params: {
              query: trimmedQuery,
              scope: requestScope,
              limit: requestLimit,
            },
            signal: controller.signal,
          },
        );

        if (requestId !== requestIdRef.current) return;

        setResults(buildResults(res.data, trimmedQuery));
        setError(null);
      } catch (err: any) {
        if (isCanceledRequest(err)) return;
        if (requestId !== requestIdRef.current) return;

        setError(err?.message || "Failed to fetch data");
        setResults([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [searchLimit, searchScope],
  );

  const saveToRecentSearches = useCallback(async (item: ResultItem) => {
    const key = getResultKey(item);
    if (!key) return;

    try {
      const storageKey = await getCurrentRecentSearchesKey();

      setRecentSearchesKey(storageKey);

      if (!storageKey) {
        setRecentSearches([]);
        return;
      }

      const stored = await AsyncStorage.getItem(storageKey);
      const existing = safeParseRecentSearches(stored);

      const nextSearches = [
        item,
        ...removeDuplicateRecentSearch(existing, item),
      ].slice(0, RECENT_SEARCHES_LIMIT);

      await persistRecentSearches(storageKey, nextSearches);
      setRecentSearches(nextSearches);
    } catch (err) {
      console.warn("Failed to save recent search", err);
    }
  }, []);

  const deleteRecentSearch = useCallback(
    async (itemToDelete: ResultItem) => {
      try {
        const storageKey =
          recentSearchesKey ?? (await getCurrentRecentSearchesKey());

        if (!storageKey) {
          setRecentSearches([]);
          return;
        }

        const stored = await AsyncStorage.getItem(storageKey);
        const existing = safeParseRecentSearches(stored);
        const nextSearches = removeDuplicateRecentSearch(
          existing,
          itemToDelete,
        );

        await persistRecentSearches(storageKey, nextSearches);
        setRecentSearches(nextSearches);
      } catch (err) {
        console.warn("Failed to delete recent search", err);
      }
    },
    [recentSearchesKey],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  useEffect(() => {
    search(debouncedQuery, {
      scope: searchScope,
      limit: searchLimit,
    });
  }, [debouncedQuery, search, searchLimit, searchScope]);

  useFocusEffect(
    useCallback(() => {
      loadRecentSearches();
    }, [loadRecentSearches]),
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    recentSearches,
    loading,
    error,
    search,
    searchScope,
    setSearchScope,
    expandedSearch,
    setExpandedSearch,
    canExpandResults:
      normalizedQuery.length > 0 &&
      !expandedSearch &&
      results.length >= COLLAPSED_SEARCH_LIMIT,
    saveToRecentSearches,
    deleteRecentSearch,
    isSearching,
  };
}
