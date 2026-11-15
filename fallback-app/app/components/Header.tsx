"use client";

import LiveStatus from "@/app/components/LiveStatus";

export default function Header() {
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-end gap-4 px-4 py-4 sm:px-8 font-ui text-[10px] uppercase tracking-widest">
      <LiveStatus />
    </header>
  );
}
