import Script from "next/script.js";
import { analyticsBootstrap, resolveMeasurementId } from "../lib/analytics";

export default function GoogleAnalytics({ measurementId = resolveMeasurementId() } = {}) {
  if (!measurementId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="sprskit-ga4" strategy="afterInteractive">
        {analyticsBootstrap(measurementId)}
      </Script>
    </>
  );
}
