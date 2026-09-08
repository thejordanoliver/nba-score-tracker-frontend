import NBAPlayoffsDark from "assets/NBA/Logos/NBAPlayoffs.png";
import NBAPlayoffsLight from "assets/NBA/Logos/NBAPlayoffsLight.png";
import CustomActivityIndicator from "components/CustomActivityIndicator";
import { Colors, globalStyles } from "constants/styles";
import { usePreferences } from "contexts/PreferencesContext";

import {
  getColCenter,
  NBAPlayoffBracketStyles,
  snapBracketOffsets,
} from "@/styles/PlayoffStyles/NBAPlayoffBraketStyles";
import type {
  NBABracketMatchup,
  NBAPlayoffGame,
  NBAPlayoffId,
  NBAPlayoffRound,
  NBAPlayoffSeries,
  NBAPlayoffTeam,
  PlayoffBracket,
} from "@/types/basketball/basketball";
import { useMemo } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { RefreshControl } from "react-native-gesture-handler";

import {
  COLS,
  ConnectorLayer,
  EAST_ROUND1_LAYOUTS,
  EAST_ROUND2_LAYOUTS,
  EAST_ROUND3_LAYOUTS,
  FINALS_LAYOUT,
  WEST_ROUND1_LAYOUTS,
  WEST_ROUND2_LAYOUTS,
  WEST_ROUND3_LAYOUTS,
} from "./ConnectorLayer";
import { GameCard } from "./GameCard";
import { RoundLabel } from "./RoundLabel";

type Conference = "east" | "west";

const normalizeRoundText = (value?: unknown) =>
  String(value ?? "")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeConference = (value?: unknown): Conference | undefined => {
  const text = normalizeRoundText(value);

  if (text === "east" || text.includes("eastern")) return "east";
  if (text === "west" || text.includes("western")) return "west";

  return undefined;
};

const getRoundSearchFields = (round: NBAPlayoffRound) => {
  const roundAny = round as any;

  return [
    roundAny.key,
    roundAny.id,
    roundAny.name,
    roundAny.label,
    roundAny.shortName,
    roundAny.slug,
    roundAny.roundLabel,
    ...((round.series ?? []).flatMap((series) => [
      series.key,
      series.label,
      ...series.games.flatMap((game) => [
        game.headline,
        game.name,
        game.shortName,
        game.playoff?.roundKey,
        game.playoff?.roundLabel,
        game.playoff?.seriesKey,
        game.playoff?.seriesLabel,
      ]),
    ]) ?? []),
  ]
    .filter(Boolean)
    .map(normalizeRoundText);
};

const getRoundNumber = (round: NBAPlayoffRound) => {
  const roundAny = round as any;

  const value =
    roundAny.round ??
    roundAny.roundNumber ??
    roundAny.number ??
    roundAny.order ??
    roundAny.index;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const getRoundByAliases = (
  rounds: NBAPlayoffRound[],
  aliases: string[],
  roundNumbers: number[] = [],
) => {
  const normalizedAliases = aliases.map(normalizeRoundText);

  return rounds.find((round) => {
    const roundNumber = getRoundNumber(round);

    if (roundNumber != null && roundNumbers.includes(roundNumber)) {
      return true;
    }

    const fields = getRoundSearchFields(round);

    return fields.some((field) =>
      normalizedAliases.some(
        (alias) => field === alias || field.includes(alias),
      ),
    );
  });
};

const getFinalsRound = (rounds: NBAPlayoffRound[]) =>
  rounds.find((round) => {
    const roundNumber = getRoundNumber(round);

    if (roundNumber === 4) return true;

    const fields = getRoundSearchFields(round);

    return fields.some((field) => {
      const isFinals =
        field === "finals" ||
        field === "final" ||
        field === "nba finals" ||
        field === "nba final" ||
        field === "championship" ||
        field.includes("nba finals");

      const isConferenceFinals =
        field.includes("conference finals") ||
        field.includes("conference final") ||
        field.includes("eastern conference finals") ||
        field.includes("western conference finals") ||
        field.includes("east finals") ||
        field.includes("west finals");

      return isFinals && !isConferenceFinals;
    });
  });

const getSeriesConference = (
  series: NBAPlayoffSeries,
): Conference | undefined => {
  const directConference =
    normalizeConference(series.conference) ||
    normalizeConference(series.teams?.top?.conference) ||
    normalizeConference(series.teams?.bottom?.conference);

  if (directConference) return directConference;

  const teamConference = series.games
    .flatMap((game) => [
      game.home?.conference,
      game.away?.conference,
      game.playoff?.conference,
    ])
    .map(normalizeConference)
    .find(Boolean);

  if (teamConference) return teamConference;

  const text = [
    series.label,
    ...series.games.flatMap((game) => [
      game.headline,
      game.playoff?.seriesLabel,
      game.playoff?.roundLabel,
      game.name,
      game.shortName,
    ]),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\beast(ern)?\b/.test(text)) return "east";
  if (/\bwest(ern)?\b/.test(text)) return "west";

  return undefined;
};

const splitSeriesByConference = (round?: NBAPlayoffRound) => {
  const split: Record<Conference, NBAPlayoffSeries[]> = {
    east: [],
    west: [],
  };

  (round?.series ?? []).forEach((series) => {
    const conference = getSeriesConference(series);

    if (conference) {
      split[conference].push(series);
      return;
    }

    if (split.west.length <= split.east.length) {
      split.west.push(series);
    } else {
      split.east.push(series);
    }
  });

  return split;
};

const getSeriesGameNumber = (series: NBAPlayoffSeries, gameNumber: number) =>
  series.games.find((game) => game.playoff?.gameNumber === gameNumber) ?? null;

const getGameTimestamp = (game?: NBAPlayoffGame | null) => {
  if (!game) return 0;
  if (typeof game.timestamp === "number") return game.timestamp;

  const rawDate = game.startDate || game.date;
  if (!rawDate) return 0;

  const time = new Date(rawDate).getTime();

  return Number.isNaN(time) ? 0 : time;
};

const sortSeriesGames = (games: NBAPlayoffGame[]) =>
  [...games].sort((a, b) => {
    const aNumber = a.playoff?.gameNumber ?? Number.MAX_SAFE_INTEGER;
    const bNumber = b.playoff?.gameNumber ?? Number.MAX_SAFE_INTEGER;

    if (aNumber !== bNumber) return aNumber - bNumber;

    return getGameTimestamp(a) - getGameTimestamp(b);
  });

const getLatestSeriesGame = (series: NBAPlayoffSeries) => {
  const games = sortSeriesGames(series.games);

  return games[games.length - 1] ?? null;
};

const getFirstSeriesGame = (series: NBAPlayoffSeries) =>
  getSeriesGameNumber(series, 1) ?? sortSeriesGames(series.games)[0] ?? null;

const getStatusText = (game?: NBAPlayoffGame | null) =>
  game?.status?.shortDetail ||
  game?.status?.detail ||
  game?.status?.description ||
  "";

const getTeamIdentity = (
  team?: NBAPlayoffTeam | null,
  fallback?: NBAPlayoffId,
): NBAPlayoffId | undefined => {
  const identity = team?.id ?? team?.espnId ?? team?.code ?? fallback;

  if (identity === undefined || identity === null || identity === "") {
    return undefined;
  }

  return identity;
};

const getTeamIdentityKey = (
  team?: NBAPlayoffTeam | null,
  fallback?: NBAPlayoffId,
) => {
  const identity = getTeamIdentity(team, fallback);

  return identity === undefined ? undefined : String(identity);
};

const getTeamScore = (team?: NBAPlayoffTeam | null) =>
  typeof team?.score === "number" ? team.score : null;

const isCompletedGame = (game: NBAPlayoffGame) => {
  const state = String(game.status?.state ?? "").toLowerCase();
  const statusText = getStatusText(game).toLowerCase();

  return (
    game.status?.completed === true ||
    state === "post" ||
    statusText.includes("final")
  );
};

const toBracketTeam = (
  team: NBAPlayoffTeam | undefined,
  series: NBAPlayoffSeries,
  index: number,
): NBAPlayoffTeam | undefined => {
  const fallbackId = series.teamIds[index] ?? series.teamCodes[index];
  const id = getTeamIdentity(team, fallbackId);

  if (id === undefined) return undefined;

  const code = team?.code ?? series.teamCodes[index] ?? "TBD";

  return {
    id,
    espnId: team?.espnId ?? null,
    name: team?.name ?? team?.shortName ?? series.teamNames[index] ?? code,
    shortName: team?.shortName ?? null,
    code,
    logo: team?.logo,
    seed:
      team?.seed ??
      team?.playoffSeed ??
      (index === 0 ? series.topSeed : series.bottomSeed) ??
      null,
    playoffSeed:
      team?.playoffSeed ??
      team?.seed ??
      (index === 0 ? series.topSeed : series.bottomSeed) ??
      null,
    conference:
      normalizeConference(team?.conference) ??
      normalizeConference(series.conference),
    score: team?.score,
    record: team?.record,
    winner: team?.winner ?? null,
  };
};

const getTeamSeed = (team?: NBAPlayoffTeam | null) => {
  const rawSeed = team?.playoffSeed ?? team?.seed;
  const parsed = Number(rawSeed);

  return Number.isFinite(parsed) ? parsed : null;
};

const getAllSeriesTeams = (series: NBAPlayoffSeries) => {
  const teamMap = new Map<string, NBAPlayoffTeam>();

  const addTeam = (team?: NBAPlayoffTeam | null) => {
    const key = getTeamIdentityKey(team);

    if (!key || !team) return;

    const existing = teamMap.get(key);

    teamMap.set(key, {
      ...existing,
      ...team,
      seed: team.seed ?? existing?.seed ?? null,
      playoffSeed: team.playoffSeed ?? existing?.playoffSeed ?? null,
      logo: team.logo ?? existing?.logo ?? null,
      code: team.code ?? existing?.code,
      name: team.name ?? existing?.name,
      shortName: team.shortName ?? existing?.shortName,
      conference: team.conference ?? existing?.conference ?? series.conference,
    });
  };

  addTeam(series.teams?.top ?? null);
  addTeam(series.teams?.bottom ?? null);

  series.games.forEach((game) => {
    addTeam(game.home ?? null);
    addTeam(game.away ?? null);
  });

  return [...teamMap.values()];
};

const getSeriesSeedNumbers = (series: NBAPlayoffSeries) => {
  return getAllSeriesTeams(series)
    .map(getTeamSeed)
    .filter((seed): seed is number => seed !== null)
    .sort((a, b) => a - b);
};

const getSeriesTeams = (series: NBAPlayoffSeries) => {
  const firstGame = getFirstSeriesGame(series);

  const allTeams = getAllSeriesTeams(series).sort((a, b) => {
    const aSeed = getTeamSeed(a) ?? Number.MAX_SAFE_INTEGER;
    const bSeed = getTeamSeed(b) ?? Number.MAX_SAFE_INTEGER;

    if (aSeed !== bSeed) return aSeed - bSeed;

    return String(a.code ?? a.name ?? "").localeCompare(
      String(b.code ?? b.name ?? ""),
    );
  });

  const topSource = series.teams?.top ?? allTeams[0] ?? firstGame?.away;
  const bottomSource = series.teams?.bottom ?? allTeams[1] ?? firstGame?.home;

  return {
    topTeam: toBracketTeam(topSource, series, 0),
    bottomTeam: toBracketTeam(bottomSource, series, 1),
  };
};

const FIRST_ROUND_SEED_SLOTS = [
  [1, 8],
  [4, 5],
  [3, 6],
  [2, 7],
];

const SEMIFINAL_SEED_SLOTS = [
  [1, 4, 5, 8],
  [2, 3, 6, 7],
];

const getSeriesBracketSlot = (series: NBAPlayoffSeries, round: number) => {
  const seeds = getSeriesSeedNumbers(series);

  if (round === 1) {
    const index = FIRST_ROUND_SEED_SLOTS.findIndex((slot) =>
      seeds.some((seed) => slot.includes(seed)),
    );

    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  if (round === 2) {
    const index = SEMIFINAL_SEED_SLOTS.findIndex((slot) =>
      seeds.some((seed) => slot.includes(seed)),
    );

    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  }

  return 0;
};

const sortSeriesForBracket = (series: NBAPlayoffSeries[], round: number) => {
  return [...series].sort((a, b) => {
    const aSlot = getSeriesBracketSlot(a, round);
    const bSlot = getSeriesBracketSlot(b, round);

    if (aSlot !== bSlot) return aSlot - bSlot;

    const aSeeds = getSeriesSeedNumbers(a);
    const bSeeds = getSeriesSeedNumbers(b);

    const aBestSeed = aSeeds[0] ?? Number.MAX_SAFE_INTEGER;
    const bBestSeed = bSeeds[0] ?? Number.MAX_SAFE_INTEGER;

    if (aBestSeed !== bBestSeed) return aBestSeed - bBestSeed;

    return (
      getGameTimestamp(getFirstSeriesGame(a)) -
      getGameTimestamp(getFirstSeriesGame(b))
    );
  });
};

const mapConferenceSeries = (
  series: NBAPlayoffSeries[],
  conference: Conference,
  round: number,
  layoutCount: number,
) =>
  sortSeriesForBracket(series, round)
    .slice(0, layoutCount)
    .map((item, index) =>
      toBracketSeries(
        item,
        conference,
        round,
        `${conference}-r${round}-${index}`,
      ),
    );

const getSeriesWins = (series: NBAPlayoffSeries) => {
  if (series.wins && Object.keys(series.wins).length > 0) {
    return { ...series.wins };
  }

  const wins: Record<string, number> = {};
  const { topTeam, bottomTeam } = getSeriesTeams(series);

  [topTeam, bottomTeam].forEach((team) => {
    const key = getTeamIdentityKey(team);

    if (key) wins[key] = 0;
  });

  series.games.forEach((game) => {
    if (!isCompletedGame(game)) return;

    const homeKey = getTeamIdentityKey(game.home);
    const awayKey = getTeamIdentityKey(game.away);
    const hasWinnerFlag =
      game.home?.winner != null || game.away?.winner != null;

    let winnerKey: string | undefined;

    if (game.home?.winner === true) {
      winnerKey = homeKey;
    } else if (game.away?.winner === true) {
      winnerKey = awayKey;
    } else if (!hasWinnerFlag) {
      const homeScore = getTeamScore(game.home);
      const awayScore = getTeamScore(game.away);

      if (homeScore != null && awayScore != null && homeScore !== awayScore) {
        winnerKey = homeScore > awayScore ? homeKey : awayKey;
      }
    }

    if (winnerKey) {
      wins[winnerKey] = (wins[winnerKey] ?? 0) + 1;
    }
  });

  return wins;
};

const getSeriesWinner = (
  topTeam: NBAPlayoffTeam | undefined,
  bottomTeam: NBAPlayoffTeam | undefined,
  wins: Record<string, number>,
) => {
  const topWins = topTeam ? (wins[String(topTeam.id)] ?? 0) : 0;
  const bottomWins = bottomTeam ? (wins[String(bottomTeam.id)] ?? 0) : 0;

  if (topWins < 4 && bottomWins < 4) return undefined;
  if (topWins === bottomWins) return undefined;

  return topWins > bottomWins ? topTeam : bottomTeam;
};

const toBracketSeries = (
  series: NBAPlayoffSeries,
  conference: NBABracketMatchup["conference"],
  round: number,
  fallbackId: string,
): NBABracketMatchup => {
  const latestGame = getLatestSeriesGame(series);
  const { topTeam, bottomTeam } = getSeriesTeams(series);
  const wins = getSeriesWins(series);

  const topWins = topTeam ? (wins[String(topTeam.id)] ?? 0) : 0;
  const bottomWins = bottomTeam ? (wins[String(bottomTeam.id)] ?? 0) : 0;

  const backendWinner =
    series.winner && typeof series.winner === "object"
      ? toBracketTeam(series.winner as NBAPlayoffTeam, series, 0)
      : undefined;

  const backendLeader =
    series.leader && typeof series.leader === "object"
      ? getTeamIdentity(series.leader as NBAPlayoffTeam)
      : (series.leader as NBAPlayoffId | undefined);

  const leader =
    backendLeader ??
    (topWins === bottomWins
      ? undefined
      : topWins > bottomWins
        ? topTeam?.id
        : bottomTeam?.id);

  return {
    id: String(latestGame?.id ?? series.key ?? fallbackId),
    round,
    conference,
    topTeam,
    bottomTeam,
    winner: backendWinner ?? getSeriesWinner(topTeam, bottomTeam, wins),
    wins,
    leader,
    seriesSummary: series.seriesSummary ?? null,
    status: series.seriesSummary ?? getStatusText(latestGame),
    games: series.games,
  } as NBABracketMatchup;
};

const buildPlayoffBracketFromRounds = (
  rounds: NBAPlayoffRound[],
): PlayoffBracket | null => {
  const firstRound = splitSeriesByConference(
    getRoundByAliases(
      rounds,
      [
        "first round",
        "round 1",
        "round one",
        "conference quarterfinals",
        "conference quarterfinal",
        "quarterfinals",
        "quarterfinal",
        "opening round",
      ],
      [1],
    ),
  );

  const semifinals = splitSeriesByConference(
    getRoundByAliases(
      rounds,
      [
        "conference semifinals",
        "conference semifinal",
        "conf semifinals",
        "conf semifinal",
        "conf semis",
        "semifinals",
        "semifinal",
        "semi finals",
        "semi final",
        "second round",
        "round 2",
        "round two",
      ],
      [2],
    ),
  );

  const conferenceFinals = splitSeriesByConference(
    getRoundByAliases(
      rounds,
      [
        "conference finals",
        "conference final",
        "conf finals",
        "conf final",
        "eastern conference finals",
        "eastern conference final",
        "western conference finals",
        "western conference final",
        "east finals",
        "east final",
        "west finals",
        "west final",
        "third round",
        "round 3",
        "round three",
      ],
      [3],
    ),
  );

  const finalsRound = getFinalsRound(rounds);
  const finalsSeries = finalsRound?.series?.[0];

  const bracket: PlayoffBracket = {
    west: [
      mapConferenceSeries(
        firstRound.west,
        "west",
        1,
        WEST_ROUND1_LAYOUTS.length,
      ),
      mapConferenceSeries(
        semifinals.west,
        "west",
        2,
        WEST_ROUND2_LAYOUTS.length,
      ),
      mapConferenceSeries(
        conferenceFinals.west,
        "west",
        3,
        WEST_ROUND3_LAYOUTS.length,
      ),
    ],
    east: [
      mapConferenceSeries(
        firstRound.east,
        "east",
        1,
        EAST_ROUND1_LAYOUTS.length,
      ),
      mapConferenceSeries(
        semifinals.east,
        "east",
        2,
        EAST_ROUND2_LAYOUTS.length,
      ),
      mapConferenceSeries(
        conferenceFinals.east,
        "east",
        3,
        EAST_ROUND3_LAYOUTS.length,
      ),
    ],
    finals: finalsSeries
      ? toBracketSeries(finalsSeries, "finals", 4, "finals")
      : null,
  };

  const hasSeries =
    bracket.west.some((round) => round.length > 0) ||
    bracket.east.some((round) => round.length > 0) ||
    Boolean(bracket.finals);

  return hasSeries ? bracket : null;
};

export function NBAPlayoffBracket({
  rounds,
  loading,
  error,
  refreshing,
  onRefresh,
}: {
  rounds: NBAPlayoffRound[];
  loading: boolean;
  error: Error | string | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { resolvedColorScheme } = usePreferences();
  const isDark = resolvedColorScheme === "dark";

  const styles = useMemo(() => NBAPlayoffBracketStyles(isDark), [isDark]);
  const global = useMemo(() => globalStyles(isDark), [isDark]);
  const bracket = useMemo(
    () => buildPlayoffBracketFromRounds(rounds),
    [rounds],
  );

  if (loading) {
    return (
      <View style={global.emptyContainer}>
        <CustomActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <Text style={global.errorText}>
        {typeof error === "string" ? error : error.message}
      </Text>
    );
  }

  if (!bracket) {
    return (
      <View style={global.emptyContainer}>
        <Text style={global.emptyText}>No playoff bracket available.</Text>
        <Text style={global.emptySubText}>
          Playoff series will appear here once the postseason data is available.
        </Text>
      </View>
    );
  }

  const PlayoffsLogo = isDark ? NBAPlayoffsLight : NBAPlayoffsDark;

  return (
    <ScrollView
      snapToOffsets={snapBracketOffsets}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDark ? Colors.white : Colors.black}
        />
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        directionalLockEnabled
      >
        <View style={styles.canvas}>
          <Text style={[styles.sideLabel, styles.westLabel]}>WEST</Text>
          <Text style={[styles.sideLabel, styles.eastLabel]}>EAST</Text>

          <RoundLabel
            title="First Round"
            x={getColCenter(COLS.WEST_R1)}
            isDark={isDark}
          />

          <RoundLabel
            title="Conference Semifinals"
            x={getColCenter(COLS.WEST_R2)}
            isDark={isDark}
          />

          <RoundLabel
            title="Conference Finals"
            x={getColCenter(COLS.WEST_R3)}
            isDark={isDark}
          />

          <RoundLabel
            title="NBA Finals"
            x={getColCenter(COLS.FINALS)}
            isDark={isDark}
          />

          <RoundLabel
            title="Conference Finals"
            x={getColCenter(COLS.EAST_R3)}
            isDark={isDark}
          />

          <RoundLabel
            title="Conference Semifinals"
            x={getColCenter(COLS.EAST_R2)}
            isDark={isDark}
          />

          <RoundLabel
            title="First Round"
            x={getColCenter(COLS.EAST_R1)}
            isDark={isDark}
          />

          <Image
            source={PlayoffsLogo}
            style={styles.playoffsLogo}
            resizeMode="contain"
          />

          <ConnectorLayer isDark={isDark} />

          {bracket.west[0].map((matchup, index) => (
            <GameCard
              key={matchup.id}
              matchup={matchup}
              layout={WEST_ROUND1_LAYOUTS[index]}
              isDark={isDark}
            />
          ))}

          {bracket.west[1].map((matchup, index) => (
            <GameCard
              key={matchup.id}
              matchup={matchup}
              layout={WEST_ROUND2_LAYOUTS[index]}
              isDark={isDark}
            />
          ))}

          {bracket.west[2].map((matchup, index) => (
            <GameCard
              key={matchup.id}
              matchup={matchup}
              layout={WEST_ROUND3_LAYOUTS[index]}
              isDark={isDark}
            />
          ))}

          {bracket.east[2].map((matchup, index) => (
            <GameCard
              key={matchup.id}
              matchup={matchup}
              layout={EAST_ROUND3_LAYOUTS[index]}
              isDark={isDark}
            />
          ))}

          {bracket.east[1].map((matchup, index) => (
            <GameCard
              key={matchup.id}
              matchup={matchup}
              layout={EAST_ROUND2_LAYOUTS[index]}
              isDark={isDark}
            />
          ))}

          {bracket.east[0].map((matchup, index) => (
            <GameCard
              key={matchup.id}
              matchup={matchup}
              layout={EAST_ROUND1_LAYOUTS[index]}
              isDark={isDark}
            />
          ))}

          {bracket.finals ? (
            <GameCard
              matchup={bracket.finals}
              layout={FINALS_LAYOUT}
              isDark={isDark}
              finals={true}
            />
          ) : null}
        </View>
      </ScrollView>
    </ScrollView>
  );
}
