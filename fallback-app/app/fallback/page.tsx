"use client";

import { useSound } from "@/app/hooks/useSounds";
import ClientPage from "@/app/components/ClientPage";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";

export default function Fallback() {
  const playHover = useSound("/failover/hover.mp3");
  const playClick = useSound("/failover/click.wav");

  return (
    <ClientPage>
      <div className="min-h-screen flex flex-col p-12 lg:p-16">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center my-10">
          <p className="font-mono text-6xl font-bold tracking-tight">OFFLINE</p>
          <p className="mt-4 font-mono uppercase text-xs text-gray-500 tracking-wider text-center">
            Il sito è temporaneamente offline, torna più tardi
          </p>
          <button
            className="mt-8 bg-black text-white hover:bg-white hover:text-black border border-transparent hover:border-black dark:hover:border-white text-xs font-semibold tracking-wider px-5 py-3 inline-flex items-center justify-center transition-all duration-200 cursor-pointer"
            onMouseEnter={playHover}
            onClick={() => {
              playClick();
              window.location.reload();
            }}
          >
            Riprova
          </button>
        </div>
        <Footer />
      </div>
    </ClientPage>
  );
}
