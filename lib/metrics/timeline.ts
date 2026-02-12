import type { TimelineDto, MatchDto } from "@/lib/types/riot";
import type {
  TimelineMetrics,
  PunishableDeath,
  DangerZoneEntry,
  BadBack,
  TimePoint,
  TeamfightEvent,
} from "@/lib/types/metrics";

// Map coordinates — approximate zones based on Summoner's Rift geometry
// The map is roughly 15000x15000 units
const MAP_CENTER = 7500;
const RIVER_Y_MIN = 5000;
const RIVER_Y_MAX = 10000;
const RIVER_X_MIN = 5000;
const RIVER_X_MAX = 10000;

function isInRiver(x: number, y: number): boolean {
  // River runs diagonally — approximate with a band
  const diagDist = Math.abs(x - (15000 - y));
  return diagDist < 3000;
}

function isInEnemyJungle(
  x: number,
  y: number,
  teamId: number
): boolean {
  // Blue team (100) spawns bottom-left, Red team (200) spawns top-right
  if (teamId === 100) {
    // Enemy jungle is top-right quadrant jungle
    return x > MAP_CENTER && y > MAP_CENTER && !isInRiver(x, y);
  } else {
    // Enemy jungle is bottom-left quadrant jungle
    return x < MAP_CENTER && y < MAP_CENTER && !isInRiver(x, y);
  }
}

function getZoneLabel(
  x: number,
  y: number,
  teamId: number
): "enemy_jungle" | "river" | "enemy_territory" | null {
  if (isInRiver(x, y)) return "river";
  if (isInEnemyJungle(x, y, teamId)) return "enemy_jungle";
  // Enemy territory (beyond river on enemy side)
  if (teamId === 100 && x + y > 20000) return "enemy_territory";
  if (teamId === 200 && x + y < 10000) return "enemy_territory";
  return null;
}

/**
 * Compute timeline-derived metrics.
 */
export function computeTimelineMetrics(
  timeline: TimelineDto,
  participantId: number,
  match: MatchDto
): TimelineMetrics {
  const participant = match.info.participants.find(
    (p) => p.participantId === participantId
  );
  const teamId = participant?.teamId ?? 100;
  const durationMin = match.info.gameDuration / 60;
  const frames = timeline.info.frames;

  // Track wards per minute
  let totalWardsPlaced = 0;
  const wardEvents = frames.flatMap((f) =>
    f.events.filter(
      (e) =>
        e.type === "WARD_PLACED" &&
        e.creatorId === participantId
    )
  );
  totalWardsPlaced = wardEvents.length;
  const wardsPerMin = durationMin > 0 ? totalWardsPlaced / durationMin : 0;

  // Control ward coverage
  const controlWardEvents = wardEvents.filter(
    (e) => e.wardType === "CONTROL_WARD"
  );
  const controlWardCoverage =
    durationMin > 0 ? controlWardEvents.length / durationMin : 0;

  // Analyze deaths for punishable deaths
  const deathEvents = frames.flatMap((f) =>
    f.events.filter(
      (e) => e.type === "CHAMPION_KILL" && e.victimId === participantId
    )
  );

  const punishableDeaths: PunishableDeath[] = [];
  const dangerZoneEntries: DangerZoneEntry[] = [];

  for (const death of deathEvents) {
    if (!death.position) continue;
    const { x, y } = death.position;
    const zone = getZoneLabel(x, y, teamId);

    if (zone) {
      // Check for allied wards nearby (within ~2000 units in recent frames)
      const timestamp = death.timestamp;
      const frameIdx = Math.floor(timestamp / (timeline.info.frameInterval || 60000));
      const nearbyFrame = frames[Math.min(frameIdx, frames.length - 1)];

      // Check allies nearby
      const alliesNearby = nearbyFrame
        ? Object.values(nearbyFrame.participantFrames).filter((pf) => {
            if (pf.participantId === participantId) return false;
            // Same team check
            const isTeammate = match.info.participants.find(
              (p) =>
                p.participantId === pf.participantId &&
                p.teamId === teamId
            );
            if (!isTeammate || !pf.position) return false;
            const dist = Math.sqrt(
              (pf.position.x - x) ** 2 + (pf.position.y - y) ** 2
            );
            return dist < 2500;
          }).length
        : 0;

      // Check recent ward placements in the area
      const recentWards = wardEvents.filter((w) => {
        if (!w.position) return false;
        const timeDiff = timestamp - w.timestamp;
        if (timeDiff < 0 || timeDiff > 90000) return false; // within 90s
        const dist = Math.sqrt(
          (w.position.x - x) ** 2 + (w.position.y - y) ** 2
        );
        return dist < 3000;
      });

      const hadVision = recentWards.length > 0;

      if (!hadVision && alliesNearby <= 1) {
        punishableDeaths.push({
          timestamp: timestamp / 1000,
          zone,
          hadVision,
          alliesNearby,
          description: `Died in ${zone.replace("_", " ")} without vision and only ${alliesNearby} allies nearby`,
        });
      }

      dangerZoneEntries.push({
        timestamp: timestamp / 1000,
        zone,
        hadVision,
        alliesNearby,
        survived: false,
      });
    }
  }

  // Bad backs: detect back events followed by significant CS/plate losses
  const badBacks: BadBack[] = [];
  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1].participantFrames[String(participantId)];
    const curr = frames[i].participantFrames[String(participantId)];
    if (!prev || !curr) continue;

    // Detect potential back: gold increases but position jumps to base
    const csDropRate =
      curr.minionsKilled - prev.minionsKilled;
    
    // If the player gained very few CS in a window where they could have farmed
    if (
      csDropRate <= 1 &&
      i > 3 &&
      i < frames.length - 2 &&
      frames[i].timestamp > 180000 // after 3 min
    ) {
      // Check if enemy took plates (turret damage events)
      const windowEvents = frames[i].events;
      const enemyPlates = windowEvents.filter(
        (e) =>
          e.type === "TURRET_PLATE_DESTROYED" &&
          e.teamId !== teamId
      );

      if (enemyPlates.length > 0) {
        badBacks.push({
          timestamp: frames[i].timestamp / 1000,
          csLost: Math.max(0, 6 - csDropRate), // rough estimate
          platesLost: enemyPlates.length,
          xpLost: 0, // hard to estimate precisely
          description: `Lost ${enemyPlates.length} plate(s) during back timing`,
        });
      }
    }
  }

  // Gold/XP diff timeline
  const goldDiffTimeline: TimePoint[] = [];
  const xpDiffTimeline: TimePoint[] = [];

  // Find lane opponent (same position, different team)
  const playerRole = participant?.individualPosition || participant?.teamPosition;
  const opponent = match.info.participants.find(
    (p) =>
      p.teamId !== teamId &&
      (p.individualPosition === playerRole || p.teamPosition === playerRole)
  );
  const opponentPid = opponent
    ? timeline.info.participants.find((p) => p.puuid === opponent.puuid)
        ?.participantId
    : null;

  if (opponentPid) {
    for (const frame of frames) {
      const playerFrame = frame.participantFrames[String(participantId)];
      const oppFrame = frame.participantFrames[String(opponentPid)];
      if (playerFrame && oppFrame) {
        goldDiffTimeline.push({
          timestamp: frame.timestamp / 60000, // minutes
          value: playerFrame.totalGold - oppFrame.totalGold,
        });
        xpDiffTimeline.push({
          timestamp: frame.timestamp / 60000,
          value: playerFrame.xp - oppFrame.xp,
        });
      }
    }
  }

  // Teamfight detection: clusters of kills within short time windows
  const teamfightPresence: TeamfightEvent[] = [];
  const killEvents = frames.flatMap((f) =>
    f.events.filter((e) => e.type === "CHAMPION_KILL")
  );

  // Group kills into fights (within 15s windows)
  const fights: typeof killEvents[] = [];
  let currentFight: typeof killEvents = [];
  for (const kill of killEvents) {
    if (
      currentFight.length === 0 ||
      kill.timestamp - currentFight[currentFight.length - 1].timestamp < 15000
    ) {
      currentFight.push(kill);
    } else {
      if (currentFight.length >= 3) {
        fights.push([...currentFight]);
      }
      currentFight = [kill];
    }
  }
  if (currentFight.length >= 3) fights.push(currentFight);

  for (const fight of fights) {
    const fightStart = fight[0].timestamp;
    const fightEnd = fight[fight.length - 1].timestamp;
    const participated = fight.some(
      (e) =>
        e.killerId === participantId ||
        e.victimId === participantId ||
        e.assistingParticipantIds?.includes(participantId)
    );

    const kills = fight.filter(
      (e) => e.killerId === participantId
    ).length;
    const deaths = fight.filter(
      (e) => e.victimId === participantId
    ).length;
    const assists = fight.filter(
      (e) => e.assistingParticipantIds?.includes(participantId)
    ).length;

    // Check if near objective
    const nearbyObjective = fight.find(
      (e) =>
        e.type === "ELITE_MONSTER_KILL" ||
        frames
          .flatMap((f) => f.events)
          .some(
            (oe) =>
              oe.type === "ELITE_MONSTER_KILL" &&
              Math.abs(oe.timestamp - fightStart) < 30000
          )
    );

    teamfightPresence.push({
      timestamp: fightStart / 1000,
      duration: (fightEnd - fightStart) / 1000,
      objective: nearbyObjective?.monsterType,
      participated,
      kills,
      deaths,
      assists,
      damageDealt: 0, // can't get per-fight damage from timeline
    });
  }

  return {
    wardsPerMin,
    controlWardCoverage,
    dangerZoneEntries,
    punishableDeaths,
    badBacks,
    goldDiffTimeline,
    xpDiffTimeline,
    teamfightPresence,
  };
}
