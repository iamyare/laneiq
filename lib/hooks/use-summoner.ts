"use client";

import { useQuery } from "@tanstack/react-query";
import type { SummonerProfile } from "@/lib/types/riot";
import type { PlatformId } from "@/lib/constants/regions";

async function fetchSummoner(
  gameName: string,
  tagLine: string,
  platform: PlatformId
): Promise<SummonerProfile> {
  const params = new URLSearchParams({ gameName, tagLine, platform });
  const res = await fetch(`/api/summoner?${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch summoner (${res.status})`);
  }
  return res.json();
}

export function useSummoner(
  gameName: string | null,
  tagLine: string | null,
  platform: PlatformId | null
) {
  return useQuery({
    queryKey: ["summoner", gameName, tagLine, platform],
    queryFn: () => fetchSummoner(gameName!, tagLine!, platform!),
    enabled: !!gameName && !!tagLine && !!platform,
  });
}
