// Hand-off from the worksheet to the sprs.sh estimator.
//
// The estimator reads its "Not met" set from the URL fragment, format `s1`
// (persooninc/sprs-sh docs/estimator-fragment.md):
//
//   https://sprs.sh/sprs-score-estimator#s1=1.1,5.3:3,12.4,13.11:5
//
// - tokens are NIST SP 800-171 requirement ids without the leading "3.",
//   sorted in requirement order and joined by commas;
// - the partial-credit requirements 3.5.3 and 3.13.11 carry ":3" or ":5"
//   (no level means the full 5);
// - 3.12.4 deducts 0 points;
// - an empty set means no fragment at all.
//
// Browsers do not send the fragment to any server, so the counts never leave
// the visitor's machine. Nothing is stored.
//
// The worksheet only collects bucket counts (how many 5-, 3- and 1-point
// requirements are not met), not which ones. To prefill the estimator, a count
// maps to the FIRST n requirements of that weight in requirement order:
//
// - 5 points: the 42 plain 5-point requirements, then 3.5.3:5, then 3.13.11:5
//   (44 at most);
// - 3 points: the 14 plain 3-point requirements, then 3.5.3:3 and 3.13.11:3
//   when the 5-point bucket did not already use them (16 at most);
// - 1 point: the 51 one-point requirements;
// - 3.12.4 (0 points) is never produced.
//
// Decoding goes the other way: each token's point value lands in its bucket.
// So encode -> decode returns the same counts, and the estimator shows the same
// score as the worksheet. Counts past a bucket's size cannot be prefilled;
// buildSprsHandoffUrl returns null for them.

export const SPRS_ESTIMATOR_URL = "https://sprs.sh/sprs-score-estimator";
export const FRAGMENT_PREFIX = "s1=";

const PARTIAL = "P";

// Point value per requirement, DoD Assessment Methodology v1.2.1, as used by
// the sprs.sh estimator page. Key = family (3.<family>.n), index = n - 1.
const WEIGHTS = {
  1: [5, 5, 1, 1, 3, 1, 1, 1, 1, 1, 1, 5, 5, 1, 1, 5, 5, 5, 3, 1, 1, 1],
  2: [5, 5, 1],
  3: [5, 3, 1, 1, 5, 1, 1, 1, 1],
  4: [5, 5, 1, 1, 5, 5, 5, 5, 1],
  5: [5, 5, PARTIAL, 1, 1, 1, 1, 1, 1, 5, 1],
  6: [5, 5, 1],
  7: [3, 5, 1, 3, 5, 1],
  8: [3, 3, 5, 1, 1, 1, 5, 3, 1],
  9: [3, 5],
  10: [5, 5, 1, 1, 1, 1],
  11: [3, 5, 1],
  12: [5, 3, 5, 0],
  13: [5, 5, 1, 1, 5, 5, 1, 3, 1, 1, PARTIAL, 1, 1, 1, 5, 1],
  14: [5, 5, 5, 5, 3, 5, 3],
};

// Short ids ("1.1") in requirement order.
const REQUIREMENTS = Object.keys(WEIGHTS)
  .map(Number)
  .sort((a, b) => a - b)
  .flatMap((family) =>
    WEIGHTS[family].map((weight, i) => ({ id: `${family}.${i + 1}`, weight })),
  );

const WEIGHT_BY_ID = new Map(REQUIREMENTS.map((r) => [r.id, r.weight]));
const PARTIAL_IDS = REQUIREMENTS.filter((r) => r.weight === PARTIAL).map((r) => r.id);

function plainIds(weight) {
  return REQUIREMENTS.filter((r) => r.weight === weight).map((r) => r.id);
}

const POOL_5 = [...plainIds(5), ...PARTIAL_IDS.map((id) => `${id}:5`)];
const PLAIN_3 = plainIds(3);
const POOL_1 = plainIds(1);

export const BUCKET_CAPACITY = Object.freeze({
  unmet5: POOL_5.length,
  unmet3: PLAIN_3.length + PARTIAL_IDS.length,
  unmet1: POOL_1.length,
});

function idParts(token) {
  return token.split(":")[0].split(".").map(Number);
}

function compareTokens(a, b) {
  const x = idParts(a);
  const y = idParts(b);
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    const d = (x[i] || 0) - (y[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

function isCount(n) {
  return Number.isInteger(n) && n >= 0;
}

// Bucket counts -> sorted s1 tokens, or null when the counts cannot be
// represented (not whole numbers, or more than a bucket holds).
export function countsToTokens({ unmet5, unmet3, unmet1 }) {
  if (![unmet5, unmet3, unmet1].every(isCount)) return null;
  if (unmet5 > POOL_5.length || unmet1 > POOL_1.length) return null;
  const five = POOL_5.slice(0, unmet5);
  const usedPartials = new Set(five.filter((t) => t.includes(":")).map((t) => t.split(":")[0]));
  const pool3 = [
    ...PLAIN_3,
    ...PARTIAL_IDS.filter((id) => !usedPartials.has(id)).map((id) => `${id}:3`),
  ];
  if (unmet3 > pool3.length) return null;
  return [...five, ...pool3.slice(0, unmet3), ...POOL_1.slice(0, unmet1)].sort(compareTokens);
}

export function encodeFragment(tokens) {
  return tokens.length ? `#${FRAGMENT_PREFIX}${tokens.join(",")}` : "";
}

// Same tolerance as the estimator: malformed tokens, unknown levels and
// duplicates are ignored. Returns sorted short tokens ("5.3:3").
export function decodeFragment(hash) {
  const h = String(hash ?? "").replace(/^#/, "");
  if (!h.startsWith(FRAGMENT_PREFIX)) return [];
  const seen = new Set();
  const out = [];
  for (const part of h.slice(FRAGMENT_PREFIX.length).split(",")) {
    const m = /^(\d{1,2}\.\d{1,2})(?::([35]))?$/.exec(part);
    if (!m || seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push(m[2] ? `${m[1]}:${m[2]}` : m[1]);
  }
  return out.sort(compareTokens);
}

// s1 tokens -> bucket counts. Unknown ids and 0-point 3.12.4 add nothing.
export function tokensToCounts(tokens) {
  const counts = { unmet5: 0, unmet3: 0, unmet1: 0 };
  for (const token of tokens) {
    const [id, level] = token.split(":");
    let points = WEIGHT_BY_ID.get(id);
    if (points === PARTIAL) points = level === "3" ? 3 : 5;
    if (points === 5) counts.unmet5 += 1;
    else if (points === 3) counts.unmet3 += 1;
    else if (points === 1) counts.unmet1 += 1;
  }
  return counts;
}

export function decodeCounts(hash) {
  return tokensToCounts(decodeFragment(hash));
}

// A successful computeScore() result -> the prefilled estimator URL. Returns
// null for a failed result or counts the estimator cannot represent. The
// counts only ever appear after "#", never in the query string.
export function buildSprsHandoffUrl(result) {
  if (!result || result.ok !== true) return null;
  const tokens = countsToTokens(result);
  if (!tokens) return null;
  return SPRS_ESTIMATOR_URL + encodeFragment(tokens);
}
