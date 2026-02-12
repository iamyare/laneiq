import { z } from "zod/v4";

// ─── Account-V1 ───
export const RiotAccountSchema = z.object({
  puuid: z.string(),
  gameName: z.string().optional(),
  tagLine: z.string().optional(),
});
export type RiotAccount = z.infer<typeof RiotAccountSchema>;

// ─── Summoner-V4 ───
export const SummonerSchema = z.object({
  id: z.string().default(""),
  accountId: z.string().default(""),
  puuid: z.string(),
  profileIconId: z.number(),
  revisionDate: z.number().default(0),
  summonerLevel: z.number(),
});
export type Summoner = z.infer<typeof SummonerSchema>;

// ─── League-V4 ───
export const LeagueEntrySchema = z.object({
  leagueId: z.string().optional(),
  summonerId: z.string(),
  queueType: z.string(),
  tier: z.string().optional(),
  rank: z.string().optional(),
  leaguePoints: z.number().default(0),
  wins: z.number().default(0),
  losses: z.number().default(0),
  hotStreak: z.boolean().default(false),
  veteran: z.boolean().default(false),
  freshBlood: z.boolean().default(false),
  inactive: z.boolean().default(false),
});
export type LeagueEntry = z.infer<typeof LeagueEntrySchema>;

// ─── Match-V5 ───
export const ParticipantSchema = z.object({
  puuid: z.string(),
  summonerId: z.string().default(""),
  riotIdGameName: z.string().default(""),
  riotIdTagline: z.string().default(""),
  participantId: z.number().default(0),
  teamId: z.number(),
  championId: z.number(),
  championName: z.string(),
  champLevel: z.number().default(0),
  individualPosition: z.string().default(""),
  teamPosition: z.string().default(""),
  role: z.string().default(""),
  lane: z.string().default(""),
  win: z.boolean(),

  // Combat
  kills: z.number().default(0),
  deaths: z.number().default(0),
  assists: z.number().default(0),
  doubleKills: z.number().default(0),
  tripleKills: z.number().default(0),
  quadraKills: z.number().default(0),
  pentaKills: z.number().default(0),
  killingSprees: z.number().default(0),
  largestKillingSpree: z.number().default(0),
  largestMultiKill: z.number().default(0),
  firstBloodKill: z.boolean().default(false),
  firstBloodAssist: z.boolean().default(false),

  // Damage
  totalDamageDealtToChampions: z.number().default(0),
  physicalDamageDealtToChampions: z.number().default(0),
  magicDamageDealtToChampions: z.number().default(0),
  trueDamageDealtToChampions: z.number().default(0),
  totalDamageTaken: z.number().default(0),
  damageSelfMitigated: z.number().default(0),
  totalHeal: z.number().default(0),
  totalHealsOnTeammates: z.number().default(0),

  // Economy
  goldEarned: z.number().default(0),
  goldSpent: z.number().default(0),
  totalMinionsKilled: z.number().default(0),
  neutralMinionsKilled: z.number().default(0),

  // Vision
  visionScore: z.number().default(0),
  wardsPlaced: z.number().default(0),
  wardsKilled: z.number().default(0),
  detectorWardsPlaced: z.number().default(0),
  visionWardsBoughtInGame: z.number().default(0),

  // Objectives
  turretKills: z.number().default(0),
  turretTakedowns: z.number().default(0),
  inhibitorKills: z.number().default(0),
  inhibitorTakedowns: z.number().default(0),
  dragonKills: z.number().default(0),
  baronKills: z.number().default(0),
  objectivesStolen: z.number().default(0),

  // Items (0 means empty slot)
  item0: z.number().default(0),
  item1: z.number().default(0),
  item2: z.number().default(0),
  item3: z.number().default(0),
  item4: z.number().default(0),
  item5: z.number().default(0),
  item6: z.number().default(0),

  // Summoner Spells
  summoner1Id: z.number().default(0),
  summoner2Id: z.number().default(0),

  // Misc
  timeCCingOthers: z.number().default(0),
  totalTimeCCDealt: z.number().default(0),
  totalTimeSpentDead: z.number().default(0),
  longestTimeSpentLiving: z.number().default(0),
  spell1Casts: z.number().default(0),
  spell2Casts: z.number().default(0),
  spell3Casts: z.number().default(0),
  spell4Casts: z.number().default(0),
  gameEndedInSurrender: z.boolean().default(false),
  gameEndedInEarlySurrender: z.boolean().default(false),
  timePlayed: z.number().default(0),
});
export type Participant = z.infer<typeof ParticipantSchema>;

export const TeamObjectiveSchema = z.object({
  first: z.boolean().default(false),
  kills: z.number().default(0),
});

export const TeamSchema = z.object({
  teamId: z.number(),
  win: z.boolean(),
  objectives: z.object({
    baron: TeamObjectiveSchema.default({ first: false, kills: 0 }),
    champion: TeamObjectiveSchema.default({ first: false, kills: 0 }),
    dragon: TeamObjectiveSchema.default({ first: false, kills: 0 }),
    horde: TeamObjectiveSchema.default({ first: false, kills: 0 }),
    inhibitor: TeamObjectiveSchema.default({ first: false, kills: 0 }),
    riftHerald: TeamObjectiveSchema.default({ first: false, kills: 0 }),
    tower: TeamObjectiveSchema.default({ first: false, kills: 0 }),
  }),
  bans: z.array(z.object({
    championId: z.number(),
    pickTurn: z.number(),
  })).default([]),
});
export type Team = z.infer<typeof TeamSchema>;

export const MatchInfoSchema = z.object({
  gameId: z.number(),
  gameCreation: z.number(),
  gameDuration: z.number(),
  gameEndTimestamp: z.number().optional(),
  gameMode: z.string(),
  gameType: z.string(),
  gameVersion: z.string(),
  mapId: z.number(),
  queueId: z.number(),
  participants: z.array(ParticipantSchema),
  teams: z.array(TeamSchema),
  platformId: z.string().default(""),
});
export type MatchInfo = z.infer<typeof MatchInfoSchema>;

export const MatchDtoSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    participants: z.array(z.string()),
    dataVersion: z.string().default(""),
  }),
  info: MatchInfoSchema,
});
export type MatchDto = z.infer<typeof MatchDtoSchema>;

// ─── Timeline-V5 ───
export const TimelineParticipantFrameSchema = z.object({
  participantId: z.number(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  currentGold: z.number().default(0),
  totalGold: z.number().default(0),
  level: z.number().default(0),
  xp: z.number().default(0),
  minionsKilled: z.number().default(0),
  jungleMinionsKilled: z.number().default(0),
  dominionScore: z.number().default(0),
  teamScore: z.number().default(0),
  damageStats: z.object({
    totalDamageDoneToChampions: z.number().default(0),
    totalDamageTaken: z.number().default(0),
  }).optional(),
});
export type TimelineParticipantFrame = z.infer<typeof TimelineParticipantFrameSchema>;

export const TimelineEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  participantId: z.number().optional(),
  killerId: z.number().optional(),
  victimId: z.number().optional(),
  assistingParticipantIds: z.array(z.number()).optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  wardType: z.string().optional(),
  creatorId: z.number().optional(),
  monsterType: z.string().optional(),
  monsterSubType: z.string().optional(),
  buildingType: z.string().optional(),
  towerType: z.string().optional(),
  teamId: z.number().optional(),
  itemId: z.number().optional(),
  levelUpType: z.string().optional(),
  skillSlot: z.number().optional(),
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export const TimelineFrameSchema = z.object({
  timestamp: z.number(),
  participantFrames: z.record(z.string(), TimelineParticipantFrameSchema),
  events: z.array(TimelineEventSchema),
});
export type TimelineFrame = z.infer<typeof TimelineFrameSchema>;

export const TimelineDtoSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    participants: z.array(z.string()),
    dataVersion: z.string().default(""),
  }),
  info: z.object({
    frameInterval: z.number(),
    frames: z.array(TimelineFrameSchema),
    participants: z.array(z.object({
      participantId: z.number(),
      puuid: z.string(),
    })),
  }),
});
export type TimelineDto = z.infer<typeof TimelineDtoSchema>;

// ─── Combined Profile ───
export interface SummonerProfile {
  account: RiotAccount;
  summoner: Summoner;
  leagues: LeagueEntry[];
}
