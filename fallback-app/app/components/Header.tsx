"use client";

import { useEffect, useState } from "react";
import LiveStatus from "@/app/components/LiveStatus";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function Header() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Rome",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now);
        setTimeStr(`${formatted} CET`);
      } catch {
        setTimeStr("");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full border-b border-line bg-surface/80 backdrop-blur-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand & Live Failover Status */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="group flex items-center gap-2 font-mono text-xs font-semibold text-fg tracking-wider uppercase shrink-0">
            <span className="w-2 h-2 bg-warn inline-block" />
            <span className="font-bold">NLOREEE</span>
            <span className="hidden md:inline text-muted font-normal">/ FAILOVER</span>
          </div>

          <div className="inline-flex items-center px-2 py-0.5 rounded-xs border border-line bg-surface-2 whitespace-nowrap shrink-0">
            <LiveStatus />
          </div>

          {/* Clock & Coordinates */}
          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-muted border-l border-line pl-4 whitespace-nowrap">
            <span className="text-fg/80 tabular-nums">{timeStr}</span>
            <span className="opacity-30">|</span>
            <span className="tracking-widest">HTTP_503 // EDGE_SURFACE</span>
          </div>
        </div>

        {/* Right: Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
