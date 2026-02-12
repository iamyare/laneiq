import type { MatchDto, Participant, TimelineDto } from "@/lib/types/riot";
import type {
  FeaturePack,
  FeaturePackMeta,
  TimeWindow,
  KeyEvent,
  AggregateMetrics,
  BaseMetrics,
  TimelineMetrics,
  CoachingTag,
  RoamEvent,
} from "@/lib/types/metrics";
import { QUEUE_TYPES } from "@/lib/constants/regions";

const WINDOW_SIZE_SEC = 120; // 2-minute windows
const MAX_KEY_EVENTS = 50;

/**
 * Build a compact FeaturePack for Gemini analysis.
 */
export function buildFeaturePack(
  match: MatchDto,
  participant: Participant,
  baseMetrics: BaseMetrics,
  timelineMetrics: TimelineMetrics | null,
  coachingTags: CoachingTag[],
  roamEvents: RoamEvent[],
  tier?: string,
  rank?: string
): FeaturePack {
  const metadata: FeaturePackMeta = {
    matchId: match.metadata.matchId,
    gameDuration: match.info.gameDuration,
    gameVersion: match.info.gameVersion,
    role: participant.individualPosition || participant.teamPosition || "UNKNOWN",
    champion: participant.championName,
    teamId: participant.teamId,
    win: participant.win,
    queueType: QUEUE_TYPES[match.info.queueId] || String(match.info.queueId),
    tier,
    rank,
  };

  // Build time windows
  const windows: TimeWindow[] = [];
  const durationSec = match.info.gameDuration;
  for (let start = 0; start < durationSec; start += WINDOW_SIZE_SEC) {
    const endMin = Math.min(start + WINDOW_SIZE_SEC, durationSec) / 60;
    const startMin = start / 60;

    const window: TimeWindow = {
      startMin,
      endMin,
      kills: 0,
      deaths: 0,
      assists: 0,
      wardsPlaced: 0,
      objectiveEvents: [],
    };

    // Populate with timeline data if available
    if (timelineMetrics) {
      const goldPoint = timelineMetrics.goldDiffTimeline.find(
        (t) => t.timestamp >= startMin && t.timestamp < endMin
      );
      if (goldPoint) window.goldDiff = goldPoint.value;

      const xpPoint = timelineMetrics.xpDiffTimeline.find(
        (t) => t.timestamp >= startMin && t.timestamp < endMin
      );
      if (xpPoint) window.xpDiff = xpPoint.value;
    }

    windows.push(window);
  }

  // Build key events list
  const keyEvents: KeyEvent[] = [];

  // Add coaching tag evidences as events
  for (const tag of coachingTags) {
    for (const ev of tag.evidence) {
      if (ev.timestamp) {
        keyEvents.push({
          timestamp: ev.timestamp,
          type: tag.category === "vision" ? "vision" :
                tag.category === "positioning" ? "death" :
                tag.category === "objectives" ? "objective" :
                tag.category === "combat" ? "kill" : "teamfight",
          description: `[${tag.severity.toUpperCase()}] ${tag.label}: ${ev.context || tag.description}`,
          impact: tag.severity === "strength" ? "positive" :
                  tag.severity === "critical" ? "negative" : "neutral",
        });
      }
    }
  }

  // Add roam events
  for (const roam of roamEvents) {
    keyEvents.push({
      timestamp: roam.timestamp,
      type: "roam",
      description: roam.evidence,
      impact: roam.quality === "GOOD_ROAM" ? "positive" :
              roam.quality === "BAD_ROAM" ? "negative" : "neutral",
    });
  }

  // Add teamfight events
  if (timelineMetrics) {
    for (const tf of timelineMetrics.teamfightPresence) {
      keyEvents.push({
        timestamp: tf.timestamp,
        type: "teamfight",
        description: `Teamfight${tf.objective ? ` at ${tf.objective}` : ""}: ${tf.participated ? "Present" : "ABSENT"} (${tf.kills}K/${tf.deaths}D/${tf.assists}A)`,
        impact: tf.participated && tf.deaths === 0 ? "positive" :
                !tf.participated || tf.deaths > 0 ? "negative" : "neutral",
      });
    }
  }

  // Sort by timestamp and cap
  keyEvents.sort((a, b) => a.timestamp - b.timestamp);
  const cappedEvents = keyEvents.slice(0, MAX_KEY_EVENTS);

  // Aggregates
  const aggregates: AggregateMetrics = {
    base: baseMetrics,
    timeline: timelineMetrics || undefined,
  };

  return {
    metadata,
    windows,
    keyEvents: cappedEvents,
    aggregates,
    roamEvents: roamEvents.length > 0 ? roamEvents : undefined,
    coachingTags,
  };
}
