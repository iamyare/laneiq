"use client";

import { formatKDA, getKDAColor } from "@/lib/metrics/base";

interface KDADisplayProps {
  kills: number;
  deaths: number;
  assists: number;
  className?: string;
  showRatio?: boolean;
}

export function KDADisplay({
  kills,
  deaths,
  assists,
  className = "",
  showRatio = true,
}: KDADisplayProps) {
  const ratio = deaths === 0
    ? (kills + assists > 0 ? Infinity : 0)
    : (kills + assists) / deaths;
  const colorClass = getKDAColor(ratio);

  return (
    <div className={`flex flex-col items-center gap-0.5 ${className}`}>
      <div className="flex items-center gap-1 text-sm font-semibold">
        <span className="text-emerald-400">{kills}</span>
        <span className="text-white/30">/</span>
        <span className="text-red-400">{deaths}</span>
        <span className="text-white/30">/</span>
        <span className="text-blue-400">{assists}</span>
      </div>
      {showRatio && (
        <span className={`text-xs font-medium ${colorClass}`}>
          {formatKDA(ratio)} KDA
        </span>
      )}
    </div>
  );
}
