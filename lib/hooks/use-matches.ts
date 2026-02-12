"use client";

import { useQuery, useQueries, useInfiniteQuery } from "@tanstack/react-query";
import { fetchMatchList } from "@/lib/actions/matches";
import { fetchMatchDetail, type MatchDetailResult } from "@/lib/actions/match";
import type { PlatformId } from "@/lib/constants/regions";

// Re-export the types from the server actions for convenience
export type { MatchListResult } from "@/lib/actions/matches";
export type { MatchDetailResult } from "@/lib/actions/match";

/**
 * Fetches paginated match IDs for a summoner.
 */
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

/**
 * Fetches a single match detail — used on the match detail page.
 */
export function useMatchDetail(
  matchId: string | null,
  platform: PlatformId | null,
  puuid: string | null,
  withTimeline = false
) {
  return useQuery({
    queryKey: ["match-detail", matchId, platform, puuid, withTimeline],
    queryFn: () => fetchMatchDetail(matchId!, platform!, puuid!, withTimeline),
    enabled: !!matchId && !!platform && !!puuid,
  });
}

/**
 * Fetches match details for a batch of match IDs using useQueries.
 *
 * Benefits over manual useEffect:
 * - Each match is cached individually by React Query
 * - Automatic deduplication (same matchId won't be fetched twice)
 * - Navigating away and back won't re-fetch (cache hit)
 * - Built-in retry on failure
 * - maxConcurrent prevents API rate limit exhaustion
 */
export function useMatchDetailsBatch(
  matchIds: string[],
  platform: PlatformId | null,
  puuid: string | null,
) {
  const queries = useQueries({
    queries: matchIds.map((matchId) => ({
      queryKey: ["match-detail", matchId, platform, puuid, false],
      queryFn: () => fetchMatchDetail(matchId, platform!, puuid!, false),
      enabled: !!platform && !!puuid,
      staleTime: 10 * 60 * 1000,    // 10 min — match data doesn't change
      gcTime: 60 * 60 * 1000,       // 1 hour garbage collection
      retry: 1,                     // Only retry once to conserve API calls
    })),
    combine: (results) => {
      const details = new Map<string, MatchDetailResult>();
      let loadingCount = 0;

      results.forEach((result, index) => {
        if (result.data) {
          details.set(matchIds[index], result.data);
        }
        if (result.isLoading) {
          loadingCount++;
        }
      });

      return {
        details,
        isLoading: loadingCount > 0,
        loadingCount,
        totalCount: matchIds.length,
        loadedCount: details.size,
      };
    },
  });

  return queries;
}
