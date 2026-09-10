import assert from "node:assert/strict";
import test from "node:test";
import type { BaseballPlay } from "../hooks/BaseballHooks/useBaseballGameDetails.ts";
import * as animationUtils from "../components/Sports/Baseball/GameDetails/PlayByPlay/baseball-play-animation-utils.js";

const { mapEspnHitCoordinate, resolveBaseballPlayAnimation } = animationUtils;

function createPlay(
  overrides: Partial<BaseballPlay> & Pick<BaseballPlay, "id">,
): BaseballPlay {
  const { id, ...rest } = overrides;

  return {
    id,
    sequenceNumber: 1,
    type: {
      id: "1",
      text: "Start Batter/Pitcher",
      type: "start-batterpitcher",
    },
    text: null,
    awayScore: 0,
    homeScore: 0,
    period: {
      type: "Top",
      number: 1,
      displayValue: "1st Inning",
    },
    scoringPlay: false,
    scoreValue: 0,
    outs: 1,
    ...rest,
  };
}

test("resolves a play-result hit from its coordinate-bearing at-bat play", () => {
  const start = createPlay({
    id: "start",
    atBatId: "at-bat-1",
    onSecond: { athlete: { id: "runner-1" } },
  });
  const ballInPlay = createPlay({
    id: "contact",
    sequenceNumber: 2,
    atBatId: "at-bat-1",
    type: { id: "22", text: "Fly Out", type: "fly-out" },
    hitCoordinate: { x: 204, y: 102 },
    trajectory: "F",
    onSecond: { athlete: { id: "runner-1" } },
  });
  const result = createPlay({
    id: "result",
    sequenceNumber: 3,
    atBatId: "at-bat-1",
    type: { id: "57", text: "Play Result", type: "play-result" },
    alternativeType: { id: "22", text: "Fly Out", type: "fly-out" },
    text: "Batter flied out to right, Runner to third.",
    onThird: { athlete: { id: "runner-1" } },
    participants: [
      { athlete: { id: "pitcher-1" }, type: "pitcher" },
      { athlete: { id: "batter-1" }, type: "batter" },
      { athlete: { id: "runner-1" }, type: "onThird" },
    ],
  });

  const animation = resolveBaseballPlayAnimation(
    [start, ballInPlay, result],
    result,
  );

  assert.equal(animation?.kind, "hit");
  assert.equal(animation?.actionPlay.id, "contact");
  assert.deepEqual(animation?.coordinate, { x: 204, y: 102 });
  assert.deepEqual(animation?.runnerMovements, [
    {
      athleteId: "runner-1",
      from: "second",
      to: "third",
      isOut: false,
    },
    {
      athleteId: "batter-1",
      from: "home",
      to: "first",
      isOut: true,
    },
  ]);
});

test("maps ESPN's 250-square hit coordinates into the field viewbox", () => {
  const point = mapEspnHitCoordinate({ x: 204, y: 102 }, 780, 376);

  assert.ok(Math.abs(point.x - 636.48) < 0.0001);
  assert.ok(Math.abs(point.y - 153.408) < 0.0001);
});

test("uses a pitch coordinate when the active play has no batted ball", () => {
  const pitch = createPlay({
    id: "pitch",
    atBatId: "at-bat-2",
    type: { id: "5", text: "Ball", type: "ball" },
    pitchCoordinate: { x: 108, y: 146 },
  });

  const animation = resolveBaseballPlayAnimation([pitch], pitch);

  assert.equal(animation?.kind, "pitch");
  assert.equal(animation?.actionPlay.id, "pitch");
  assert.deepEqual(animation?.runnerMovements, []);
});
