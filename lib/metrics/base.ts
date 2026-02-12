import type { Participant, MatchDto } from "@/lib/types/riot";
import type { BaseMetrics } from "@/lib/types/metrics";

/**
 * Compute base metrics from match participant data (no timeline needed).
 */
export function computeBaseMetrics(
  participant: Participant,
  match: MatchDto
): BaseMetrics {
  const durationMin = match.info.gameDuration / 60;
  const team = match.info.participants.filter(
    (p) => p.teamId === participant.teamId
  );
  const teamKills = team.reduce((sum, p) => sum + p.kills, 0);
  const teamDamage = team.reduce(
    (sum, p) => sum + p.totalDamageDealtToChampions,
    0
  );

  const totalCS =
    participant.totalMinionsKilled + participant.neutralMinionsKilled;

  const kda =
    participant.deaths === 0
      ? participant.kills + participant.assists > 0
        ? Infinity
        : 0
      : (participant.kills + participant.assists) / participant.deaths;

  const killParticipation =
    teamKills > 0
      ? (participant.kills + participant.assists) / teamKills
      : 0;

  const damageShare =
    teamDamage > 0
      ? participant.totalDamageDealtToChampions / teamDamage
      : 0;

  const goldEfficiency =
    participant.goldEarned > 0
      ? participant.goldSpent / participant.goldEarned
      : 0;

  // Death timing score: ratio of longest time alive to average time alive
  const totalTimeAlive = participant.timePlayed - participant.totalTimeSpentDead;
  const avgTimeAlive =
    participant.deaths > 0 ? totalTimeAlive / (participant.deaths + 1) : totalTimeAlive;
  const deathTimingScore =
    participant.longestTimeSpentLiving > 0
      ? avgTimeAlive / participant.longestTimeSpentLiving
      : 1;

  // Objective participation (rough estimate from participant stats)
  const teamObjectiveKills = team.reduce(
    (sum, p) => sum + p.turretKills + p.dragonKills + p.baronKills,
    0
  );
  const playerObjectiveKills =
    participant.turretKills + participant.dragonKills + participant.baronKills;
  const objectiveParticipation =
    teamObjectiveKills > 0 ? playerObjectiveKills / teamObjectiveKills : 0;

  return {
    kda,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    csPerMin: durationMin > 0 ? totalCS / durationMin : 0,
    goldPerMin:
      durationMin > 0 ? participant.goldEarned / durationMin : 0,
    damagePerMin:
      durationMin > 0
        ? participant.totalDamageDealtToChampions / durationMin
        : 0,
    damageShare,
    killParticipation,
    visionScore: participant.visionScore,
    wardsPlaced: participant.wardsPlaced,
    wardsKilled: participant.wardsKilled,
    controlWardsPlaced: participant.detectorWardsPlaced,
    goldEfficiency,
    deathTimingScore,
    objectiveParticipation,
  };
}

/**
 * Format KDA ratio for display.
 */
export function formatKDA(kda: number): string {
  if (kda === Infinity) return "Perfect";
  return kda.toFixed(2);
}

/**
 * Get KDA color class based on ratio.
 */
export function getKDAColor(kda: number): string {
  if (kda === Infinity || kda >= 5) return "text-amber-400";
  if (kda >= 3) return "text-emerald-400";
  if (kda >= 2) return "text-blue-400";
  if (kda >= 1) return "text-slate-400";
  return "text-red-400";
}
