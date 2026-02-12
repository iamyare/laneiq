import { NextRequest, NextResponse } from "next/server";
import { getMatch, getTimeline, RiotApiError } from "@/lib/riot/client";
import type { PlatformId } from "@/lib/constants/regions";
import { PLATFORM_MAP } from "@/lib/constants/regions";
import { computeBaseMetrics } from "@/lib/metrics/base";
import { computeTimelineMetrics } from "@/lib/metrics/timeline";
import { generateCoachingTags } from "@/lib/metrics/coaching";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const { searchParams } = request.nextUrl;
  const platform = searchParams.get("platform") as PlatformId | null;
  const puuid = searchParams.get("puuid");
  const withTimeline = searchParams.get("timeline") === "true";

  if (!platform || !puuid) {
    return NextResponse.json(
      { error: "Missing required params: platform, puuid" },
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
    // Fetch match detail
    const match = await getMatch(matchId, platform);

    // Find the player in participants
    const participant = match.info.participants.find((p) => p.puuid === puuid);
    if (!participant) {
      return NextResponse.json(
        { error: "Player not found in this match" },
        { status: 404 }
      );
    }

    // Compute base metrics
    const baseMetrics = computeBaseMetrics(participant, match);

    // Optionally fetch and compute timeline metrics
    let timelineMetrics = null;
    let timeline = null;
    if (withTimeline) {
      try {
        timeline = await getTimeline(matchId, platform);
        const participantId = participant.participantId;
        timelineMetrics = computeTimelineMetrics(
          timeline,
          participantId,
          match
        );
      } catch {
        // Timeline might not be available — gracefully degrade
        console.warn(`[API /match] Timeline not available for ${matchId}`);
      }
    }

    // Generate coaching tags
    const coachingTags = generateCoachingTags(
      participant,
      match,
      baseMetrics,
      timelineMetrics
    );

    return NextResponse.json({
      match,
      participant,
      metrics: {
        base: baseMetrics,
        timeline: timelineMetrics,
      },
      coachingTags,
      hasTimeline: !!timeline,
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
    console.error("[API /match]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
