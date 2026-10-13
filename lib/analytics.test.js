import assert from "node:assert/strict";
import test from "node:test";
import { Children } from "react";
import GoogleAnalytics from "../components/GoogleAnalytics.js";
import {
  EVENTS,
  PLACEHOLDER_ID,
  analyticsBootstrap,
  resolveMeasurementId,
  sanitizeParams,
  track,
} from "./analytics.js";

test("a missing measurement id disables the tag", () => {
  assert.equal(resolveMeasurementId({}), null);
  assert.equal(resolveMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "" }), null);
  assert.equal(resolveMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "off" }), null);
  assert.equal(resolveMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: PLACEHOLDER_ID }), null);
  assert.equal(resolveMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: "UA-123" }), null);
  assert.equal(analyticsBootstrap(null), "");
});

test("a G- id is accepted and anonymizes the IP", () => {
  assert.equal(resolveMeasurementId({ NEXT_PUBLIC_GA_MEASUREMENT_ID: " G-ABC123 " }), "G-ABC123");
  const html = analyticsBootstrap("G-ABC123");
  assert.match(html, /anonymize_ip:true/);
  assert.match(html, /send_page_view:true/);
  assert.match(html, /ad_storage:'denied'/);
  assert.match(html, /G-ABC123/);
});

test("the loader renders nothing unless an id is passed", () => {
  assert.equal(GoogleAnalytics({ measurementId: null }), null);
  const element = GoogleAnalytics({ measurementId: "G-ABC123" });
  const [loader, init] = Children.toArray(element.props.children);
  assert.equal(loader.props.src, "https://www.googletagmanager.com/gtag/js?id=G-ABC123");
  assert.equal(loader.props.strategy, "afterInteractive");
  assert.match(init.props.children, /anonymize_ip:true/);
  assert.doesNotMatch(init.props.children, /va\.vercel-scripts/);
});

test("score_calculated drops requirement counts and is a no-op without gtag", () => {
  assert.equal(track(EVENTS.scoreCalculated, { shown: 105, unmet5: 1 }), false);
  const calls = [];
  const ok = track(
    EVENTS.scoreCalculated,
    { shown: 105, floored: false, unmet5: 1, email: "a@b.c" },
    (...args) => calls.push(args),
  );
  assert.equal(ok, true);
  assert.deepEqual(calls, [["event", "score_calculated", { shown: 105, floored: false }]]);
  assert.equal(track("purchase", { shown: 1 }, () => {}), false);
});

test("sanitizeParams keeps only plain values", () => {
  assert.deepEqual(sanitizeParams({ shown: 1, note: { nested: true }, name: "x" }), { shown: 1 });
});
