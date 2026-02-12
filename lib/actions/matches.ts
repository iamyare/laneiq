"use server";

import { getMatchIds, RiotApiError } from "@/lib/riot/client";
import type { PlatformId } from "@/lib/constants/regions";
import { PLATFORM_MAP } from "@/lib/constants/regions";

export interface MatchListResult {
  matchIds: string[];
  start: number;
  count: number;
  hasMore: boolean;
}

export async function fetchMatchList(
  puuid: string,
  platform: PlatformId,
  start: number = 0,
  count: number = 20,
  queue?: number
): Promise<MatchListResult> {
  if (!puuid || !platform) {
    throw new Error("Missing required params: puuid, platform");
  }

  if (!PLATFORM_MAP[platform]) {
    throw new Error(`Invalid platform: ${platform}`);
  }

  try {
    const matchIds = await getMatchIds(puuid, platform, {
      start,
      count: Math.min(count, 100),
      queue,
    });

    return {
      matchIds,
      start,
      count: matchIds.length,
      hasMore: matchIds.length === count,
    };
  } catch (error) {
    if (error instanceof RiotApiError) {
      if (error.status === 429) {
        throw new Error("Rate limited — please wait and try again");
      }
      throw new Error(error.message);
    }
    console.error("[Action fetchMatchList]", error);
    throw new Error("Internal server error");
  }
}
