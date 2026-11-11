"use client";

import { useTheme } from "@/app/components/ThemeProvider";
import { useSound } from "@/app/hooks/useSounds";

export default function ThemeToggle() {
  const { toggle } = useTheme();
  const playHover = useSound("/failover/hover.mp3");
  const playClick = useSound("/failover/click.wav");

  return (
    <button
      type="button"
      onClick={() => {
        playClick();
        toggle();
      }}
      onMouseEnter={playHover}
      aria-label="Toggle color theme"
      title="Toggle theme"
      className="relative flex h-9 w-9 sm:h-8 sm:w-8 min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-line bg-surface text-muted transition-all cursor-pointer hover:border-fg hover:text-fg"
    >
      <svg
        viewBox="0 0 24 24"
        className="hidden w-4 h-4 dark:block"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4 dark:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
