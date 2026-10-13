const START = 110;
const FLOOR = -203;
const MAX_REQUIREMENTS = 110;

function parseCount(value, name) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return { error: `${name} must be a whole number from 0 to ${MAX_REQUIREMENTS}.` };
  }
  return Number(value);
}

export function computeScore(input) {
  const unmet5 = parseCount(input.unmet5, "5-point count");
  const unmet3 = parseCount(input.unmet3, "3-point count");
  const unmet1 = parseCount(input.unmet1, "1-point count");
  for (const parsed of [unmet5, unmet3, unmet1]) {
    if (parsed && typeof parsed === "object") {
      return { ok: false, error: parsed.error };
    }
  }
  for (const [name, n] of [
    ["5-point count", unmet5],
    ["3-point count", unmet3],
    ["1-point count", unmet1],
  ]) {
    if (n > MAX_REQUIREMENTS) {
      return { ok: false, error: `${name} must be a whole number from 0 to ${MAX_REQUIREMENTS}.` };
    }
  }
  const total = unmet5 + unmet3 + unmet1;
  if (total > MAX_REQUIREMENTS) {
    return {
      ok: false,
      error: `Those counts add up to ${total}. NIST SP 800-171 has ${MAX_REQUIREMENTS} requirements, so the three buckets cannot sum past that.`,
    };
  }
  const raw = START - 5 * unmet5 - 3 * unmet3 - unmet1;
  const floored = raw < FLOOR;
  return {
    ok: true,
    raw,
    shown: floored ? FLOOR : raw,
    floored,
    unmet5,
    unmet3,
    unmet1,
    formula: `${START} - (5 × ${unmet5}) - (3 × ${unmet3}) - ${unmet1} = ${raw}`,
  };
}
