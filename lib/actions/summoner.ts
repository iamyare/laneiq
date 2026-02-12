"use server";

import { getAccountByRiotId, getSummonerByPuuid, getLeagueEntries, RiotApiError } from "@/lib/riot/client";
import type { PlatformId } from "@/lib/constants/regions";
import { PLATFORM_MAP } from "@/lib/constants/regions";
import type { SummonerProfile } from "@/lib/types/riot";

export async function fetchSummonerProfile(
  gameName: string,
  tagLine: string,
  platform: PlatformId
): Promise<SummonerProfile> {
  if (!gameName || !tagLine || !platform) {
    throw new Error("Missing required params: gameName, tagLine, platform");
  }

  if (!PLATFORM_MAP[platform]) {
    throw new Error(`Invalid platform: ${platform}`);
  }

  try {
    // Step 1: Resolve Riot ID → PUUID
    const account = await getAccountByRiotId(gameName, tagLine, platform);

    // Step 2: Get summoner data
    const summoner = await getSummonerByPuuid(account.puuid, platform);

    // Step 3: Get league entries (ranked info)
    const leagues = await getLeagueEntries(summoner.id, platform);

    return { account, summoner, leagues };
  } catch (error) {
    if (error instanceof RiotApiError) {
      if (error.status === 429) {
        throw new Error("Rate limited — please wait and try again");
      }
      if (error.status === 404) {
        throw new Error("Summoner not found. Check the Riot ID and platform.");
      }
      throw new Error(error.message);
    }
    console.error("[Action fetchSummonerProfile]", error);
    throw new Error("Internal server error");
  }
}
