"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSummonerProfile } from "@/lib/actions/summoner";
import type { PlatformId } from "@/lib/constants/regions";

export function useSummoner(
  gameName: string | null,
  tagLine: string | null,
  platform: PlatformId | null
) {
  return useQuery({
    queryKey: ["summoner", gameName, tagLine, platform],
    queryFn: () => fetchSummonerProfile(gameName!, tagLine!, platform!),
    enabled: !!gameName && !!tagLine && !!platform,
  });
}
