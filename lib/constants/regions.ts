// Platform routing values → regional routing values mapping
// Platform IDs are used for Summoner-V4, League-V4
// Regional hosts are used for Account-V1, Match-V5

export type PlatformId =
  | "na1"
  | "br1"
  | "la1"
  | "la2"
  | "euw1"
  | "eun1"
  | "tr1"
  | "ru"
  | "kr"
  | "jp1"
  | "oc1"
  | "ph2"
  | "sg2"
  | "th2"
  | "tw2"
  | "vn2";

export type RegionalHost = "americas" | "asia" | "europe" | "sea";

export interface PlatformConfig {
  id: PlatformId;
  label: string;
  region: string;
  regionalHost: RegionalHost;
}

export const PLATFORMS: PlatformConfig[] = [
  { id: "na1", label: "NA", region: "North America", regionalHost: "americas" },
  { id: "br1", label: "BR", region: "Brazil", regionalHost: "americas" },
  { id: "la1", label: "LAN", region: "Latin America North", regionalHost: "americas" },
  { id: "la2", label: "LAS", region: "Latin America South", regionalHost: "americas" },
  { id: "euw1", label: "EUW", region: "Europe West", regionalHost: "europe" },
  { id: "eun1", label: "EUNE", region: "Europe Nordic & East", regionalHost: "europe" },
  { id: "tr1", label: "TR", region: "Turkey", regionalHost: "europe" },
  { id: "ru", label: "RU", region: "Russia", regionalHost: "europe" },
  { id: "kr", label: "KR", region: "Korea", regionalHost: "asia" },
  { id: "jp1", label: "JP", region: "Japan", regionalHost: "asia" },
  { id: "oc1", label: "OCE", region: "Oceania", regionalHost: "sea" },
  { id: "ph2", label: "PH", region: "Philippines", regionalHost: "sea" },
  { id: "sg2", label: "SG", region: "Singapore", regionalHost: "sea" },
  { id: "th2", label: "TH", region: "Thailand", regionalHost: "sea" },
  { id: "tw2", label: "TW", region: "Taiwan", regionalHost: "sea" },
  { id: "vn2", label: "VN", region: "Vietnam", regionalHost: "sea" },
];

export const PLATFORM_MAP = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
) as Record<PlatformId, PlatformConfig>;

export function getPlatformHost(platformId: PlatformId): string {
  return `https://${platformId}.api.riotgames.com`;
}

export function getRegionalHost(platformId: PlatformId): string {
  const config = PLATFORM_MAP[platformId];
  if (!config) throw new Error(`Unknown platform: ${platformId}`);
  return `https://${config.regionalHost}.api.riotgames.com`;
}

// Queue types for filtering
export const QUEUE_TYPES: Record<number, string> = {
  420: "Ranked Solo/Duo",
  440: "Ranked Flex",
  400: "Normal Draft",
  430: "Normal Blind",
  450: "ARAM",
  700: "Clash",
  900: "URF",
  1020: "One for All",
  1300: "Nexus Blitz",
  1400: "Ultimate Spellbook",
  1700: "Arena",
  1900: "Pick URF",
};

// Role mapping from Riot's individualPosition
export const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

// Data Dragon
export const DDRAGON_VERSION = "16.3.1";
export const DDRAGON_BASE = `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}`;
export const DDRAGON_IMG = `${DDRAGON_BASE}/img`;

export function getChampionIconUrl(championName: string): string {
  return `${DDRAGON_IMG}/champion/${championName}.png`;
}

export function getItemIconUrl(itemId: number): string {
  if (itemId === 0) return "";
  return `${DDRAGON_IMG}/item/${itemId}.png`;
}

export function getProfileIconUrl(iconId: number): string {
  return `${DDRAGON_IMG}/profileicon/${iconId}.png`;
}

export function getSummonerSpellUrl(spellId: number): string {
  return `${DDRAGON_IMG}/spell/${SUMMONER_SPELL_MAP[spellId] || "SummonerFlash"}.png`;
}

export const SUMMONER_SPELL_MAP: Record<number, string> = {
  1: "SummonerBoost",       // Cleanse
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste",       // Ghost
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  13: "SummonerMana",        // Clarity
  14: "SummonerDot",         // Ignite
  21: "SummonerBarrier",
  30: "SummonerPoroRecall",
  31: "SummonerPoroThrow",
  32: "SummonerSnowball",    // Mark (ARAM)
  39: "SummonerSnowURFSnowball_Mark",
  54: "Summoner_UltBookPlaceholder",
  55: "Summoner_UltBookSmitePlaceholder",
};

// Series analysis options
export const SERIES_OPTIONS = [10, 20, 30, 50] as const;
export const DEFAULT_SERIES_COUNT = 20;
