import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "nloreee.it - Offline",
  description: "nloreee.it è temporaneamente offline. La pagina verrà ricaricata automaticamente quando il sito tornerà disponibile.",
  robots: { index: false, follow: false },
  icons: { icon: [{ url: "/failover/favicon.ico", sizes: "48x48", type: "image/x-icon" }] },
};

export default function FallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
