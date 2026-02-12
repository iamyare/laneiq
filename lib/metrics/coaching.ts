import type { Participant, MatchDto } from "@/lib/types/riot";
import type { BaseMetrics, TimelineMetrics, CoachingTag, CoachingTagSeverity } from "@/lib/types/metrics";

/**
 * Generate role-specific coaching tags from match data + metrics.
 */
export function generateCoachingTags(
  participant: Participant,
  match: MatchDto,
  baseMetrics: BaseMetrics,
  timelineMetrics: TimelineMetrics | null
): CoachingTag[] {
  const tags: CoachingTag[] = [];
  const role = participant.individualPosition || participant.teamPosition || "";
  const matchId = match.metadata.matchId;
  const durationMin = match.info.gameDuration / 60;

  // ─── Universal tags ───

  // Vision Score
  const visionPerMin = participant.visionScore / durationMin;
  if (visionPerMin < 0.5) {
    tags.push(createTag(
      "vision-low",
      "vision",
      "Very low vision score",
      "critical",
      role,
      `Vision score ${participant.visionScore} (${visionPerMin.toFixed(1)}/min) is well below average. Aim for at least 1.0/min.`,
      [{ matchId }]
    ));
  } else if (visionPerMin >= 1.5) {
    tags.push(createTag(
      "vision-high",
      "vision",
      "Excellent vision control",
      "strength",
      role,
      `Vision score ${participant.visionScore} (${visionPerMin.toFixed(1)}/min) is excellent.`,
      [{ matchId }]
    ));
  }

  // Control wards
  if (participant.detectorWardsPlaced === 0 && durationMin > 10) {
    tags.push(createTag(
      "no-control-wards",
      "vision",
      "No control wards placed",
      "critical",
      role,
      "Zero control wards placed. Buy and place at least 1 control ward per 5 minutes.",
      [{ matchId }]
    ));
  }

  // Death analysis
  if (participant.deaths > 7) {
    tags.push(createTag(
      "high-deaths",
      "positioning",
      "Too many deaths",
      "critical",
      role,
      `${participant.deaths} deaths is too many. Focus on dying less — each death costs gold and map pressure.`,
      [{ matchId }]
    ));
  }

  // KDA
  if (baseMetrics.kda >= 5) {
    tags.push(createTag(
      "high-kda",
      "combat",
      "Excellent KDA",
      "strength",
      role,
      `KDA of ${baseMetrics.kda === Infinity ? "Perfect" : baseMetrics.kda.toFixed(1)} shows strong combat performance.`,
      [{ matchId }]
    ));
  }

  // Kill participation
  if (baseMetrics.killParticipation < 0.3 && role !== "TOP") {
    tags.push(createTag(
      "low-kp",
      "teamplay",
      "Low kill participation",
      "warning",
      role,
      `Kill participation of ${(baseMetrics.killParticipation * 100).toFixed(0)}% is low. Join more team fights or coordinate with team.`,
      [{ matchId }]
    ));
  }

  // CS per min (lane roles)
  if (["TOP", "MIDDLE", "BOTTOM"].includes(role)) {
    if (baseMetrics.csPerMin < 5) {
      tags.push(createTag(
        "low-cs",
        "farming",
        "Low CS/min",
        "warning",
        role,
        `${baseMetrics.csPerMin.toFixed(1)} CS/min is below par. Practice last hitting — aim for 7+ CS/min.`,
        [{ matchId }]
      ));
    } else if (baseMetrics.csPerMin >= 8) {
      tags.push(createTag(
        "high-cs",
        "farming",
        "Strong CS/min",
        "strength",
        role,
        `${baseMetrics.csPerMin.toFixed(1)} CS/min shows solid farming.`,
        [{ matchId }]
      ));
    }
  }

  // ─── Role-specific tags ───

  if (role === "TOP") {
    generateTopTags(tags, participant, match, baseMetrics, timelineMetrics, matchId);
  } else if (role === "JUNGLE") {
    generateJungleTags(tags, participant, match, baseMetrics, timelineMetrics, matchId);
  } else if (role === "MIDDLE") {
    generateMidTags(tags, participant, match, baseMetrics, timelineMetrics, matchId);
  } else if (role === "BOTTOM") {
    generateADCTags(tags, participant, match, baseMetrics, timelineMetrics, matchId);
  } else if (role === "UTILITY") {
    generateSupportTags(tags, participant, match, baseMetrics, timelineMetrics, matchId);
  }

  // ─── Timeline-based tags ───
  if (timelineMetrics) {
    if (timelineMetrics.punishableDeaths.length > 0) {
      tags.push(createTag(
        "punishable-deaths",
        "positioning",
        `${timelineMetrics.punishableDeaths.length} punishable death(s)`,
        timelineMetrics.punishableDeaths.length >= 3 ? "critical" : "warning",
        role,
        `Died ${timelineMetrics.punishableDeaths.length} time(s) in dangerous zones without vision or allies.`,
        timelineMetrics.punishableDeaths.map((d) => ({
          matchId,
          timestamp: d.timestamp,
          context: d.description,
        }))
      ));
    }

    if (timelineMetrics.badBacks.length > 0) {
      tags.push(createTag(
        "bad-backs",
        "tempo",
        `${timelineMetrics.badBacks.length} poorly-timed back(s)`,
        "warning",
        role,
        `Lost plates/CS during ${timelineMetrics.badBacks.length} back(s). Time recalls after pushing the wave.`,
        timelineMetrics.badBacks.map((b) => ({
          matchId,
          timestamp: b.timestamp,
          context: b.description,
        }))
      ));
    }

    // Teamfight absence
    const missedFights = timelineMetrics.teamfightPresence.filter(
      (tf) => !tf.participated && tf.objective
    );
    if (missedFights.length > 0) {
      tags.push(createTag(
        "missed-objective-fights",
        "objectives",
        `Missed ${missedFights.length} objective fight(s)`,
        "warning",
        role,
        `Wasn't present for ${missedFights.length} fight(s) around major objectives.`,
        missedFights.map((tf) => ({
          matchId,
          timestamp: tf.timestamp,
          context: `${tf.objective} fight`,
        }))
      ));
    }
  }

  return tags;
}

// ─── Role-specific tag generators ───

function generateTopTags(
  tags: CoachingTag[],
  participant: Participant,
  _match: MatchDto,
  baseMetrics: BaseMetrics,
  timelineMetrics: TimelineMetrics | null,
  matchId: string
) {
  // Overextend without vision
  if (timelineMetrics && timelineMetrics.dangerZoneEntries.length > 3) {
    const unsafeEntries = timelineMetrics.dangerZoneEntries.filter((e) => !e.hadVision);
    if (unsafeEntries.length > 2) {
      tags.push(createTag(
        "top-overextend",
        "positioning",
        "Overextending without vision",
        "warning",
        "TOP",
        `Entered dangerous zones ${unsafeEntries.length} times without ward coverage. Ward river/tribush before extending.`,
        [{ matchId }]
      ));
    }
  }

  // Damage share check for top
  if (baseMetrics.damageShare < 0.15) {
    tags.push(createTag(
      "top-low-damage",
      "combat",
      "Low damage contribution",
      "info",
      "TOP",
      `Only ${(baseMetrics.damageShare * 100).toFixed(0)}% of team damage. Consider more aggressive plays or itemization.`,
      [{ matchId }]
    ));
  }

  // Turret pressure
  if (participant.turretKills >= 3) {
    tags.push(createTag(
      "top-tower-pressure",
      "objectives",
      "Strong turret pressure",
      "strength",
      "TOP",
      `Took ${participant.turretKills} turrets — excellent split push pressure.`,
      [{ matchId }]
    ));
  }
}

function generateJungleTags(
  tags: CoachingTag[],
  participant: Participant,
  match: MatchDto,
  baseMetrics: BaseMetrics,
  _timelineMetrics: TimelineMetrics | null,
  matchId: string
) {
  // Objective contest
  const team = match.info.teams.find((t) => t.teamId === participant.teamId);
  if (team) {
    const dragonKills = team.objectives.dragon.kills;
    const baronKills = team.objectives.baron.kills;
    if (dragonKills === 0 && match.info.gameDuration > 1200) {
      tags.push(createTag(
        "jg-no-dragons",
        "objectives",
        "No dragons secured",
        "critical",
        "JUNGLE",
        "Team didn't secure any dragons. Prioritize dragon control with vision setup 1 min before spawn.",
        [{ matchId }]
      ));
    }
    if (dragonKills >= 4) {
      tags.push(createTag(
        "jg-dragon-control",
        "objectives",
        "Excellent dragon control",
        "strength",
        "JUNGLE",
        `Secured ${dragonKills} dragons — strong objective control.`,
        [{ matchId }]
      ));
    }
    if (baronKills >= 1) {
      tags.push(createTag(
        "jg-baron-secured",
        "objectives",
        "Baron secured",
        "strength",
        "JUNGLE",
        `Secured ${baronKills} Baron(s).`,
        [{ matchId }]
      ));
    }
  }

  // Farm vs gank balance
  if (baseMetrics.csPerMin < 4.5) {
    tags.push(createTag(
      "jg-low-farm",
      "farming",
      "Low jungle farm",
      "info",
      "JUNGLE",
      `${baseMetrics.csPerMin.toFixed(1)} CS/min — consider clearing more efficiently between ganks.`,
      [{ matchId }]
    ));
  }

  // Kill participation for junglers should be high
  if (baseMetrics.killParticipation < 0.4) {
    tags.push(createTag(
      "jg-low-impact",
      "teamplay",
      "Low map impact",
      "warning",
      "JUNGLE",
      `KP of ${(baseMetrics.killParticipation * 100).toFixed(0)}% — aim for 50%+ by ganking more or joining fights.`,
      [{ matchId }]
    ));
  }

  // Objectives stolen
  if (participant.objectivesStolen > 0) {
    tags.push(createTag(
      "jg-steals",
      "objectives",
      "Objective steal!",
      "strength",
      "JUNGLE",
      `Stole ${participant.objectivesStolen} objective(s) — clutch plays.`,
      [{ matchId }]
    ));
  }
}

function generateMidTags(
  tags: CoachingTag[],
  participant: Participant,
  _match: MatchDto,
  baseMetrics: BaseMetrics,
  timelineMetrics: TimelineMetrics | null,
  matchId: string
) {
  // Roam vs farm balance (if timeline available)
  if (timelineMetrics && timelineMetrics.goldDiffTimeline.length > 0) {
    const at15 = timelineMetrics.goldDiffTimeline.find(
      (t) => t.timestamp >= 14.5 && t.timestamp <= 15.5
    );
    if (at15 && at15.value < -1000) {
      tags.push(createTag(
        "mid-behind-15",
        "tempo",
        "Significantly behind at 15 min",
        "warning",
        "MIDDLE",
        `${at15.value} gold behind lane opponent at 15 min. Focus on safe farming and avoiding unnecessary deaths.`,
        [{ matchId, timestamp: 900 }]
      ));
    }
  }

  // Damage share for mid should be high
  if (baseMetrics.damageShare >= 0.3) {
    tags.push(createTag(
      "mid-carry-damage",
      "combat",
      "Carry-level damage output",
      "strength",
      "MIDDLE",
      `${(baseMetrics.damageShare * 100).toFixed(0)}% of team damage — major carry performance.`,
      [{ matchId }]
    ));
  }

  // First blood involvement
  if (participant.firstBloodKill || participant.firstBloodAssist) {
    tags.push(createTag(
      "mid-first-blood",
      "combat",
      "First blood involvement",
      "strength",
      "MIDDLE",
      "Contributed to first blood — good early aggression.",
      [{ matchId }]
    ));
  }
}

function generateADCTags(
  tags: CoachingTag[],
  participant: Participant,
  _match: MatchDto,
  baseMetrics: BaseMetrics,
  timelineMetrics: TimelineMetrics | null,
  matchId: string
) {
  // Survival — ADC deaths before objectives are costly
  if (timelineMetrics) {
    const deathsBeforeObjectives = timelineMetrics.teamfightPresence.filter(
      (tf) => tf.objective && tf.deaths > 0
    );
    if (deathsBeforeObjectives.length > 0) {
      tags.push(createTag(
        "adc-dies-before-obj",
        "positioning",
        "Dying before objectives",
        "critical",
        "BOTTOM",
        `Died in ${deathsBeforeObjectives.length} objective fight(s). Stay alive for objectives — your DPS is critical.`,
        deathsBeforeObjectives.map((tf) => ({
          matchId,
          timestamp: tf.timestamp,
          context: `Died during ${tf.objective} fight`,
        }))
      ));
    }
  }

  // Damage per min expectations
  if (baseMetrics.damagePerMin < 400) {
    tags.push(createTag(
      "adc-low-dpm",
      "combat",
      "Low damage output",
      "warning",
      "BOTTOM",
      `${baseMetrics.damagePerMin.toFixed(0)} DPM is low for ADC. Focus on constant auto-attacking in fights and hitting frontline.`,
      [{ matchId }]
    ));
  } else if (baseMetrics.damagePerMin >= 700) {
    tags.push(createTag(
      "adc-high-dpm",
      "combat",
      "High damage output",
      "strength",
      "BOTTOM",
      `${baseMetrics.damagePerMin.toFixed(0)} DPM — excellent damage contribution.`,
      [{ matchId }]
    ));
  }

  // Multi-kills
  if (participant.pentaKills > 0) {
    tags.push(createTag("adc-penta", "combat", "PENTAKILL!", "strength", "BOTTOM",
      `Got a pentakill — legendary performance!`, [{ matchId }]));
  } else if (participant.quadraKills > 0) {
    tags.push(createTag("adc-quadra", "combat", "Quadra Kill", "strength", "BOTTOM",
      `Scored a quadra kill.`, [{ matchId }]));
  }
}

function generateSupportTags(
  tags: CoachingTag[],
  participant: Participant,
  _match: MatchDto,
  baseMetrics: BaseMetrics,
  timelineMetrics: TimelineMetrics | null,
  matchId: string
) {
  // Vision is paramount
  if (baseMetrics.wardsPlaced < 10 && _match.info.gameDuration > 1200) {
    tags.push(createTag(
      "sup-low-wards",
      "vision",
      "Not enough wards placed",
      "critical",
      "UTILITY",
      `Only ${baseMetrics.wardsPlaced} wards placed. Supports should place 20+ wards per game.`,
      [{ matchId }]
    ));
  }

  // Ward killing
  if (baseMetrics.wardsKilled >= 5) {
    tags.push(createTag(
      "sup-ward-clearing",
      "vision",
      "Good ward clearing",
      "strength",
      "UTILITY",
      `Cleared ${baseMetrics.wardsKilled} enemy wards — excellent vision denial.`,
      [{ matchId }]
    ));
  }

  // Kill participation for supports should be very high
  if (baseMetrics.killParticipation >= 0.65) {
    tags.push(createTag(
      "sup-high-kp",
      "teamplay",
      "Excellent kill participation",
      "strength",
      "UTILITY",
      `${(baseMetrics.killParticipation * 100).toFixed(0)}% KP — consistently involved in team plays.`,
      [{ matchId }]
    ));
  }

  // Deaths while warding (punishable deaths for supports)
  if (timelineMetrics && timelineMetrics.punishableDeaths.length > 0) {
    const wardingDeaths = timelineMetrics.punishableDeaths.filter(
      (d) => d.zone === "river" || d.zone === "enemy_jungle"
    );
    if (wardingDeaths.length > 0) {
      tags.push(createTag(
        "sup-warding-deaths",
        "vision",
        "Dying while warding",
        "warning",
        "UTILITY",
        `Died ${wardingDeaths.length} time(s) in river/enemy jungle, likely while warding. Ward with teammates nearby.`,
        wardingDeaths.map((d) => ({
          matchId,
          timestamp: d.timestamp,
          context: d.description,
        }))
      ));
    }
  }
}

// ─── Helper ───
function createTag(
  id: string,
  category: string,
  label: string,
  severity: CoachingTagSeverity,
  role: string,
  description: string,
  evidence: { matchId: string; timestamp?: number; context?: string; }[]
): CoachingTag {
  return {
    id,
    category,
    label,
    severity,
    role,
    description,
    evidence: evidence.map((e) => ({
      matchId: e.matchId,
      timestamp: e.timestamp,
      event: undefined,
      context: e.context,
    })),
  };
}
