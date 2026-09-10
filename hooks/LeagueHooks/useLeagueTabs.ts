import { useCallback, useEffect, useMemo, useState } from "react";

import { LEAGUE_TABS, TEAM_TABS } from "utils/tabs";

const FALLBACK_LEAGUE_TABS = ["scores", "news", "standings", "forum"] as const;

const FALLBACK_TEAM_TABS = [
  "schedule",
  "news",
  "roster",
  "stats",
  "standings",
  "forum",
] as const;

export function useLeagueTabs(league: string) {
  const normalizedLeague = league.trim().toLowerCase();

  const tabs = useMemo<readonly string[]>(() => {
    return (
      LEAGUE_TABS[normalizedLeague as keyof typeof LEAGUE_TABS] ??
      FALLBACK_LEAGUE_TABS
    );
  }, [normalizedLeague]);

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);
  const [visitedTabs, setVisitedTabs] = useState<ReadonlySet<string>>(
    () => new Set([tabs[0]]),
  );

  useEffect(() => {
    setSelectedTab(tabs[0]);
    setVisitedTabs(new Set([tabs[0]]));
  }, [tabs]);

  useEffect(() => {
    setVisitedTabs((current) => {
      if (current.has(selectedTab)) {
        return current;
      }

      const next = new Set(current);
      next.add(selectedTab);
      return next;
    });
  }, [selectedTab]);

  const hasVisitedTab = useCallback(
    (tab: string) => visitedTabs.has(tab),
    [visitedTabs],
  );

  return {
    tabs,
    selectedTab,
    setSelectedTab,
    visitedTabs,
    hasVisitedTab,
  };
}

export function useTeamTabs(team: string) {
  const normalizedTeam = team.trim().toLowerCase();

  const tabs = useMemo<readonly string[]>(() => {
    return (
      TEAM_TABS[normalizedTeam as keyof typeof TEAM_TABS] ?? FALLBACK_TEAM_TABS
    );
  }, [normalizedTeam]);

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);

  useEffect(() => {
    setSelectedTab(tabs[0]);
  }, [tabs]);

  return {
    tabs,
    selectedTab,
    setSelectedTab,
  };
}
