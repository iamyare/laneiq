import { NextRequest, NextResponse } from "next/server";
import { getMatchIds, RiotApiError } from "@/lib/riot/client";
import type { PlatformId } from "@/lib/constants/regions";
import { PLATFORM_MAP } from "@/lib/constants/regions";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const puuid = searchParams.get("puuid");
  const platform = searchParams.get("platform") as PlatformId | null;
  const start = parseInt(searchParams.get("start") || "0", 10);
  const count = parseInt(searchParams.get("count") || "20", 10);
  const queue = searchParams.get("queue");

  if (!puuid || !platform) {
    return NextResponse.json(
      { error: "Missing required params: puuid, platform" },
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
    const matchIds = await getMatchIds(puuid, platform, {
      start,
      count: Math.min(count, 100), // Riot max is 100
      queue: queue ? parseInt(queue, 10) : undefined,
    });

    return NextResponse.json({
      matchIds,
      start,
      count: matchIds.length,
      hasMore: matchIds.length === count,
    });
  } catch (error) {
    if (error instanceof RiotApiError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Rate limited", retryAfter: error.retryAfter },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[API /matches]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
