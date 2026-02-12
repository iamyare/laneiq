"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { fetchMatchList } from "@/lib/actions/matches";
import { fetchMatchDetail } from "@/lib/actions/match";
import type { PlatformId } from "@/lib/constants/regions";

// Re-export the types from the server actions for convenience
export type { MatchListResult } from "@/lib/actions/matches";
export type { MatchDetailResult } from "@/lib/actions/match";

export function useMatches(
  puuid: string | null,
  platform: PlatformId | null,
  count = 20,
  queue?: number
) {
  return useInfiniteQuery({
    queryKey: ["matches", puuid, platform, count, queue],
    queryFn: ({ pageParam = 0 }) =>
      fetchMatchList(puuid!, platform!, pageParam, count, queue),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.start + lastPage.count;
    },
    initialPageParam: 0,
    enabled: !!puuid && !!platform,
  });
}

export function useMatchDetail(
  matchId: string | null,
  platform: PlatformId | null,
  puuid: string | null,
  withTimeline = false
) {
  return useQuery({
    queryKey: ["match", matchId, platform, puuid, withTimeline],
    queryFn: () => fetchMatchDetail(matchId!, platform!, puuid!, withTimeline),
    enabled: !!matchId && !!platform && !!puuid,
  });
}
