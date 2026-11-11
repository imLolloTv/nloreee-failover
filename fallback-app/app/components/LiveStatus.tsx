"use client";

export default function LiveStatus() {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap select-none font-mono text-[11px]">
      <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warn opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-warn" />
      </span>
      <span className="text-fg font-medium tracking-wider uppercase">
        FAILOVER_ACTIVE
      </span>
    </div>
  );
}
