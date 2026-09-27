"use client";

import { useCallback } from "react";

const cache: Record<string, HTMLAudioElement> = {};

function getAudio(src: string): HTMLAudioElement {
  if (!cache[src]) {
    const audio = new Audio(src);
    audio.preload = "auto";
    cache[src] = audio;
  }
  return cache[src];
}

export function useSound(src: string) {
  const trigger = useCallback(() => {
    const audio = getAudio(src);
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, [src]);

  return trigger;
}
