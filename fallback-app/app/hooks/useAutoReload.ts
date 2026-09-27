"use client";

import { useEffect } from "react";

const INITIAL_INTERVAL_MS = 5000;
const MAX_INTERVAL_MS = 30000;
const PROBE_TIMEOUT_MS = 10000;
const FAILOVER_STATUS = 503;

export function useAutoReload() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | null = null;
    let interval = INITIAL_INTERVAL_MS;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      timer = setTimeout(probe, interval);
    };

    const probe = async () => {
      if (cancelled) return;
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }

      controller = new AbortController();
      const currentController = controller;
      const timeoutId = setTimeout(() => currentController.abort(), PROBE_TIMEOUT_MS);
      try {
        const response = await fetch(window.location.href, {
          cache: "no-store",
          signal: currentController.signal,
        });
        void response.body?.cancel();
        if (response.status !== FAILOVER_STATUS) {
          window.location.reload();
          return;
        }
      } catch {
        // probe fallito (worker irraggiungibile, abort, rete): riprova piu' avanti
      } finally {
        clearTimeout(timeoutId);
      }

      interval = Math.min(interval * 2, MAX_INTERVAL_MS);
      schedule();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      interval = INITIAL_INTERVAL_MS;
      void probe();
    };

    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
}
