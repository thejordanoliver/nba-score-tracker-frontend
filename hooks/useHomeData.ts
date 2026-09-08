import type { HomeLeagueSource, LeagueGame } from "@/types/leagues";
import { filterByDate, getFootballSeason } from "@/utils/dateUtils";
import {
  HOME_SCORE_LEAGUES,
  type HomeLeagueId,
} from "constants/leagues";
import { useFavoriteTeamsContext } from "contexts/FavoriteTeamsContext";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { useCallback, useMemo, useState } from "react";
import { normalizeGames } from "utils/games";
import { buildHomeGameSections } from "utils/homeGames";

import { useBaseballGames } from "./BaseballHooks/useBaseballGames";
import { useBasketballGames } from "./BasketballHooks/useBasketballGames";
import { useFootballGames } from "./FootballHooks/useFootballGames";
import { useHockeyGames } from "./HockeyHooks/useHockeyGames";
import { useMMAEvents } from "./MMAHooks/useMMAEvents";
import { useAllNews } from "./NewsHooks/useAllNews";
import { useSoccerGames } from "./SoccerHooks/useSoccerGames";
import { useTennisMatches } from "./TennisHooks/useTennisMatches";

dayjs.extend(utc);
dayjs.extend(timezone);

const getStartOfToday = () => dayjs().startOf("day").toDate();

export function useHomeData(selectedTab: "scores" | "news") {
  const currentFootballSeason = getFootballSeason();
  const {
    favorites,
    favoriteSports,
    favoriteSportsError,
    favoriteSportsReady,
    ready: favoriteTeamsReady,
    userId,
  } = useFavoriteTeamsContext();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getStartOfToday);

  const {
    articles,
    loading: newsLoading,
    error: newsError,
    refresh: refreshNews,
  } = useAllNews(30);

  const {
    games: nbaGames,
    loading: nbaLoading,
    refreshGames: refreshNBAGames,
  } = useBasketballGames(selectedDate, "nba");

  const {
    games: mlbGames,
    loading: mlbLoading,
    refreshGames: refreshMLBGames,
  } = useBaseballGames(selectedDate, "mlb");

  const {
    games: nhlGames,
    loading: nhlLoading,
    refreshGames: refreshNHLGames,
  } = useHockeyGames(selectedDate, "nhl");

  const {
    games: cfbGames,
    loading: cfbLoading,
    refreshGames: refreshCFBGames,
  } = useFootballGames({
    date: selectedDate,
    season: currentFootballSeason,
    league: "cfb",
  });

  const {
    games: nflGames,
    loading: nflLoading,
    refreshGames: refreshNFLGames,
  } = useFootballGames({
    date: selectedDate,
    season: currentFootballSeason,
    league: "nfl",
  });

  const {
    games: uflGames,
    loading: uflLoading,
    refreshGames: refreshUFLGames,
  } = useFootballGames({
    date: selectedDate,
    season: currentFootballSeason,
    league: "ufl",
  });

  const {
    games: mensBasketballGames,
    loading: mensCBBLoading,
    refreshGames: refreshMensCBB,
  } = useBasketballGames(selectedDate, "cbb");

  const {
    games: womensBasketballGames,
    loading: womensCBBLoading,
    refreshGames: refreshWomensCBB,
  } = useBasketballGames(selectedDate, "wcbb");

  const {
    games: wnbaGames,
    loading: wnbaLoading,
    refreshGames: refreshWNBA,
  } = useBasketballGames(selectedDate, "wnba");

  const {
    games: mmaGames,
    loading: mmaLoading,
    error: mmaError,
    refreshGames: refreshMMAGames,
  } = useMMAEvents({
    date: selectedDate,
    league: "ufc",
  });

  const {
    matches: atpMatches,
    loading: atpLoading,
    refreshMatches: refreshATPMatches,
  } = useTennisMatches(selectedDate, "atp");

  const {
    matches: wtaMatches,
    loading: wtaLoading,
    refreshMatches: refreshWTAMatches,
  } = useTennisMatches(selectedDate, "wta");

  const {
    games: mlsGames,
    loading: mlsLoading,
    refreshGames: refreshMLSGames,
  } = useSoccerGames(selectedDate, "mls");

  const {
    games: leaguesCupGames,
    loading: leaguesCupLoading,
    refreshGames: refreshLeaguesCupGames,
  } = useSoccerGames(selectedDate, "leaguescup");

  const {
    games: fifaGames,
    loading: fifaLoading,
    refreshGames: refreshFIFAGames,
  } = useSoccerGames(selectedDate, "fifa");

  const {
    games: eplGames,
    loading: eplLoading,
    refreshGames: refreshEPLGames,
  } = useSoccerGames(selectedDate, "epl");

  const {
    games: championsGames,
    loading: championsLoading,
    refreshGames: refreshChampionsGames,
  } = useSoccerGames(selectedDate, "champions");

  const {
    games: europaGames,
    loading: europaLoading,
    refreshGames: refreshEuropaGames,
  } = useSoccerGames(selectedDate, "europa");

  const {
    games: bundesligaGames,
    loading: bundesligaLoading,
    refreshGames: refreshBundesligaGames,
  } = useSoccerGames(selectedDate, "bundesliga");

  const normalizedNBA = useMemo(
    () => normalizeGames(nbaGames, "nba"),
    [nbaGames],
  );
  const normalizedNFL = useMemo(
    () => normalizeGames(nflGames, "nfl"),
    [nflGames],
  );
  const normalizedUFL = useMemo(
    () => normalizeGames(uflGames, "ufl"),
    [uflGames],
  );
  const normalizedMLB = useMemo(
    () => normalizeGames(mlbGames, "mlb"),
    [mlbGames],
  );
  const normalizedNHL = useMemo(
    () => normalizeGames(nhlGames, "nhl"),
    [nhlGames],
  );
  const normalizedCFB = useMemo(
    () => normalizeGames(cfbGames, "cfb"),
    [cfbGames],
  );
  const normalizedMensCBB = useMemo(
    () => normalizeGames(mensBasketballGames, "cbb"),
    [mensBasketballGames],
  );
  const normalizedWomensCBB = useMemo(
    () => normalizeGames(womensBasketballGames, "wcbb"),
    [womensBasketballGames],
  );
  const normalizedWNBA = useMemo(
    () => normalizeGames(wnbaGames, "wnba"),
    [wnbaGames],
  );
  const normalizedMLS = useMemo(
    () => normalizeGames(mlsGames, "mls"),
    [mlsGames],
  );
  const normalizedLeaguesCup = useMemo(
    () => normalizeGames(leaguesCupGames, "leaguescup"),
    [leaguesCupGames],
  );
  const normalizedFIFA = useMemo(
    () => normalizeGames(fifaGames, "fifa"),
    [fifaGames],
  );
  const normalizedEuropa = useMemo(
    () => normalizeGames(europaGames, "europa"),
    [europaGames],
  );
  const normalizedChampions = useMemo(
    () => normalizeGames(championsGames, "champions"),
    [championsGames],
  );
  const normalizedEPL = useMemo(
    () => normalizeGames(eplGames, "epl"),
    [eplGames],
  );
  const normalizedBundesliga = useMemo(
    () => normalizeGames(bundesligaGames, "bundesliga"),
    [bundesligaGames],
  );
  const normalizedMMA = useMemo(
    () => normalizeGames(mmaGames, "ufc"),
    [mmaGames],
  );

  const safeFilterByDate = useCallback(
    <Game extends LeagueGame>(
      games: readonly Game[],
      alreadyDateScoped = false,
    ): Game[] => {
      const filtered = filterByDate(games, selectedDate);

      if (alreadyDateScoped && games.length > 0 && filtered.length === 0) {
        return [...games];
      }

      return filtered;
    },
    [selectedDate],
  );

  const filteredNBA = useMemo(
    () => safeFilterByDate(normalizedNBA, true),
    [normalizedNBA, safeFilterByDate],
  );
  const filteredNFL = useMemo(
    () => safeFilterByDate(normalizedNFL, true),
    [normalizedNFL, safeFilterByDate],
  );
  const filteredUFL = useMemo(
    () => safeFilterByDate(normalizedUFL, true),
    [normalizedUFL, safeFilterByDate],
  );
  const filteredMLB = useMemo(
    () => safeFilterByDate(normalizedMLB, true),
    [normalizedMLB, safeFilterByDate],
  );
  const filteredNHL = useMemo(
    () => safeFilterByDate(normalizedNHL, true),
    [normalizedNHL, safeFilterByDate],
  );
  const filteredCFB = useMemo(
    () => safeFilterByDate(normalizedCFB, true),
    [normalizedCFB, safeFilterByDate],
  );
  const filteredMensCBB = useMemo(
    () => safeFilterByDate(normalizedMensCBB),
    [normalizedMensCBB, safeFilterByDate],
  );
  const filteredWomensCBB = useMemo(
    () => safeFilterByDate(normalizedWomensCBB),
    [normalizedWomensCBB, safeFilterByDate],
  );
  const filteredWNBA = useMemo(
    () => safeFilterByDate(normalizedWNBA),
    [normalizedWNBA, safeFilterByDate],
  );
  const filteredMLS = useMemo(
    () => safeFilterByDate(normalizedMLS),
    [normalizedMLS, safeFilterByDate],
  );
  const filteredLeaguesCup = useMemo(
    () => safeFilterByDate(normalizedLeaguesCup),
    [normalizedLeaguesCup, safeFilterByDate],
  );
  const filteredFIFA = useMemo(
    () => safeFilterByDate(normalizedFIFA),
    [normalizedFIFA, safeFilterByDate],
  );
  const filteredEPL = useMemo(
    () => safeFilterByDate(normalizedEPL),
    [normalizedEPL, safeFilterByDate],
  );
  const filteredChampions = useMemo(
    () => safeFilterByDate(normalizedChampions),
    [normalizedChampions, safeFilterByDate],
  );
  const filteredEuropa = useMemo(
    () => safeFilterByDate(normalizedEuropa),
    [normalizedEuropa, safeFilterByDate],
  );
  const filteredBundesliga = useMemo(
    () => safeFilterByDate(normalizedBundesliga),
    [normalizedBundesliga, safeFilterByDate],
  );
  const filteredMMA = useMemo(
    () => safeFilterByDate(normalizedMMA, true),
    [normalizedMMA, safeFilterByDate],
  );

  const homeLeagueSources = useMemo<HomeLeagueSource[]>(
    () => {
      const gamesByLeague: Record<HomeLeagueId, readonly LeagueGame[]> = {
        nba: filteredNBA,
        nfl: filteredNFL,
        ufl: filteredUFL,
        mlb: filteredMLB,
        nhl: filteredNHL,
        cfb: filteredCFB,
        mls: filteredMLS,
        leaguescup: filteredLeaguesCup,
        fifa: filteredFIFA,
        europa: filteredEuropa,
        champions: filteredChampions,
        epl: filteredEPL,
        bundesliga: filteredBundesliga,
        cbb: filteredMensCBB,
        wcbb: filteredWomensCBB,
        wnba: filteredWNBA,
        ufc: filteredMMA,
        atp: atpMatches,
        wta: wtaMatches,
      };

      return HOME_SCORE_LEAGUES.map((id) => ({
        id,
        games: gamesByLeague[id],
      }));
    },
    [
      filteredNBA,
      filteredNFL,
      filteredUFL,
      filteredMLB,
      filteredNHL,
      filteredCFB,
      filteredMLS,
      filteredLeaguesCup,
      filteredFIFA,
      filteredEuropa,
      filteredChampions,
      filteredEPL,
      filteredBundesliga,
      filteredMensCBB,
      filteredWomensCBB,
      filteredWNBA,
      filteredMMA,
      atpMatches,
      wtaMatches,
    ],
  );

  const homeGameSections = useMemo(
    () =>
      buildHomeGameSections({
        sources: homeLeagueSources,
        favoriteTeams: favorites,
        favoriteSports,
        favoriteSportsReady,
      }),
    [
      favoriteSports,
      favoriteSportsReady,
      favorites,
      homeLeagueSources,
    ],
  );

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      const today = getStartOfToday();
      const shouldUpdateSelectedDate = !dayjs(selectedDate).isSame(
        today,
        "day",
      );

      if (shouldUpdateSelectedDate) {
        setSelectedDate(today);

        if (selectedTab === "scores") return;
      }

      if (selectedTab === "scores") {
        await Promise.allSettled([
          refreshNBAGames(),
          refreshMLBGames(),
          refreshNHLGames(),
          refreshNFLGames(),
          refreshUFLGames(),
          refreshCFBGames(),
          refreshMensCBB(),
          refreshWomensCBB(),
          refreshWNBA(),
          refreshMLSGames(),
          refreshLeaguesCupGames(),
          refreshEPLGames(),
          refreshFIFAGames(),
          refreshChampionsGames(),
          refreshEuropaGames(),
          refreshBundesligaGames(),
          refreshMMAGames(),
          refreshATPMatches(),
          refreshWTAMatches(),
        ]);
      } else {
        await refreshNews();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const favoriteOrderReady =
    favoriteTeamsReady &&
    (userId === null || favoriteSportsReady || favoriteSportsError !== null);

  // Keep the list behind its loading state until every source that affects its
  // contents and personalized order has settled. Otherwise the first completed
  // request renders a partial list that visibly moves as later requests finish.
  const scoresLoading =
    !favoriteOrderReady ||
    nbaLoading ||
    mlbLoading ||
    nhlLoading ||
    nflLoading ||
    uflLoading ||
    cfbLoading ||
    mensCBBLoading ||
    womensCBBLoading ||
    wnbaLoading ||
    mlsLoading ||
    leaguesCupLoading ||
    fifaLoading ||
    eplLoading ||
    europaLoading ||
    bundesligaLoading ||
    championsLoading ||
    mmaLoading ||
    atpLoading ||
    wtaLoading;

  return {
    selectedDate,
    setSelectedDate,
    favorites,
    refreshing,
    handleRefresh,
    homeGameSections,
    newsError,
    errorFights: mmaError,
    newsLoading,
    articles,
    loading:
      selectedTab === "scores" ? scoresLoading || refreshing : newsLoading,
  };
}
