"use client";

import { useEffect, useState } from "react";
import { useSound } from "@/app/hooks/useSounds";
import { useAutoReload } from "@/app/hooks/useAutoReload";
import ClientPage from "@/app/components/ClientPage";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { RefreshCw, Radio, ExternalLink, ShieldAlert } from "lucide-react";

export default function Fallback() {
  const playHover = useSound("/failover/hover.mp3");
  const playClick = useSound("/failover/click.wav");
  const [retrying, setRetrying] = useState(false);

  useAutoReload();

  const handleRetry = () => {
    playClick();
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  // Keyboard shortcut: press 'r' to reload
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
        handleRetry();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ClientPage>
      <div className="min-h-screen flex flex-col bg-bg text-fg blueprint-grid selection:bg-fg selection:text-bg">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
          <div className="w-full max-w-2xl mx-auto space-y-8 text-center">
            
            {/* Top Coordinate Meme Reticle */}
            <div className="inline-flex items-center gap-2 font-mono text-[11px] text-muted tracking-widest uppercase border border-line bg-surface px-3 py-1 rounded-xs">
              <span className="w-2 h-0.5 bg-warn inline-block" />
              <span>SYS_FAILOVER // 503_EDGE_INTERCEPT</span>
            </div>

            {/* Monumental Header */}
            <div className="space-y-3">
              <h1 className="font-mono text-6xl sm:text-8xl font-black tracking-tighter text-fg select-none">
                OFFLINE
              </h1>
              <p className="font-mono text-xs sm:text-sm text-muted uppercase tracking-wider max-w-md mx-auto">
                The primary server node is temporarily unreachable. Automated edge healthchecks are polling for recovery.
              </p>
            </div>

            {/* Hardware Telemetry Apparatus Rack */}
            <div className="geo-cross geo-cross-tl geo-cross-br border border-line bg-surface rounded-xs p-5 sm:p-6 text-left space-y-4 font-mono text-xs shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-line text-[11px] text-muted">
                <span className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-warn" />
                  <span className="uppercase font-semibold text-fg">DIAGNOSTIC TELEMETRY</span>
                </span>
                <span className="tech-tag text-[10px]">HTTP_503</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface-2 rounded-xs border border-line space-y-1">
                  <span className="text-[10px] text-muted uppercase block">UPSTREAM STATUS</span>
                  <div className="flex items-center gap-2 text-warn font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
                    <span>CLUSTER_UNRESPONSIVE</span>
                  </div>
                </div>

                <div className="p-3 bg-surface-2 rounded-xs border border-line space-y-1">
                  <span className="text-[10px] text-muted uppercase block">EDGE DISPATCH</span>
                  <div className="flex items-center gap-2 text-ok font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-ok" />
                    <span>CLOUDFLARE_WORKER_ONLINE</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-muted">
                <span className="flex items-center gap-2">
                  <Radio className="w-3 h-3 text-accent-volt animate-pulse" />
                  <span>Auto-probing origin in background</span>
                </span>
                <span className="hidden sm:inline">Will auto-refresh when restored</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  onMouseEnter={playHover}
                  disabled={retrying}
                  className="btn-tactile font-mono text-xs uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
                  <span>{retrying ? "RECONNECTING..." : "RECONNECT TO NODE"}</span>
                </button>

                <a
                  href="https://discord.com/users/623496189056253953"
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={playHover}
                  onClick={playClick}
                  className="btn-ghost font-mono text-xs uppercase flex items-center gap-2 cursor-pointer"
                >
                  <span>Discord Comms</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Keyboard Shortcut Hint */}
              <p className="font-mono text-[11px] text-muted tracking-wider">
                PRESS <kbd className="px-1.5 py-0.5 rounded-xs border border-line bg-surface-2 text-fg font-medium">R</kbd> FOR INSTANT RECONNECT
              </p>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </ClientPage>
  );
}
