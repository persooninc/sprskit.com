import assert from "node:assert/strict";
import test from "node:test";
import { computeScore } from "./score.js";

test("implemented requirements stay at 110", () => {
  const result = computeScore({ unmet5: "0", unmet3: "0", unmet1: "0" });
  assert.equal(result.ok, true);
  assert.equal(result.shown, 110);
  assert.equal(result.floored, false);
});

test("subtracts 5, 3, and 1 point buckets", () => {
  const result = computeScore({ unmet5: "1", unmet3: "1", unmet1: "1" });
  assert.equal(result.raw, 101);
  assert.equal(result.shown, 101);
  assert.match(result.formula, /110 - \(5 × 1\) - \(3 × 1\) - 1 = 101/);
});

test("accepts integer numbers as well as digit strings", () => {
  const result = computeScore({ unmet5: 2, unmet3: 0, unmet1: 0 });
  assert.equal(result.raw, 100);
});

test("applies the published -203 floor and still reports the raw total", () => {
  const result = computeScore({ unmet5: "63", unmet3: "0", unmet1: "0" });
  assert.equal(result.raw, 110 - 315);
  assert.equal(result.shown, -203);
  assert.equal(result.floored, true);
});

test("rejects a bucket past 110, a sum past 110, and non-integers", () => {
  assert.equal(computeScore({ unmet5: "111", unmet3: "0", unmet1: "0" }).ok, false);
  assert.equal(computeScore({ unmet5: "40", unmet3: "40", unmet1: "40" }).ok, false);
  assert.equal(computeScore({ unmet5: "1.5", unmet3: "0", unmet1: "0" }).ok, false);
  assert.equal(computeScore({ unmet5: "-1", unmet3: "0", unmet1: "0" }).ok, false);
  assert.equal(computeScore({ unmet5: "", unmet3: "0", unmet1: "0" }).ok, false);
});
