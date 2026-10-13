"use client";

import { useState } from "react";
import { computeScore } from "../lib/score";

const empty = { unmet5: "0", unmet3: "0", unmet1: "0" };

export default function Worksheet() {
  const [values, setValues] = useState(empty);
  const [result, setResult] = useState(null);

  function onSubmit(event) {
    event.preventDefault();
    setResult(computeScore(values));
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
      {result && !result.ok && <p className="error">{result.error}</p>}
      {result && result.ok && (
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
        </div>
      )}
    </form>
  );
}
