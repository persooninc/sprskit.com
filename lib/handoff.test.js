import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  BUCKET_CAPACITY,
  SPRS_ESTIMATOR_URL,
  buildSprsHandoffUrl,
  countsToTokens,
  decodeCounts,
  decodeFragment,
  encodeFragment,
} from "./handoff.js";
import { computeScore } from "./score.js";

// Shared fixture: a byte-for-byte copy of persooninc/sprs-sh
// test/fixtures/estimator-fragment.json (format s1, documented in sprs-sh
// docs/estimator-fragment.md; copied from sprs-sh commit 5658252e). The
// estimator round-trips its unmet control set; this repo round-trips the
// bucket counts derived from it.
//
// How counts map to the control set (sprskit only collects counts):
//   - decode: each token adds 1 to the bucket of its point value. 3.5.3:3 and
//     3.13.11:3 count as 3-point, 3.5.3:5 / 3.13.11:5 as 5-point, 3.12.4 (0
//     points) counts nowhere.
//   - encode: a count n picks the first n requirements of that weight in
//     requirement order (plain ones first, then the partial-credit ones).
// So the fixture "#s1=1.1,1.5,3.1,5.3:3,12.4,13.11:5,14.7" is unmet5=3
// (1.1, 3.1, 13.11:5), unmet3=3 (1.5, 5.3:3, 14.7), unmet1=0, score 86.
const fixture = JSON.parse(
  readFileSync(new URL("../test/fixtures/sprs-estimator-fragment.json", import.meta.url), "utf8"),
);

test("the shared fixture decodes to the worksheet's bucket counts and score", () => {
  assert.equal(fixture.format, "s1");
  const counts = decodeCounts(fixture.fragment);
  assert.deepEqual(counts, { unmet5: 3, unmet3: 3, unmet1: 0 });
  const result = computeScore(counts);
  assert.equal(result.ok, true);
  assert.equal(result.shown, fixture.score);
  assert.equal(110 - result.shown, fixture.subtracted);
});

test("the shared fixture's control set round-trips through the s1 decoder", () => {
  const short = fixture.unmet.map((id) => id.replace(/^3\./, ""));
  assert.equal(encodeFragment(short), fixture.fragment);
  assert.deepEqual(decodeFragment(fixture.fragment), short);
});

test("encode -> decode yields the same unmet5/unmet3/unmet1 for the shared fixture", () => {
  const counts = decodeCounts(fixture.fragment);
  const url = buildSprsHandoffUrl(computeScore(counts));
  const hash = url.slice(url.indexOf("#"));
  const back = decodeCounts(hash);
  assert.deepEqual(back, counts);
  assert.equal(computeScore(back).shown, fixture.score);
});

test("buildSprsHandoffUrl returns the exact estimator URL for the fixture counts", () => {
  const result = computeScore({ unmet5: "3", unmet3: "3", unmet1: "0" });
  assert.equal(
    buildSprsHandoffUrl(result),
    "https://sprs.sh/sprs-score-estimator#s1=1.1,1.2,1.5,1.12,1.19,3.2",
  );
});

test("buildSprsHandoffUrl puts the answers after # and never in the query string", () => {
  const url = buildSprsHandoffUrl(computeScore({ unmet5: "2", unmet3: "1", unmet1: "4" }));
  const parsed = new URL(url);
  assert.equal(parsed.origin + parsed.pathname, SPRS_ESTIMATOR_URL);
  assert.equal(parsed.search, "");
  assert.equal(url.includes("?"), false);
  assert.match(parsed.hash, /^#s1=/);
  assert.deepEqual(decodeCounts(parsed.hash), { unmet5: 2, unmet3: 1, unmet1: 4 });
});

test("zero counts open the estimator with no fragment", () => {
  assert.equal(
    buildSprsHandoffUrl(computeScore({ unmet5: "0", unmet3: "0", unmet1: "0" })),
    SPRS_ESTIMATOR_URL,
  );
});

test("every count combination the estimator can hold round-trips", () => {
  for (let a = 0; a <= BUCKET_CAPACITY.unmet5; a += 1) {
    for (let b = 0; b <= BUCKET_CAPACITY.unmet3; b += 1) {
      for (const c of [0, 1, 25, BUCKET_CAPACITY.unmet1]) {
        const result = computeScore({ unmet5: a, unmet3: b, unmet1: c });
        if (!result.ok) continue;
        const url = buildSprsHandoffUrl(result);
        if (url === null) {
          // Only the partial-credit pair can be shared between buckets.
          assert.ok(a + b > BUCKET_CAPACITY.unmet5 + BUCKET_CAPACITY.unmet3 - 2, `${a}/${b}/${c}`);
          continue;
        }
        const hash = new URL(url).hash;
        assert.deepEqual(decodeCounts(hash), { unmet5: a, unmet3: b, unmet1: c }, `${a}/${b}/${c}`);
        // Same score as the estimator would compute from the fragment.
        const tokens = decodeFragment(hash);
        assert.equal(new Set(tokens.map((t) => t.split(":")[0])).size, tokens.length);
      }
    }
  }
});

test("all requirements at full deduction encode to the -203 floor", () => {
  assert.deepEqual(BUCKET_CAPACITY, { unmet5: 44, unmet3: 16, unmet1: 51 });
  const tokens = countsToTokens({ unmet5: 44, unmet3: 14, unmet1: 51 });
  assert.equal(tokens.length, 109);
  const counts = decodeCounts(encodeFragment(tokens));
  assert.equal(110 - 5 * counts.unmet5 - 3 * counts.unmet3 - counts.unmet1, -203);
});

test("buildSprsHandoffUrl returns null for invalid or unrepresentable results", () => {
  assert.equal(buildSprsHandoffUrl(null), null);
  assert.equal(buildSprsHandoffUrl(computeScore({ unmet5: "x", unmet3: "0", unmet1: "0" })), null);
  assert.equal(buildSprsHandoffUrl(computeScore({ unmet5: "45", unmet3: "0", unmet1: "0" })), null);
  assert.equal(buildSprsHandoffUrl(computeScore({ unmet5: "0", unmet3: "17", unmet1: "0" })), null);
  assert.equal(buildSprsHandoffUrl(computeScore({ unmet5: "44", unmet3: "15", unmet1: "0" })), null);
  assert.equal(buildSprsHandoffUrl(computeScore({ unmet5: "0", unmet3: "0", unmet1: "52" })), null);
});

test("decodeFragment ignores a missing prefix, malformed tokens and duplicates", () => {
  assert.deepEqual(decodeFragment(""), []);
  assert.deepEqual(decodeFragment("#1.1,1.2"), []);
  assert.deepEqual(decodeFragment("#s1=1.2,1.1,1.1,bad,5.3:4,99.1"), ["1.1", "1.2", "99.1"]);
  assert.deepEqual(decodeCounts("#s1=1.2,1.1,1.1,bad,5.3:4,99.1,12.4,13.11"), {
    unmet5: 3,
    unmet3: 0,
    unmet1: 0,
  });
});
