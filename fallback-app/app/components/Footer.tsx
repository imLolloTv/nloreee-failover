"use client";

import { ArrowUpRight } from "lucide-react";

const ARCHIVES = ["v1", "v2", "v3", "v4"];

export default function Footer() {
  return (
    <footer className="relative z-10 mx-auto grid w-full max-w-[1400px] grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 px-4 py-5 sm:px-8 font-ui text-[10px] uppercase tracking-widest text-[#6e75a8]">
      <span className="justify-self-center sm:justify-self-start">
        nloreee.it &copy; {new Date().getFullYear()}
      </span>

      <div className="flex items-center gap-3 sm:gap-4 justify-self-center">
        {ARCHIVES.map((v) => (
          <a
            key={v}
            href={`https://${v}.nloreee.it/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[#6e75a8] hover:text-[#2ff3ff] transition-colors px-1 py-1"
          >
            <span>{v}</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        ))}
      </div>

      <span className="justify-self-center sm:justify-self-end text-[#ff4d6d]">
        FAILOVER_MODE
      </span>
    </footer>
  );
}
