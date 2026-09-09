import assert from "node:assert/strict";
import test from "node:test";
import type {
  ConferenceStandings,
  StandingsTeam,
} from "../hooks/LeagueHooks/useLeagueStandings";
import {
  buildStandingsPreviewRows,
  formatStandingsMetric,
  formatStandingsRecord,
} from "../utils/standingsWidget";

const team = (id: string, wins: number, losses: number): StandingsTeam => ({
  id,
  name: `Team ${id}`,
  shortName: null,
  code: id.toUpperCase(),
  conference: "",
  division: "",
  wins,
  losses,
  ties: 0,
  winPercent: wins / Math.max(wins + losses, 1),
  streak: null,
});

test("interleaves conference leaders and respects the row limit", () => {
  const conferences: ConferenceStandings[] = [
    {
      id: "east",
      name: "Eastern Conference",
      abbreviation: "E",
      standings: [team("a", 10, 2), team("b", 9, 3)],
    },
    {
      id: "west",
      name: "Western Conference",
      abbreviation: "W",
      standings: [team("c", 11, 1), team("d", 8, 4)],
    },
  ];

  assert.deepEqual(
    buildStandingsPreviewRows(conferences, 3).map((row) => ({
      conference: row.conference,
      id: row.team.id,
      position: row.position,
    })),
    [
      { conference: "E", id: "a", position: 1 },
      { conference: "W", id: "c", position: 1 },
      { conference: "E", id: "b", position: 2 },
    ],
  );
});

test("deduplicates teams returned in more than one conference", () => {
  const duplicate = team("same", 8, 2);
  const conferences: ConferenceStandings[] = [
    { id: "one", name: "One", abbreviation: "1", standings: [duplicate] },
    { id: "two", name: "Two", abbreviation: "2", standings: [duplicate] },
  ];

  assert.equal(buildStandingsPreviewRows(conferences, 5).length, 1);
});

test("formats league-specific records and metrics", () => {
  const nflTeam = { ...team("nfl", 10, 5), ties: 1 };
  const nhlTeam = { ...team("nhl", 20, 10), otLosses: 4, points: 44 };

  assert.equal(formatStandingsRecord(nflTeam, "nfl"), "10-5-1");
  assert.equal(formatStandingsRecord(nhlTeam, "nhl"), "20-10-4");
  assert.equal(formatStandingsMetric(nhlTeam, "nhl"), "44");
  assert.equal(formatStandingsMetric(team("nba", 3, 1), "nba"), ".750");
});
