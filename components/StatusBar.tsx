"use client";

import { useEffect, useState } from "react";

interface StatusBarProps {
  isLive: boolean;
  startedAt: number | null;
  isProcessing: boolean;
}

export default function StatusBar({ isLive, startedAt, isProcessing }: StatusBarProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!isLive) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isLive]);
  const seconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const duration = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold ${isLive ? "border-emerald-800/50 bg-emerald-950/40 text-emerald-300" : "border-white/10 bg-[#1c202b] text-slate-300"}`}>
        <span className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-slate-400"}`} />
        {isLive ? isProcessing ? "Memproses" : "Sesi aktif" : startedAt ? "Dijeda" : "Belum dimulai"}
      </span>
      <span className="rounded-lg border border-white/10 bg-[#1c202b] px-2.5 py-1.5 font-mono text-[11px] font-semibold tabular-nums text-slate-300">{duration}</span>
    </div>
  );
}
