"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLATFORMS, type PlatformId } from "@/lib/constants/regions";

interface PlatformSelectProps {
  value: PlatformId;
  onValueChange: (value: PlatformId) => void;
  className?: string;
}

export function PlatformSelect({ value, onValueChange, className }: PlatformSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as PlatformId)}>
      <SelectTrigger className={`w-[100px] bg-white/5 border-white/10 ${className || ""}`}>
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-white/10">
        {PLATFORMS.map((p) => (
          <SelectItem key={p.id} value={p.id} className="text-sm">
            <span className="font-medium">{p.label}</span>
            <span className="ml-2 text-xs text-muted-foreground">{p.region}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
