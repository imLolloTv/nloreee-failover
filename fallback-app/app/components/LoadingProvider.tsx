"use client";

import { createContext, useContext, useEffect, useState } from "react";

const LoadingContext = createContext(false);

export function useLoading() {
  return useContext(LoadingContext);
}

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("failover_has_loaded")) {
        setGone(true);
        return;
      }
      sessionStorage.setItem("failover_has_loaded", "1");
    } catch {}

    setLoading(true);
    setGone(false);

    const t = setTimeout(() => setFading(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <LoadingContext.Provider value={loading}>
      {children}
      {!gone && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none"
          style={{
            backgroundColor: "var(--loading-bg)",
            opacity: fading ? 0 : 1,
            pointerEvents: fading ? "none" : "auto",
            transition: "opacity 0.25s var(--ease-out)",
          }}
          onTransitionEnd={() => {
            if (fading) {
              setGone(true);
              setLoading(false);
            }
          }}
        >
          <div className={fading ? "" : "animate-pulse"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/failover/memoji-nobg.png" className="w-24 h-24" alt="" />
          </div>
          <p
            className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em]"
            style={{ color: "var(--loading-text)" }}
          >
            SYS_FAILOVER ...
          </p>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
