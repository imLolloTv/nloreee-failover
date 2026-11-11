"use client";

import { useEffect, useState } from "react";

export default function Footer() {
  const [sessionUptime, setSessionUptime] = useState<string>("00:00");

  useEffect(() => {
    let start = Date.now();
    try {
      const stored = sessionStorage.getItem("failover_session_start");
      if (stored) {
        start = parseInt(stored, 10);
      } else {
        sessionStorage.setItem("failover_session_start", String(start));
      }
    } catch {}

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      setSessionUptime(`${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="w-full border-t border-line bg-surface/80 py-8 font-mono text-xs text-muted mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-line">
          <div className="space-y-1">
            <span className="text-[10px] text-muted font-semibold uppercase block">FAILOVER NODE</span>
            <p className="text-fg font-medium">nloreee.it // cloudflare-edge</p>
            <p className="text-[11px] text-muted">Anycast Global Edge Network</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted font-semibold uppercase block">SESSION TIME</span>
            <p className="text-fg font-medium tabular-nums">{sessionUptime}</p>
            <p className="text-[11px] text-muted">Failover session active</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted font-semibold uppercase block">HEALTHCHECK</span>
            <p className="text-fg font-medium">HTTP 503 // RETRY ACTIVE</p>
            <p className="text-[11px] text-muted">Automatic background probe</p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-muted font-semibold uppercase block">DIAGNOSTICS</span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
              <span className="text-fg font-medium">UPSTREAM_UNAVAILABLE</span>
            </div>
            <p className="text-[11px] text-muted">Auto-healing via Cloudflare</p>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span>nloreee.it &copy; {new Date().getFullYear()}</span>
            <span className="opacity-40">|</span>
            <span>Edge Failover Infrastructure</span>
          </div>

          <div className="text-xs text-muted">
            <span>Server status synchronizes automatically</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
