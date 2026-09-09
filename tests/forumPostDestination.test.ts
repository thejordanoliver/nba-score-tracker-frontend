import assert from "node:assert/strict";
import test from "node:test";
import {
  getForumPostCreateEndpoint,
  normalizeForumPostLeague,
  parseForumPostDestinationParams,
} from "../utils/forumPostDestination";

test("normalizes supported league route parameters", () => {
  assert.equal(normalizeForumPostLeague(" NBA "), "nba");
  assert.equal(normalizeForumPostLeague(["WNBA", "nba"]), "wnba");
  assert.equal(normalizeForumPostLeague("socc"), null);
  assert.equal(normalizeForumPostLeague(undefined), null);
});

test("creates a league destination when no team is supplied", () => {
  assert.deepEqual(
    parseForumPostDestinationParams({ league: "nfl" }),
    { kind: "league", league: "nfl" },
  );
});

test("creates a team destination only for a valid numeric team ID", () => {
  assert.deepEqual(
    parseForumPostDestinationParams({ league: "mlb", teamId: " 19 " }),
    { kind: "team", league: "mlb", teamId: "19" },
  );
  assert.equal(
    parseForumPostDestinationParams({ league: "mlb", teamId: "invalid" }),
    null,
  );
  assert.equal(
    parseForumPostDestinationParams({ league: "unknown", teamId: "19" }),
    null,
  );
});

test("builds the correct endpoint for each destination kind", () => {
  assert.equal(
    getForumPostCreateEndpoint({ kind: "league", league: "cbb" }),
    "/api/forum/league/cbb",
  );
  assert.equal(
    getForumPostCreateEndpoint({
      kind: "team",
      league: "nba",
      teamId: "22",
    }),
    "/api/forum/team/22",
  );
});
