import assert from "node:assert/strict";
import test from "node:test";
import {
  getCollegePollLabel,
  getCollegePollOptions,
  getCollegePollPreviewLimit,
  isCollegePollTypeAvailable,
  normalizeCollegePollType,
} from "../utils/collegePollWidget";

test("offers football-specific polls only for college football", () => {
  assert.deepEqual(
    getCollegePollOptions("cfb").map((option) => option.value),
    ["ap", "coaches", "cfp", "fcs"],
  );
  assert.deepEqual(
    getCollegePollOptions("cbb").map((option) => option.value),
    ["ap", "coaches"],
  );
});

test("normalizes unsupported basketball poll selections to AP", () => {
  assert.equal(isCollegePollTypeAvailable("cbb", "cfp"), false);
  assert.equal(normalizeCollegePollType("cbb", "cfp"), "ap");
  assert.equal(normalizeCollegePollType("cfb", "cfp"), "cfp");
});

test("provides stable poll labels and responsive preview limits", () => {
  assert.equal(getCollegePollLabel("cfb", "fcs"), "FCS Coaches Poll");
  assert.equal(getCollegePollLabel("cbb", "coaches"), "Coaches Poll");
  assert.equal(getCollegePollPreviewLimit(200), 3);
  assert.equal(getCollegePollPreviewLimit(220, true), 4);
  assert.equal(getCollegePollPreviewLimit(420), 10);
  assert.equal(getCollegePollPreviewLimit(1_000), 10);
});
