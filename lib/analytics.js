// GA4 loader inputs. The measurement id is public. An empty or invalid value
// disables the tag so local and preview hosts send nothing.

export const MEASUREMENT_ENV = "NEXT_PUBLIC_GA_MEASUREMENT_ID";
export const PLACEHOLDER_ID = "G-XXXXXXXXXX";
const MEASUREMENT_RE = /^G-[A-Z0-9]+$/;

export const EVENTS = {
  scoreCalculated: "score_calculated",
};

const BLOCKED_KEYS = /email|phone|name|token|password|unmet/i;

export function resolveMeasurementId(env = process.env) {
  const raw = env?.[MEASUREMENT_ENV];
  const value = raw === undefined || raw === null ? "" : String(raw).trim();
  if (!value || value === "off" || value === PLACEHOLDER_ID) return null;
  return MEASUREMENT_RE.test(value) ? value : null;
}

export function gtagConfig(id) {
  return {
    anonymize_ip: true,
    send_page_view: true,
    measurementId: id,
  };
}

export function sanitizeParams(params) {
  const safe = {};
  if (!params || typeof params !== "object") return safe;
  for (const [key, value] of Object.entries(params)) {
    if (BLOCKED_KEYS.test(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return safe;
}

export function track(eventName, params = {}, gtagFn = globalThis.gtag) {
  if (typeof gtagFn !== "function") return false;
  if (!eventName || typeof eventName !== "string") return false;
  if (!Object.values(EVENTS).includes(eventName)) return false;
  gtagFn("event", eventName, sanitizeParams(params));
  return true;
}

export function analyticsBootstrap(id) {
  if (!id) return "";
  const config = gtagConfig(id);
  return `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});gtag('config',${JSON.stringify(id)},{anonymize_ip:${config.anonymize_ip},send_page_view:${config.send_page_view}});`;
}
