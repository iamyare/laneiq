"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/champion-icon";
import { KDADisplay } from "@/components/kda-display";
import { ItemIcon } from "@/components/item-icon";
import { Badge } from "@/components/ui/badge";
import { QUEUE_TYPES, ROLE_LABELS } from "@/lib/constants/regions";
import type { Participant, MatchInfo } from "@/lib/types/riot";

interface MatchCardProps {
  matchId: string;
  participant: Participant;
  matchInfo: MatchInfo;
  platform: string;
  gameName: string;
  tagLine: string;
}

export function MatchCard({
  matchId,
  participant,
  matchInfo,
  platform,
  gameName,
  tagLine,
}: MatchCardProps) {
  const durationMin = Math.floor(matchInfo.gameDuration / 60);
  const durationSec = matchInfo.gameDuration % 60;
  const totalCS = participant.totalMinionsKilled + participant.neutralMinionsKilled;
  const csPerMin = matchInfo.gameDuration > 0 ? (totalCS / (matchInfo.gameDuration / 60)).toFixed(1) : "0";
  const queueName = QUEUE_TYPES[matchInfo.queueId] || "Custom";
  const roleLabel = ROLE_LABELS[participant.individualPosition || participant.teamPosition] || "";
  const timeAgo = getTimeAgo(matchInfo.gameCreation);

  const items = [
    participant.item0,
    participant.item1,
    participant.item2,
    participant.item3,
    participant.item4,
    participant.item5,
    participant.item6,
  ];

  return (
    <Link
      href={`/${platform}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/match/${matchId}`}
      className="block"
    >
      <div
        className={`group flex items-center gap-4 rounded-xl border px-4 py-3 transition-all hover:scale-[1.01] hover:shadow-lg cursor-pointer
          ${participant.win
            ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10"
            : "border-red-500/20 bg-red-500/5 hover:border-red-500/40 hover:bg-red-500/10"
          }`}
      >
        {/* Win/Loss indicator */}
        <div
          className={`w-1 h-12 rounded-full ${
            participant.win ? "bg-emerald-500" : "bg-red-500"
          }`}
        />

        {/* Champion */}
        <ChampionIcon championName={participant.championName} size={48} />

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm truncate">
              {participant.championName}
            </span>
            <Badge variant="secondary" className="text-[10px] bg-white/5 text-muted-foreground">
              {roleLabel}
            </Badge>
            <Badge variant="secondary" className="text-[10px] bg-white/5 text-muted-foreground hidden sm:inline-flex">
              {queueName}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{durationMin}:{durationSec.toString().padStart(2, "0")}</span>
            <span className="text-white/10">•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* KDA */}
        <KDADisplay
          kills={participant.kills}
          deaths={participant.deaths}
          assists={participant.assists}
        />

        {/* CS */}
        <div className="hidden sm:flex flex-col items-center text-xs">
          <span className="font-medium">{totalCS} CS</span>
          <span className="text-muted-foreground">{csPerMin}/min</span>
        </div>

        {/* Vision */}
        <div className="hidden md:flex flex-col items-center text-xs">
          <span className="font-medium">{participant.visionScore}</span>
          <span className="text-muted-foreground">Vision</span>
        </div>

        {/* Items */}
        <div className="hidden lg:flex items-center gap-0.5">
          {items.map((itemId, i) => (
            <ItemIcon key={i} itemId={itemId} size={24} />
          ))}
        </div>

        {/* Result */}
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            participant.win
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {participant.win ? "WIN" : "LOSS"}
        </span>
      </div>
    </Link>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
