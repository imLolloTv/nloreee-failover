"use client";

import DecryptedText from '@/components/DecryptedText';
import LiveStatus from "@/app/components/LiveStatus";

export default function Header() {
  return (
    <header className="flex flex-row flex-wrap gap-y-2 justify-between font-mono uppercase text-xs pb-8 tracking-wider border-b-1 border-gray-200">
        <DecryptedText
          text="ImLolloTv // Directory"
          animateOn="view"
          speed={60}
          maxIterations={100}
          sequential={true}
        />

        <LiveStatus />
    </header>
  );
}
