// ─── Base Metrics (computed from MatchDto, no timeline needed) ───
export interface BaseMetrics {
  kda: number;           // (K+A)/D, Infinity if D=0
  kills: number;
  deaths: number;
  assists: number;
  csPerMin: number;
  goldPerMin: number;
  damagePerMin: number;
  damageShare: number;   // % of team's total damage
  killParticipation: number; // (K+A) / team kills
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  controlWardsPlaced: number;
  goldEfficiency: number; // goldSpent / goldEarned
  deathTimingScore: number; // avg time alive / longestTimeAlive
  objectiveParticipation: number;
  csAt10?: number;       // requires timeline
  goldDiffAt15?: number; // requires timeline
}

// ─── Timeline Metrics (require TimelineDto) ───
export interface TimelineMetrics {
  wardsPerMin: number;
  controlWardCoverage: number;    // control wards placed / min
  dangerZoneEntries: DangerZoneEntry[];
  punishableDeaths: PunishableDeath[];
  badBacks: BadBack[];
  goldDiffTimeline: TimePoint[];  // gold diff vs lane opponent at intervals
  xpDiffTimeline: TimePoint[];
  teamfightPresence: TeamfightEvent[];
}

export interface TimePoint {
  timestamp: number; // minutes
  value: number;
}

export interface DangerZoneEntry {
  timestamp: number;
  zone: "enemy_jungle" | "river" | "enemy_territory";
  hadVision: boolean;
  alliesNearby: number;
  survived: boolean;
}

export interface PunishableDeath {
  timestamp: number;
  zone: string;
  hadVision: boolean;
  alliesNearby: number;
  description: string;
}

export interface BadBack {
  timestamp: number;
  csLost: number;
  platesLost: number;
  xpLost: number;
  description: string;
}

export interface TeamfightEvent {
  timestamp: number;
  duration: number;
  objective?: string; // dragon, baron, herald
  participated: boolean;
  kills: number;
  deaths: number;
  assists: number;
  damageDealt: number;
}

// ─── Coaching Tags ───
export type CoachingTagSeverity = "critical" | "warning" | "info" | "strength";

export interface CoachingTag {
  id: string;
  category: string;        // e.g. "vision", "positioning", "tempo", "objectives"
  label: string;            // e.g. "Low ward coverage in river"
  severity: CoachingTagSeverity;
  role?: string;            // role-specific tag
  evidence: TagEvidence[];
  description: string;
}

export interface TagEvidence {
  matchId: string;
  timestamp?: number;       // game time in seconds
  event?: string;           // kill, death, objective, ward, etc.
  context?: string;         // brief description
}

// ─── Roam Analysis (mid/support) ───
export type RoamQuality = "GOOD_ROAM" | "NEUTRAL_ROAM" | "BAD_ROAM";

export interface RoamEvent {
  timestamp: number;
  quality: RoamQuality;
  departureTime: number;
  returnTime: number;
  outcome: {
    kills: number;
    assists: number;
    objectivesTaken: number;
  };
  cost: {
    csLost: number;
    platesLost: number;
    xpLost: number;
    towerDamageTaken: number;
  };
  evidence: string;
}

// ─── FeaturePack (input to Gemini) ───
export interface FeaturePack {
  metadata: FeaturePackMeta;
  windows: TimeWindow[];
  keyEvents: KeyEvent[];
  aggregates: AggregateMetrics;
  roamEvents?: RoamEvent[];
  coachingTags: CoachingTag[];
}

export interface FeaturePackMeta {
  matchId: string;
  gameDuration: number;     // seconds
  gameVersion: string;
  role: string;
  champion: string;
  teamId: number;
  win: boolean;
  queueType: string;
  tier?: string;
  rank?: string;
}

export interface TimeWindow {
  startMin: number;
  endMin: number;
  goldDiff?: number;
  xpDiff?: number;
  kills: number;
  deaths: number;
  assists: number;
  wardsPlaced: number;
  objectiveEvents: string[];
}

export interface KeyEvent {
  timestamp: number;        // seconds
  type: "death" | "kill" | "objective" | "vision" | "teamfight" | "roam" | "item_spike";
  description: string;
  impact: "positive" | "negative" | "neutral";
}

export interface AggregateMetrics {
  base: BaseMetrics;
  timeline?: TimelineMetrics;
  // Percentiles relative to player's N-match series
  percentiles?: Record<string, number>;
}

// ─── AI Coaching Report (output from Gemini) ───
export interface CoachingReport {
  overallScore: number;      // 1-10
  priorities: CoachingPriority[];
  insights: CoachingInsight[];
  practicePlan: PracticeItem[];
  roamAnalysis?: RoamAnalysisSummary;
  measureNext: string[];     // things to track in next games
}

export interface CoachingPriority {
  rank: number;
  area: string;
  impact: "high" | "medium" | "low";
  summary: string;
  details: string;
}

export interface CoachingInsight {
  category: string;
  finding: string;
  evidence: {
    matchId: string;
    timestamp?: number;
    event?: string;
  }[];
  recommendation: string;
}

export interface PracticeItem {
  goal: string;
  metric: string;
  target: string;
  priority: "high" | "medium" | "low";
}

export interface RoamAnalysisSummary {
  totalRoams: number;
  goodRoams: number;
  badRoams: number;
  avgCost: number;
  avgReward: number;
  summary: string;
  recommendations: string[];
}
