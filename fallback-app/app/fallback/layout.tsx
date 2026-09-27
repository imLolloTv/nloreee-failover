import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "nloreee.it - Offline",
  description: "nloreee.it is temporarily offline. The page will reload automatically once the site is back.",
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/failover/favicon.ico", sizes: "48x48", type: "image/x-icon" }] },
};

export default function FallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
