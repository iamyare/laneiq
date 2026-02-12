"use client";

import Image from "next/image";
import { getChampionIconUrl } from "@/lib/constants/regions";

interface ChampionIconProps {
  championName: string;
  size?: number;
  className?: string;
}

export function ChampionIcon({ championName, size = 40, className = "" }: ChampionIconProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-white/10 ${className}`}
         style={{ width: size, height: size }}>
      <Image
        src={getChampionIconUrl(championName)}
        alt={championName}
        width={size}
        height={size}
        className="object-cover"
        unoptimized
      />
    </div>
  );
}
