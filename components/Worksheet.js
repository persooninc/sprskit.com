"use client";

import { useState } from "react";
import { EVENTS, track } from "../lib/analytics";
import { SPRS_ESTIMATOR_URL, buildSprsHandoffUrl } from "../lib/handoff";
import { computeScore } from "../lib/score";

const empty = { unmet5: "0", unmet3: "0", unmet1: "0" };

export default function Worksheet() {
  const [values, setValues] = useState(empty);
  const [result, setResult] = useState(null);

  function onSubmit(event) {
    event.preventDefault();
    const next = computeScore(values);
    setResult(next);
    if (next.ok) {
      track(EVENTS.scoreCalculated, { shown: next.shown, floored: next.floored });
    }
  }

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <form onSubmit={onSubmit}>
      <label htmlFor="unmet5">
        Unimplemented 5-point requirements
        <input
          id="unmet5"
          name="unmet5"
          inputMode="numeric"
          value={values.unmet5}
          onChange={(event) => setField("unmet5", event.target.value)}
        />
      </label>
      <label htmlFor="unmet3">
        Unimplemented 3-point requirements
        <input
          id="unmet3"
          name="unmet3"
          inputMode="numeric"
          value={values.unmet3}
          onChange={(event) => setField("unmet3", event.target.value)}
        />
      </label>
      <label htmlFor="unmet1">
        Unimplemented 1-point requirements
        <input
          id="unmet1"
          name="unmet1"
          inputMode="numeric"
          value={values.unmet1}
          onChange={(event) => setField("unmet1", event.target.value)}
        />
      </label>
      <button type="submit">Calculate score</button>
      <WorksheetResult result={result} />
    </form>
  );
}

// The result block. Renders nothing before a calculation, the error for invalid
// input, and the score plus the sprs.sh hand-off after a valid calculation.
export function WorksheetResult({ result }) {
  if (!result) return null;
  if (!result.ok) return <p className="error">{result.error}</p>;
  const handoff = buildSprsHandoffUrl(result);
  return (
    <div className="result">
      <p className="muted">Shown score</p>
      <p>
        <strong>{result.shown}</strong>
      </p>
      <p>
        <code>{result.formula}</code>
      </p>
      {result.floored && (
        <p>
          The raw total is {result.raw}. The methodology floor shown here is
          −203. Credits that could change a real score are not applied.
        </p>
      )}
      <p className="handoff">
        <a href={handoff ?? SPRS_ESTIMATOR_URL}>
          Continue on sprs.sh
        </a>
      </p>
      {handoff ? (
        <p className="muted">
          Opens the free sprs.sh estimator with the first requirements of each
          point value marked not met, so it starts at the same score. Change the
          ticks to match your own gaps. Your counts travel only in the part of
          the link after <code>#</code>, which browsers do not send to any
          server.
        </p>
      ) : (
        <p className="muted">
          These counts are more than the methodology has requirements of that
          point value, so the sprs.sh estimator opens blank.
        </p>
      )}
    </div>
  );
}
