"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import type { PlatformId } from "@/lib/constants/regions";
import type { MatchDto, Participant } from "@/lib/types/riot";
import type { BaseMetrics, TimelineMetrics, CoachingTag } from "@/lib/types/metrics";

interface MatchListResponse {
  matchIds: string[];
  start: number;
  count: number;
  hasMore: boolean;
}

async function fetchMatchIds(
  puuid: string,
  platform: PlatformId,
  start: number,
  count: number,
  queue?: number
): Promise<MatchListResponse> {
  const params = new URLSearchParams({
    puuid,
    platform,
    start: String(start),
    count: String(count),
  });
  if (queue) params.set("queue", String(queue));
  const res = await fetch(`/api/matches?${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch matches (${res.status})`);
  }
  return res.json();
}

export function useMatches(
  puuid: string | null,
  platform: PlatformId | null,
  count = 20,
  queue?: number
) {
  return useInfiniteQuery({
    queryKey: ["matches", puuid, platform, count, queue],
    queryFn: ({ pageParam = 0 }) =>
      fetchMatchIds(puuid!, platform!, pageParam, count, queue),
    getNextPageParam: (lastPage, _allPages) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.start + lastPage.count;
    },
    initialPageParam: 0,
    enabled: !!puuid && !!platform,
  });
}

// ─── Match Detail ───

export interface MatchDetailResponse {
  match: MatchDto;
  participant: Participant;
  metrics: {
    base: BaseMetrics;
    timeline: TimelineMetrics | null;
  };
  coachingTags: CoachingTag[];
  hasTimeline: boolean;
}

async function fetchMatchDetail(
  matchId: string,
  platform: PlatformId,
  puuid: string,
  withTimeline = false
): Promise<MatchDetailResponse> {
  const params = new URLSearchParams({
    platform,
    puuid,
    timeline: String(withTimeline),
  });
  const res = await fetch(`/api/match/${matchId}?${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Failed to fetch match (${res.status})`);
  }
  return res.json();
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
