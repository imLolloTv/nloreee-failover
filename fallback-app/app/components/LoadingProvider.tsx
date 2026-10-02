"use client";

import { createContext, useContext, useEffect, useState } from "react";

const DISPLAY_MS = 1200;

const LoadingContext = createContext(true);

export function useLoading() {
  return useContext(LoadingContext);
}

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFading(true), DISPLAY_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <LoadingContext.Provider value={loading}>
      {children}
      {!gone && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            backgroundColor: "var(--loading-bg)",
            opacity: fading ? 0 : 1,
            pointerEvents: fading ? "none" : "auto",
            transition: "opacity 0.4s ease-out",
          }}
          onTransitionEnd={() => {
            if (fading) {
              setGone(true);
              setLoading(false);
            }
          }}
        >
          <div className={fading ? "" : "animate-pulse"}>
            <img src="/failover/memoji-nobg.png" className="w-32 h-32" alt="" />
          </div>
          <p
            className="mt-6 font-mono text-xs uppercase tracking-[0.3em]"
            style={{ color: "var(--loading-text)" }}
          >
            LOADING ...
          </p>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
