"use server";

import { getMatch, getTimeline, RiotApiError } from "@/lib/riot/client";
import type { PlatformId } from "@/lib/constants/regions";
import { PLATFORM_MAP } from "@/lib/constants/regions";
import { computeBaseMetrics } from "@/lib/metrics/base";
import { computeTimelineMetrics } from "@/lib/metrics/timeline";
import { generateCoachingTags } from "@/lib/metrics/coaching";
import type { MatchDto, Participant } from "@/lib/types/riot";
import type { BaseMetrics, TimelineMetrics, CoachingTag } from "@/lib/types/metrics";

export interface MatchDetailResult {
  match: MatchDto;
  participant: Participant;
  metrics: {
    base: BaseMetrics;
    timeline: TimelineMetrics | null;
  };
  coachingTags: CoachingTag[];
  hasTimeline: boolean;
}

export async function fetchMatchDetail(
  matchId: string,
  platform: PlatformId,
  puuid: string,
  withTimeline: boolean = false
): Promise<MatchDetailResult> {
  if (!platform || !puuid || !matchId) {
    throw new Error("Missing required params: matchId, platform, puuid");
  }

  if (!PLATFORM_MAP[platform]) {
    throw new Error(`Invalid platform: ${platform}`);
  }

  try {
    // Fetch match detail
    const match = await getMatch(matchId, platform);

    // Find the player in participants
    const participant = match.info.participants.find((p) => p.puuid === puuid);
    if (!participant) {
      throw new Error("Player not found in this match");
    }

    // Compute base metrics
    const baseMetrics = computeBaseMetrics(participant, match);

    // Optionally fetch and compute timeline metrics
    let timelineMetrics: TimelineMetrics | null = null;
    let hasTimeline = false;
    if (withTimeline) {
      try {
        const timeline = await getTimeline(matchId, platform);
        const participantId = participant.participantId;
        timelineMetrics = computeTimelineMetrics(timeline, participantId, match);
        hasTimeline = true;
      } catch {
        console.warn(`[Action fetchMatchDetail] Timeline not available for ${matchId}`);
      }
    }

    // Generate coaching tags
    const coachingTags = generateCoachingTags(
      participant,
      match,
      baseMetrics,
      timelineMetrics
    );

    return {
      match,
      participant,
      metrics: {
        base: baseMetrics,
        timeline: timelineMetrics,
      },
      coachingTags,
      hasTimeline,
    };
  } catch (error) {
    if (error instanceof RiotApiError) {
      if (error.status === 429) {
        throw new Error("Rate limited — please wait and try again");
      }
      throw new Error(error.message);
    }
    // Re-throw non-Riot errors that were already custom errors
    if (error instanceof Error && error.message === "Player not found in this match") {
      throw error;
    }
    console.error("[Action fetchMatchDetail]", error);
    throw new Error("Internal server error");
  }
}
