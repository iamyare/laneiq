import { z } from "zod/v4";
import {
  RiotAccountSchema,
  SummonerSchema,
  LeagueEntrySchema,
  MatchDtoSchema,
  TimelineDtoSchema,
  type RiotAccount,
  type Summoner,
  type LeagueEntry,
  type MatchDto,
  type TimelineDto,
} from "@/lib/types/riot";
import {
  type PlatformId,
  PLATFORM_MAP,
  getPlatformHost,
  getRegionalHost,
} from "@/lib/constants/regions";
import { acquireToken, reportRetryAfter } from "./rate-limiter";

const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  console.warn("[RiotClient] RIOT_API_KEY not set — API calls will fail");
}

// ─── Error types ───
export class RiotApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public endpoint: string,
    public retryAfter?: number,
  ) {
    super(`Riot API ${status} ${statusText} at ${endpoint}`);
    this.name = "RiotApiError";
  }
}

// ─── Internal fetch with rate limiting ───
async function riotFetch<T>(
  url: string,
  schema: z.ZodType<T>,
  region: string,
): Promise<T> {
  await acquireToken(region);

  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": RIOT_API_KEY!,
      Accept: "application/json",
    },
    next: { revalidate: 300 }, // 5 min server-side cache
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "10", 10);
    reportRetryAfter(region, retryAfter);
    throw new RiotApiError(429, "Rate Limited", url, retryAfter);
  }

  if (res.status === 404) {
    throw new RiotApiError(404, "Not Found", url);
  }

  if (res.status === 403) {
    throw new RiotApiError(403, "Forbidden — check API key", url);
  }

  if (!res.ok) {
    throw new RiotApiError(res.status, res.statusText, url);
  }

  const data = await res.json();
  return schema.parse(data);
}

// ─── Account-V1 (Regional host) ───
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  platformId: PlatformId,
): Promise<RiotAccount> {
  const host = getRegionalHost(platformId);
  const url = `${host}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotFetch(url, RiotAccountSchema, PLATFORM_MAP[platformId].regionalHost);
}

export async function getAccountByPuuid(
  puuid: string,
  platformId: PlatformId,
): Promise<RiotAccount> {
  const host = getRegionalHost(platformId);
  const url = `${host}/riot/account/v1/accounts/by-puuid/${puuid}`;
  return riotFetch(url, RiotAccountSchema, PLATFORM_MAP[platformId].regionalHost);
}

// ─── Summoner-V4 (Platform host) ───
export async function getSummonerByPuuid(
  puuid: string,
  platformId: PlatformId,
): Promise<Summoner> {
  const host = getPlatformHost(platformId);
  const url = `${host}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch(url, SummonerSchema, platformId);
}

// ─── League-V4 (Platform host) ───
export async function getLeagueEntries(
  summonerId: string,
  platformId: PlatformId,
): Promise<LeagueEntry[]> {
  const host = getPlatformHost(platformId);
  const url = `${host}/lol/league/v4/entries/by-summoner/${summonerId}`;
  return riotFetch(url, z.array(LeagueEntrySchema), platformId);
}

// ─── Match-V5 (Regional host) ───
export interface MatchListOptions {
  start?: number;
  count?: number;
  queue?: number;
  type?: string;
  startTime?: number;
  endTime?: number;
}

export async function getMatchIds(
  puuid: string,
  platformId: PlatformId,
  options: MatchListOptions = {},
): Promise<string[]> {
  const host = getRegionalHost(platformId);
  const params = new URLSearchParams();
  if (options.start !== undefined) params.set("start", String(options.start));
  if (options.count !== undefined) params.set("count", String(options.count));
  if (options.queue !== undefined) params.set("queue", String(options.queue));
  if (options.type) params.set("type", options.type);
  if (options.startTime) params.set("startTime", String(options.startTime));
  if (options.endTime) params.set("endTime", String(options.endTime));

  const url = `${host}/lol/match/v5/matches/by-puuid/${puuid}/ids?${params}`;
  return riotFetch(url, z.array(z.string()), PLATFORM_MAP[platformId].regionalHost);
}

export async function getMatch(
  matchId: string,
  platformId: PlatformId,
): Promise<MatchDto> {
  const host = getRegionalHost(platformId);
  const url = `${host}/lol/match/v5/matches/${matchId}`;
  return riotFetch(url, MatchDtoSchema, PLATFORM_MAP[platformId].regionalHost);
}

export async function getTimeline(
  matchId: string,
  platformId: PlatformId,
): Promise<TimelineDto> {
  const host = getRegionalHost(platformId);
  const url = `${host}/lol/match/v5/matches/${matchId}/timeline`;
  return riotFetch(url, TimelineDtoSchema, PLATFORM_MAP[platformId].regionalHost);
}
