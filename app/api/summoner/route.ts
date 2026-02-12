import { NextRequest, NextResponse } from "next/server";
import { getAccountByRiotId, getSummonerByPuuid, getLeagueEntries, RiotApiError } from "@/lib/riot/client";
import type { PlatformId } from "@/lib/constants/regions";
import { PLATFORM_MAP } from "@/lib/constants/regions";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const gameName = searchParams.get("gameName");
  const tagLine = searchParams.get("tagLine");
  const platform = searchParams.get("platform") as PlatformId | null;

  if (!gameName || !tagLine || !platform) {
    return NextResponse.json(
      { error: "Missing required params: gameName, tagLine, platform" },
      { status: 400 }
    );
  }

  if (!PLATFORM_MAP[platform]) {
    return NextResponse.json(
      { error: `Invalid platform: ${platform}` },
      { status: 400 }
    );
  }

  try {
    // Step 1: Resolve Riot ID → PUUID
    const account = await getAccountByRiotId(gameName, tagLine, platform);

    // Step 2: Get summoner data
    const summoner = await getSummonerByPuuid(account.puuid, platform);

    // Step 3: Get league entries (ranked info)
    const leagues = await getLeagueEntries(summoner.id, platform);

    return NextResponse.json({
      account,
      summoner,
      leagues,
    });
  } catch (error) {
    if (error instanceof RiotApiError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Rate limited — please wait and try again", retryAfter: error.retryAfter },
          { status: 429, headers: error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {} }
        );
      }
      if (error.status === 404) {
        return NextResponse.json(
          { error: "Summoner not found. Check the Riot ID and platform." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[API /summoner]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
