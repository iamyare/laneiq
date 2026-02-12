
import { CoachingReport } from "@/lib/types/metrics";
import type { MatchDetailResult } from "@/lib/actions/match";
import { QUEUE_TYPES, ROLE_LABELS, SUMMONER_SPELL_MAP } from "@/lib/constants/regions";
import { Participant } from "@/lib/types/riot";

export function generateMatchMarkdown(
  matchData: MatchDetailResult,
  report: CoachingReport | null
): string {
  const { match, participant, metrics, hasTimeline } = matchData;
  const gameDuration = match.info.gameDuration;
  const minutes = Math.floor(gameDuration / 60);
  const seconds = (gameDuration % 60).toString().padStart(2, "0");
  
  const winStatus = participant.win ? "VICTORY" : "DEFEAT";
  const queueType = QUEUE_TYPES[match.info.queueId] || `Queue ${match.info.queueId}`;
  const role = ROLE_LABELS[participant.individualPosition || participant.teamPosition] || "Unknown Role";
  
  const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
  const kdaRatio = participant.deaths === 0 
    ? "Perfect" 
    : ((participant.kills + participant.assists) / participant.deaths).toFixed(2);

  let md = `# Match Analysis: ${participant.championName} (${winStatus})\n\n`;
  
  // ─── Header ───
  md += `**Date:** ${new Date(match.info.gameCreation).toLocaleDateString()} ${new Date(match.info.gameCreation).toLocaleTimeString()}\n`;
  md += `**Duration:** ${minutes}:${seconds}\n`;
  md += `**Mode:** ${queueType}\n`;
  md += `**Version:** ${match.info.gameVersion}\n`;
  md += `**Role:** ${role}\n`;
  md += `**KDA:** ${kda} (${kdaRatio} KDA)\n`;
  md += `**Level:** ${participant.champLevel}\n\n`;

  // ─── Team Scoreboards ───
  const blueTeam = match.info.participants.filter(p => p.teamId === 100);
  const redTeam = match.info.participants.filter(p => p.teamId === 200);

  const renderTeamTable = (teamName: string, players: Participant[]) => {
    let table = `### ${teamName} (${players[0]?.win ? "Victory" : "Defeat"})\n\n`;
    table += `| Champion | Name | Role | KDA | Dmg | Gold | CS | Vis |\n`;
    table += `|---|---|---|---|---|---|---|---|\n`;
    players.forEach(p => {
      const pRole = ROLE_LABELS[p.individualPosition || p.teamPosition] || "???";
      const pKda = `${p.kills}/${p.deaths}/${p.assists}`;
      const dmg = (p.totalDamageDealtToChampions / 1000).toFixed(1) + "k";
      const gold = (p.goldEarned / 1000).toFixed(1) + "k";
      const cs = p.totalMinionsKilled + p.neutralMinionsKilled;
      const meMarker = p.puuid === participant.puuid ? "**(Me)** " : "";
      
      table += `| ${meMarker}${p.championName} | ${p.riotIdGameName} | ${pRole} | ${pKda} | ${dmg} | ${gold} | ${cs} | ${p.visionScore} |\n`;
    });
    return table + "\n";
  };

  md += `## Scoreboard\n`;
  md += renderTeamTable("Blue Team", blueTeam);
  md += renderTeamTable("Red Team", redTeam);

  // ─── Detailed Metrics ───
  md += `## Detailed Statistics\n`;
  
  md += `### Combat\n`;
  md += `- **Kills:** ${participant.kills} (First Blood: ${participant.firstBloodKill ? "Yes" : "No"})\n`;
  md += `- **Multi-kills:** ${participant.doubleKills}D / ${participant.tripleKills}T / ${participant.quadraKills}Q / ${participant.pentaKills}P\n`;
  md += `- **Largest Spree:** ${participant.largestKillingSpree}\n`;
  md += `- **Kill Participation:** ${(metrics.base.killParticipation * 100).toFixed(1)}%\n\n`;

  md += `### Damage & Tanking\n`;
  md += `- **Total Damage Dealt:** ${participant.totalDamageDealtToChampions.toLocaleString()}\n`;
  md += `  - Physical: ${participant.physicalDamageDealtToChampions.toLocaleString()}\n`;
  md += `  - Magic: ${participant.magicDamageDealtToChampions.toLocaleString()}\n`;
  md += `  - True: ${participant.trueDamageDealtToChampions.toLocaleString()}\n`;
  md += `- **Damage Taken:** ${participant.totalDamageTaken.toLocaleString()}\n`;
  md += `- **Self Mitigated:** ${participant.damageSelfMitigated.toLocaleString()}\n`;
  md += `- **Total Healed:** ${participant.totalHeal.toLocaleString()}\n`;
  md += `- **Damage Share:** ${(metrics.base.damageShare * 100).toFixed(1)}%\n\n`;

  md += `### Vision & Utility\n`;
  md += `- **Vision Score:** ${participant.visionScore}\n`;
  md += `- **Wards Placed:** ${participant.wardsPlaced}\n`;
  md += `- **Wards Killed:** ${participant.wardsKilled}\n`;
  md += `- **Control Wards:** ${participant.detectorWardsPlaced}\n`;
  md += `- **CC Score:** ${participant.timeCCingOthers}s\n\n`;

  md += `### Economy & Farming\n`;
  md += `- **Gold/Min:** ${metrics.base.goldPerMin.toFixed(0)}\n`;
  md += `- **CS/Min:** ${metrics.base.csPerMin.toFixed(1)}\n`;
  md += `- **Total CS:** ${participant.totalMinionsKilled + participant.neutralMinionsKilled}\n`;
  md += `- **Gold Efficiency:** ${(metrics.base.goldEfficiency * 100).toFixed(1)}%\n\n`;
  
  md += `### Objectives\n`;
  md += `- **Turrets:** ${participant.turretKills}\n`;
  md += `- **Inhibitors:** ${participant.inhibitorKills}\n`;
  md += `- **Dragons:** ${participant.dragonKills}\n`;
  md += `- **Barons:** ${participant.baronKills}\n\n`;
  
  md += `### Build\n`;
  md += `**Summoner Spells:** ${SUMMONER_SPELL_MAP[participant.summoner1Id] || "Unknown"}, ${SUMMONER_SPELL_MAP[participant.summoner2Id] || "Unknown"}\n\n`;
  md += `**Items:**\n`;
  // We only have item IDs, so we list them. 
  const items = [participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6];
  items.forEach((id, i) => {
    if (id !== 0) md += `- Item Slot ${i + 1}: ID ${id}\n`;
  });
  md += "\n";

  // ─── Timeline Analysis ───
  if (hasTimeline && metrics.timeline) {
    md += `## Timeline Analysis\n`;
    
    if (metrics.timeline.badBacks.length > 0) {
      md += `### ⚠️ Bad Recalls\n`;
      metrics.timeline.badBacks.forEach(back => {
         md += `- **${(back.timestamp).toFixed(1)}m:** Lost ${back.csLost} CS, ${back.platesLost} Plates. *${back.description}*\n`;
      });
      md += "\n";
    }

    if (metrics.timeline.punishableDeaths.length > 0) {
       md += `### 💀 Punishable Deaths\n`;
       metrics.timeline.punishableDeaths.forEach(death => {
         md += `- **${(death.timestamp).toFixed(1)}m:** Died in ${death.zone}. Vision: ${death.hadVision ? "Yes" : "NO"}. *${death.description}*\n`;
       });
       md += "\n";
    }

    if (metrics.timeline.dangerZoneEntries.length > 0) {
        md += `### 🚫 Danger Zone Entries\n`;
        const total = metrics.timeline.dangerZoneEntries.length;
        const suvived = metrics.timeline.dangerZoneEntries.filter(e => e.survived).length;
        md += `Entered danger zones **${total}** times. Survived **${suvived}** times.\n\n`;
    }
  }

  // ─── AI Coach ───
  if (report) {
    md += `## AI Coach Analysis\n`;
    md += `**Overall Score:** ${report.overallScore}/10\n\n`;

    if (report.priorities.length > 0) {
      md += `### 🎯 Key Priorities\n`;
      report.priorities.forEach((p) => {
        md += `#### ${p.rank}. ${p.area} (${p.impact.toUpperCase()})\n`;
        md += `> ${p.summary}\n\n`;
        md += `${p.details}\n\n`;
      });
    }

    if (report.insights.length > 0) {
      md += `### 💡 Insights\n`;
      report.insights.forEach((ins) => {
        md += `- **${ins.category}:** ${ins.finding}\n`;
        md += `  *Recommendation: ${ins.recommendation}*\n`;
      });
      md += `\n`;
    }

    if (report.practicePlan.length > 0) {
      md += `### 📋 Practice Plan\n`;
      report.practicePlan.forEach((plan) => {
        const priorityIcon = plan.priority === 'high' ? '🔴' : plan.priority === 'medium' ? '🟡' : '🔵';
        md += `- ${priorityIcon} **${plan.goal}**: Target ${plan.target} ${plan.metric}\n`;
      });
      md += `\n`;
    }
    
    if (report.roamAnalysis) {
         md += `### 🗺️ Roam Analysis\n`;
         md += `- **Total Roams:** ${report.roamAnalysis.totalRoams}\n`;
         md += `- **Good Roams:** ${report.roamAnalysis.goodRoams}\n`;
         md += `- **Bad Roams:** ${report.roamAnalysis.badRoams}\n\n`;
         md += `**Summary:** ${report.roamAnalysis.summary}\n`;
         if (report.roamAnalysis.recommendations && report.roamAnalysis.recommendations.length > 0) {
             md += `**Recommendations:**\n`;
             report.roamAnalysis.recommendations.forEach(rec => md += `- ${rec}\n`);
         }
         md += "\n";
    }
  } else {
    md += `> *AI Coach analysis was not generated for this match export.*\n`;
  }

  md += `\n---\nGenerated by LaneIQ`;

  return md;
}
