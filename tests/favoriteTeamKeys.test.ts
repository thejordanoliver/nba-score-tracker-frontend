import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFavoriteTeamKey,
  normalizeFavoriteTeamKey,
  normalizeFavoriteTeamKeys,
  reorderFavoriteRailItems,
  splitFavoriteRailOrder,
  type FavoriteItem,
} from "../types/favorites";

test("favorite-team keys are canonical lowercase league-plus-team identities", () => {
  assert.equal(normalizeFavoriteTeamKey(" NBA:017 "), "nba:17");
  assert.equal(buildFavoriteTeamKey("CFB", 113), "cfb:113");
});

test("favorite-team normalization preserves order and removes duplicates", () => {
  assert.deepEqual(
    normalizeFavoriteTeamKeys([
      "NBA:17",
      "nfl:2",
      "CFB:113",
      "nba:17",
    ]),
    ["nba:17", "nfl:2", "cfb:113"],
  );
});

test("unprefixed, malformed, unsupported, and invalid IDs are not guessed", () => {
  assert.deepEqual(
    normalizeFavoriteTeamKeys([
      "19",
      "nba:not-a-number",
      "epl:1",
      "nba:0",
      "nba:-1",
    ]),
    [],
  );
});

const favoriteRailItems: FavoriteItem[] = [
  {
    kind: "league",
    id: "nfl",
    league: "nfl",
    name: "NFL",
    logo: 1,
    key: "league:nfl",
  },
  {
    kind: "league",
    id: "nba",
    league: "nba",
    name: "NBA",
    logo: 2,
    key: "league:nba",
  },
  {
    kind: "team",
    id: "17",
    code: "BOS",
    league: "nba",
    name: "Boston Celtics",
    key: "nba:17",
  },
  {
    kind: "team",
    id: "2",
    code: "BUF",
    league: "nfl",
    name: "Buffalo Bills",
    key: "nfl:2",
  },
];

test("combined rail order splits into independent team and sport order", () => {
  assert.deepEqual(splitFavoriteRailOrder(favoriteRailItems), {
    favoriteTeamIds: ["nba:17", "nfl:2"],
    favoriteSports: ["nfl", "nba"],
  });
});

test("sports reorder only within the sports area", () => {
  assert.deepEqual(
    reorderFavoriteRailItems(favoriteRailItems, 0, 1).map((item) => item.key),
    ["league:nba", "league:nfl", "nba:17", "nfl:2"],
  );

  assert.deepEqual(
    reorderFavoriteRailItems(favoriteRailItems, 1, 3).map((item) => item.key),
    favoriteRailItems.map((item) => item.key),
  );
});

test("teams reorder only within the teams area", () => {
  assert.deepEqual(
    reorderFavoriteRailItems(favoriteRailItems, 2, 3).map((item) => item.key),
    ["league:nfl", "league:nba", "nfl:2", "nba:17"],
  );

  assert.deepEqual(
    reorderFavoriteRailItems(favoriteRailItems, 2, 0).map((item) => item.key),
    favoriteRailItems.map((item) => item.key),
  );
});
