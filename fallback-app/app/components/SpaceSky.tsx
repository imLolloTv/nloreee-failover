"use client";

import { useEffect, useRef } from "react";

const BG_STARS = (() => {
  const palette = ["#ffffff", "#ffffff", "#d8e2ff", "#2ff3ff", "#ff2fd6", "#ffd36b", "#9dff3b", "#a970ff"];
  const out: { x: number; y: number; size: number; color: string; speed: number; phase: number; cross: boolean }[] = [];
  let seed = 1337;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 190; i++) {
    const rSize = next();
    out.push({
      x: next(),
      y: next(),
      size: rSize > 0.9 ? 2 : 1,
      color: palette[Math.floor(next() * palette.length)],
      speed: 1.2 + next() * 2.8,
      phase: next() * Math.PI * 2,
      cross: rSize > 0.95,
    });
  }
  return out;
})();

const NEBULA_BLOBS = [
  { x: 0.18, y: 0.28, rx: 0.16, ry: 0.11, color: "#3b1763" },
  { x: 0.24, y: 0.34, rx: 0.11, ry: 0.08, color: "#641b78" },
  { x: 0.76, y: 0.22, rx: 0.18, ry: 0.12, color: "#122f5e" },
  { x: 0.72, y: 0.26, rx: 0.11, ry: 0.07, color: "#184e77" },
  { x: 0.58, y: 0.74, rx: 0.2, ry: 0.12, color: "#2b1954" },
  { x: 0.12, y: 0.78, rx: 0.14, ry: 0.09, color: "#15284d" },
];

export default function SpaceSky() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const PIX = 3;
    let raf = 0;

    const resize = () => {
      canvas.width = Math.max(1, Math.ceil(window.innerWidth / PIX));
      canvas.height = Math.max(1, Math.ceil(window.innerHeight / PIX));
    };
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) * 0.001;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "#04050d";
      ctx.fillRect(0, 0, w, h);

      for (const b of NEBULA_BLOBS) {
        const cx = Math.floor(b.x * w + Math.sin(t * 0.25 + b.x * 6) * 3);
        const cy = Math.floor(b.y * h + Math.cos(t * 0.2 + b.y * 6) * 2);
        const rx = Math.max(8, Math.floor(b.rx * w));
        const ry = Math.max(6, Math.floor(b.ry * h));
        ctx.fillStyle = b.color;
        for (let dy = -ry; dy <= ry; dy += 2) {
          for (let dx = -rx; dx <= rx; dx += 2) {
            const d2 = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
            if (d2 > 1) continue;
            const checker = ((dx + dy) & 2) === 0;
            if (d2 < 0.45 || (d2 < 0.85 && checker)) {
              ctx.fillRect(cx + dx, cy + dy, 2, 2);
            }
          }
        }
      }

      for (const s of BG_STARS) {
        const blink = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        if (blink < 0.18) continue;
        const sx = Math.floor(s.x * w);
        const sy = Math.floor(s.y * h);
        ctx.fillStyle = s.color;
        if (s.cross && blink > 0.65) {
          ctx.fillRect(sx, sy, 1, 1);
          ctx.fillRect(sx - 1, sy, 1, 1);
          ctx.fillRect(sx + 1, sy, 1, 1);
          ctx.fillRect(sx, sy - 1, 1, 1);
          ctx.fillRect(sx, sy + 1, 1, 1);
        } else {
          const sz = blink > 0.75 ? s.size : 1;
          ctx.fillRect(sx, sy, sz, sz);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
