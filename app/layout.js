import "./globals.css";
import GoogleAnalytics from "../components/GoogleAnalytics";

export const metadata = {
  title: "SPRS score worksheet — sprskit.com",
  description:
    "Free arithmetic for a Supplier Performance Risk System score from 5-point, 3-point, and 1-point requirement counts. Not an official assessment. The paid kit stays on sprs.sh.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <GoogleAnalytics />
        {children}
      </body>
    </html>
  );
}
