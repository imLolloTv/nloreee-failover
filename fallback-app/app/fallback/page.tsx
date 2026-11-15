"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useSound } from "@/app/hooks/useSounds";
import { useAutoReload } from "@/app/hooks/useAutoReload";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";

export default function Fallback() {
  const playHover = useSound("/failover/hover.mp3");
  const playClick = useSound("/failover/click.wav");

  useAutoReload();

  return (
    <div className="relative min-h-screen flex flex-col text-[#e8eaff]">
      <Header />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div
          className="w-full max-w-lg bg-[#0d1126]/90 backdrop-blur-sm border-2 border-[#ff4d6d] p-6 sm:p-10 text-center"
          style={{
            boxShadow:
              "0 0 36px rgba(255, 77, 109, 0.16), inset -2px -2px 0 #070914, inset 2px 2px 0 #252d59",
          }}
        >
          <div className="mx-auto mb-5 w-12 h-12 bg-[#1f0b18] border-2 border-[#ff4d6d] flex items-center justify-center text-[#ff4d6d]">
            <WifiOff className="w-6 h-6" />
          </div>

          <p className="font-ui text-[10px] uppercase tracking-[0.22em] text-[#ff4d6d] mb-2">
            503 // ORBITAL_NODE_OFFLINE
          </p>

          <h1
            className="font-pixel text-6xl sm:text-7xl leading-[0.95] text-white"
            style={{ textShadow: "3px 3px 0 #ff2fd6" }}
          >
            OFFLINE
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#c6cbf0] leading-relaxed">
            The orbital station is temporarily unreachable. Systems are running automated recovery checks in the background.
          </p>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              className="btn-tactile"
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                window.location.reload();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
