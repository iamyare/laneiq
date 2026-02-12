import type { TimelineDto, MatchDto } from "@/lib/types/riot";
import type { RoamEvent, RoamQuality } from "@/lib/types/metrics";

// Lane center positions (approximate) for Summoner's Rift
const LANE_CENTERS: Record<string, { x: number; y: number }> = {
  MIDDLE: { x: 7500, y: 7500 },
  TOP: { x: 3000, y: 12000 },
  BOTTOM: { x: 12000, y: 3000 },
};

const LANE_DEPARTURE_THRESHOLD = 3500; // units from lane center
const MIN_ROAM_DURATION = 15000; // 15 seconds minimum
const MAX_ROAM_WINDOW = 120000; // 2 minutes max for one roam

/**
 * Detect and qualify roams for mid/support roles.
 * Returns list of roam events with quality + evidence.
 */
export function detectRoams(
  timeline: TimelineDto,
  participantId: number,
  match: MatchDto
): RoamEvent[] {
  const participant = match.info.participants.find(
    (p) => p.participantId === participantId
  );
  if (!participant) return [];

  const role = participant.individualPosition || participant.teamPosition;
  if (!["MIDDLE", "UTILITY"].includes(role)) return [];

  const laneCenter = role === "MIDDLE"
    ? LANE_CENTERS.MIDDLE
    : LANE_CENTERS.BOTTOM;

  const frames = timeline.info.frames;
  const roams: RoamEvent[] = [];

  let roamStart: number | null = null;
  let roamStartCS = 0;
  let wasInLane = true;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const pFrame = frame.participantFrames[String(participantId)];
    if (!pFrame?.position) continue;

    const distFromLane = Math.sqrt(
      (pFrame.position.x - laneCenter.x) ** 2 +
      (pFrame.position.y - laneCenter.y) ** 2
    );

    const isInLane = distFromLane < LANE_DEPARTURE_THRESHOLD;

    // Detect departure
    if (wasInLane && !isInLane && frame.timestamp > 180000) {
      roamStart = frame.timestamp;
      roamStartCS = pFrame.minionsKilled;
    }

    // Detect return
    if (!wasInLane && isInLane && roamStart !== null) {
      const roamDuration = frame.timestamp - roamStart;

      if (roamDuration >= MIN_ROAM_DURATION && roamDuration <= MAX_ROAM_WINDOW) {
        // Analyze roam outcome
        const roamEvents = frames
          .flatMap((f) => f.events)
          .filter(
            (e) => e.timestamp >= roamStart! && e.timestamp <= frame.timestamp
          );

        // Kills/assists during roam
        const kills = roamEvents.filter(
          (e) =>
            e.type === "CHAMPION_KILL" && e.killerId === participantId
        ).length;
        const assists = roamEvents.filter(
          (e) =>
            e.type === "CHAMPION_KILL" &&
            e.assistingParticipantIds?.includes(participantId)
        ).length;

        // Objectives taken during roam
        const objectives = roamEvents.filter(
          (e) =>
            (e.type === "ELITE_MONSTER_KILL" || e.type === "BUILDING_KILL") &&
            (e.killerId === participantId ||
              e.assistingParticipantIds?.includes(participantId))
        ).length;

        // CS lost during roam
        const csAtReturn = pFrame.minionsKilled;
        const csLost = Math.max(0, (roamDuration / 60000) * 6 - (csAtReturn - roamStartCS));

        // Check plates lost in own lane
        const platesLost = roamEvents.filter(
          (e) =>
            e.type === "TURRET_PLATE_DESTROYED" &&
            e.teamId !== participant.teamId
        ).length;

        // Determine enemy tower damage to own towers
        const towerDamage = roamEvents.filter(
          (e) =>
            e.type === "BUILDING_KILL" &&
            e.teamId !== participant.teamId
        ).length;

        // Quality assessment
        const reward = kills * 3 + assists * 2 + objectives * 4;
        const cost = csLost * 0.3 + platesLost * 2 + towerDamage * 3;

        let quality: RoamQuality;
        if (reward >= 3 && reward > cost) {
          quality = "GOOD_ROAM";
        } else if (reward >= cost * 0.8) {
          quality = "NEUTRAL_ROAM";
        } else {
          quality = "BAD_ROAM";
        }

        roams.push({
          timestamp: roamStart / 1000,
          quality,
          departureTime: roamStart / 1000,
          returnTime: frame.timestamp / 1000,
          outcome: {
            kills,
            assists,
            objectivesTaken: objectives,
          },
          cost: {
            csLost: Math.round(csLost),
            platesLost,
            xpLost: 0,
            towerDamageTaken: towerDamage,
          },
          evidence: `${quality}: ${kills}K/${assists}A, ${objectives} obj | Cost: ${Math.round(csLost)}CS, ${platesLost} plates`,
        });
      }

      roamStart = null;
    }

    wasInLane = isInLane;
  }

  return roams;
}
