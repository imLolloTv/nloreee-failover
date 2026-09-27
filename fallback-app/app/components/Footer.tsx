"use client";

import DecryptedText from '@/components/DecryptedText';
import ThemeToggle from "@/app/components/ThemeToggle";

export default function Footer() {
  return (
    <footer className="mt-auto flex flex-row justify-between items-center font-mono uppercase text-xs text-gray-500 pt-8 tracking-wider border-t-1 border-gray-200">
        <DecryptedText
            text="Made with 🤍 by @imlollotv"
            animateOn="view"
            speed={60}
            maxIterations={100}
            sequential={true}
        />
        <ThemeToggle />
    </footer>
  );
}
