"use client";

import { Badge } from "@/components/ui/badge";

const TIER_COLORS: Record<string, string> = {
  IRON: "bg-stone-600 text-stone-200",
  BRONZE: "bg-amber-800 text-amber-200",
  SILVER: "bg-slate-400 text-slate-900",
  GOLD: "bg-amber-500 text-amber-950",
  PLATINUM: "bg-teal-400 text-teal-950",
  EMERALD: "bg-emerald-500 text-emerald-950",
  DIAMOND: "bg-blue-400 text-blue-950",
  MASTER: "bg-purple-500 text-purple-100",
  GRANDMASTER: "bg-red-500 text-red-100",
  CHALLENGER: "bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950",
};

const TIER_ICONS: Record<string, string> = {
  IRON: "⚙️",
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD: "🥇",
  PLATINUM: "💎",
  EMERALD: "💚",
  DIAMOND: "💠",
  MASTER: "👑",
  GRANDMASTER: "🔥",
  CHALLENGER: "⚡",
};

interface RankBadgeProps {
  tier?: string;
  rank?: string;
  lp?: number;
  queueType?: string;
  wins?: number;
  losses?: number;
  compact?: boolean;
}

export function RankBadge({
  tier,
  rank,
  lp = 0,
  queueType,
  wins = 0,
  losses = 0,
  compact = false,
}: RankBadgeProps) {
  if (!tier) {
    return (
      <Badge variant="secondary" className="bg-white/5 text-muted-foreground">
        Unranked
      </Badge>
    );
  }

  const colorClass = TIER_COLORS[tier] || "bg-slate-600 text-slate-200";
  const icon = TIER_ICONS[tier] || "🎮";
  const totalGames = wins + losses;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(0) : "0";

  const queueLabel =
    queueType === "RANKED_SOLO_5x5" ? "Solo/Duo" :
    queueType === "RANKED_FLEX_SR" ? "Flex" :
    queueType || "";

  if (compact) {
    return (
      <Badge className={`${colorClass} font-semibold text-xs`}>
        {icon} {tier} {rank}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">
            {tier} {rank}
          </span>
          <span className="text-xs text-muted-foreground">{lp} LP</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{queueLabel}</span>
          <span>•</span>
          <span className="text-emerald-400">{wins}W</span>
          <span className="text-red-400">{losses}L</span>
          <span>({winRate}%)</span>
        </div>
      </div>
    </div>
  );
}
