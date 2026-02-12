"use client";

import {
  PunishableDeath,
  BadBack,
  DangerZoneEntry
} from "@/lib/types/metrics";
import {
  Skull,
  AlertTriangle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimelineEventsProps {
  duration: number; // in seconds
  deaths: PunishableDeath[];
  badBacks: BadBack[];
  dangerZones: DangerZoneEntry[];
}

// Convert seconds to percentage for absolute positioning
const getLeftPos = (timeInSeconds: number, totalDuration: number) => {
  return Math.min(100, Math.max(0, (timeInSeconds / totalDuration) * 100));
};



import { useState } from "react";

// ... existing imports

export function TimelineEventsChart({
  duration,
  deaths,
  badBacks,
  dangerZones
}: TimelineEventsProps) {
  const [filters, setFilters] = useState({
    deaths: true,
    badBacks: true,
    dangerZones: true
  });

  return (
    <div className="w-full mt-8 mb-4 space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.deaths}
              onChange={(e) => setFilters(prev => ({ ...prev, deaths: e.target.checked }))}
              className="rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/20"
            />
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Skull className="w-3 h-3 text-red-400" /> Punishable Deaths
            </span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.badBacks}
              onChange={(e) => setFilters(prev => ({ ...prev, badBacks: e.target.checked }))}
              className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/20"
            />
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle className="w-3 h-3 text-amber-400" /> Bad Recalls
            </span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters.dangerZones}
              onChange={(e) => setFilters(prev => ({ ...prev, dangerZones: e.target.checked }))}
              className="rounded border-white/20 bg-white/5 text-white focus:ring-white/20"
            />
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <div className="w-2 h-2 rounded-full ring-1 ring-white/50 bg-red-500" /> Danger Zones
            </span>
          </label>
        </div>
        <div className="text-[10px] text-muted-foreground italic">
          * Click events for frame details
        </div>
      </div>

      <div className="relative w-full h-32 select-none group/timeline">
        {/* Time Axis Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-linear-to-r from-white/5 via-white/20 to-white/5 -translate-y-1/2 rounded-full" />

        {/* Time Markers */}
        <div className="absolute top-[60%] left-0 text-[10px] text-muted-foreground font-mono">0:00</div>
        <div className="absolute top-[60%] left-1/4 text-[10px] text-muted-foreground/50 font-mono -translate-x-1/2 hidden sm:block">
          {Math.floor(duration / 240)}:{(Math.floor(duration / 4) % 60).toString().padStart(2, '0')}
        </div>
        <div className="absolute top-[60%] left-1/2 text-[10px] text-muted-foreground font-mono -translate-x-1/2">
          {Math.floor(duration / 120)}:{(Math.floor(duration / 2) % 60).toString().padStart(2, '0')}
        </div>
        <div className="absolute top-[60%] left-3/4 text-[10px] text-muted-foreground/50 font-mono -translate-x-1/2 hidden sm:block">
          {Math.floor(duration * 0.75 / 60)}:{(Math.floor(duration * 0.75) % 60).toString().padStart(2, '0')}
        </div>
        <div className="absolute top-[60%] right-0 text-[10px] text-muted-foreground font-mono translate-x-0">
          {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        </div>

        <TooltipProvider delayDuration={0}>
          {/* Deaths */}
          {filters.deaths && deaths.map((death, i) => (
            <Tooltip key={`death-${i}`}>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-[15%] transform -translate-x-1/2 cursor-pointer z-20 hover:scale-110 transition-transform duration-200"
                  style={{ left: `${getLeftPos(death.timestamp, duration)}%` }}
                >
                  <div className="bg-red-500/10 p-1.5 rounded-full border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:bg-red-500/20 hover:border-red-400">
                    <Skull className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="h-8 w-px bg-linear-to-b from-red-500/50 to-transparent absolute left-1/2 top-full -translate-x-1/2" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-zinc-950 border-white/10 p-3">
                <div className="space-y-1.5 max-w-62.5">
                  <div className="flex items-center gap-2">
                    <Skull className="w-3.5 h-3.5 text-red-400" />
                    <p className="font-semibold text-xs text-red-100">Punishable Death</p>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground ml-auto">
                      {death.timestamp.toFixed(1)}m
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p><span className="text-muted-foreground">Zone:</span> {death.zone}</p>
                    <p><span className="text-muted-foreground">Allies:</span> {death.alliesNearby}</p>
                    <p><span className="text-muted-foreground">Vision:</span> {death.hadVision ? "Yes" : "No"}</p>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug border-t border-white/5 pt-1.5 mt-1.5">
                    &quot;{death.description}&quot;
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Bad Backs */}
          {filters.badBacks && badBacks.map((back, i) => (
            <Tooltip key={`back-${i}`}>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-[65%] transform -translate-x-1/2 cursor-pointer z-20 hover:scale-110 transition-transform duration-200"
                  style={{ left: `${getLeftPos(back.timestamp, duration)}%` }}
                >
                  <div className="h-8 w-px bg-linear-to-t from-amber-500/50 to-transparent absolute left-1/2 bottom-full -translate-x-1/2" />
                  <div className="bg-amber-500/10 p-1.5 rounded-full border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:bg-amber-500/20 hover:border-amber-400">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-950 border-white/10 p-3">
                <div className="space-y-1.5 max-w-50">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <p className="font-semibold text-xs text-amber-100">Bad Recall</p>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground ml-auto">
                      {back.timestamp.toFixed(1)}m
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CS Lost:</span>
                      <span className="font-mono text-red-300">-{back.csLost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plates Lost:</span>
                      <span className="font-mono text-red-300">-{back.platesLost}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug border-t border-white/5 pt-1.5 mt-1.5">
                    &quot;{back.description}&quot;
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Danger Zones */}
          {filters.dangerZones && dangerZones.map((zone, i) => (
            <Tooltip key={`zone-${i}`}>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 hover:z-30 group/point"
                  style={{ left: `${getLeftPos(zone.timestamp, duration)}%` }}
                >
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${zone.survived ? 'bg-zinc-600 group-hover/point:bg-zinc-400' : 'bg-red-500 group-hover/point:bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'} ring-2 ring-background`} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-950 border-white/10">
                <div className="text-xs space-y-1">
                  <p className="font-bold flex items-center gap-2">
                    {zone.survived ? <span className="text-zinc-400">Zone Entry</span> : <span className="text-red-400">Dangerous Entry</span>}
                    <span className="text-[10px] font-normal text-muted-foreground ml-auto">{zone.timestamp.toFixed(1)}m</span>
                  </p>
                  <p className="text-zinc-300">{zone.zone.replace('_', ' ')}</p>
                  <p className="text-muted-foreground text-[10px]">{zone.survived ? "Survived" : "Resulted in Death"}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
}
