"use client";

import Image from "next/image";
import { getItemIconUrl } from "@/lib/constants/regions";

interface ItemIconProps {
  itemId: number;
  size?: number;
}

export function ItemIcon({ itemId, size = 28 }: ItemIconProps) {
  const url = getItemIconUrl(itemId);
  if (!url) {
    return (
      <div
        className="rounded bg-white/5 border border-white/5"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div className="relative overflow-hidden rounded border border-white/10"
         style={{ width: size, height: size }}>
      <Image src={url} alt={`Item ${itemId}`} width={size} height={size} unoptimized />
    </div>
  );
}
