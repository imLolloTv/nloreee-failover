import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
  // Senza questo, Turbopack usa come root la cartella che contiene il repository
  // (a volte la home) e segnala i package-lock.json che trova fuori progetto.
  turbopack: { root: path.resolve(".") },
};

export default nextConfig;
