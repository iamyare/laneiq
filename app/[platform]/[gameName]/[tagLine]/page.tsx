"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSummoner } from "@/lib/hooks/use-summoner";
import { useMatches } from "@/lib/hooks/use-matches";
import { fetchMatchDetail } from "@/lib/actions/match";
import { SearchForm } from "@/components/search-form";
import { RankBadge } from "@/components/rank-badge";
import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getProfileIconUrl, QUEUE_TYPES } from "@/lib/constants/regions";
import type { PlatformId } from "@/lib/constants/regions";
import type { MatchDto, Participant } from "@/lib/types/riot";
import { ArrowLeft, Loader2, ChevronDown, AlertCircle } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{
    platform: string;
    gameName: string;
    tagLine: string;
  }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { platform, gameName, tagLine } = use(params);
  const decodedName = decodeURIComponent(gameName);
  const decodedTag = decodeURIComponent(tagLine);
  const platformId = platform as PlatformId;

  const [queueFilter, setQueueFilter] = useState<string>("all");

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useSummoner(decodedName, decodedTag, platformId);

  const {
    data: matchPages,
    isLoading: matchesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error: matchesError,
  } = useMatches(
    profile?.account.puuid ?? null,
    platformId,
    5,
    queueFilter !== "all" ? parseInt(queueFilter) : undefined
  );

  // Fetch match details for each match ID
  const [matchDetails, setMatchDetails] = useState<Map<string, { match: MatchDto; participant: Participant }>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  const allMatchIds = matchPages?.pages.flatMap((p) => p.matchIds) ?? [];

  useEffect(() => {
    if (!profile?.account.puuid) return;

    const newIds = allMatchIds.filter(
      (id) => !matchDetails.has(id) && !loadingDetails.has(id)
    );
    if (newIds.length === 0) return;

    setLoadingDetails((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });

    // Fetch details for new IDs using server action
    const fetchDetails = async () => {
      for (const matchId of newIds) {
        try {
          const data = await fetchMatchDetail(matchId, platformId, profile.account.puuid, false);
          setMatchDetails((prev) => {
            const next = new Map(prev);
            next.set(matchId, {
              match: data.match,
              participant: data.participant,
            });
            return next;
          });
        } catch {
          // Skip failed fetches
        }
        setLoadingDetails((prev) => {
          const next = new Set(prev);
          next.delete(matchId);
          return next;
        });
      }
    };

    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMatchIds.length, profile?.account.puuid]);

  const soloQueue = profile?.leagues.find(
    (l) => l.queueType === "RANKED_SOLO_5x5"
  );
  const flexQueue = profile?.leagues.find(
    (l) => l.queueType === "RANKED_FLEX_SR"
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <SearchForm compact defaultPlatform={platformId} />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Error */}
        {profileError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <h2 className="font-semibold text-red-400">Summoner Not Found</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {profileError.message}
              </p>
            </div>
          </div>
        )}

        {/* Profile Card */}
        {profileLoading && (
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        )}

        {profile && (
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Profile Icon */}
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-lg shadow-amber-500/10">
                <Image
                  src={getProfileIconUrl(profile.summoner.profileIconId)}
                  alt="Profile"
                  width={80}
                  height={80}
                  unoptimized
                />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-bold">
                {profile.summoner.summonerLevel}
              </div>
            </div>

            {/* Name & Ranks */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-bold">
                  {profile.account.gameName}
                  <span className="text-muted-foreground font-normal">
                    #{profile.account.tagLine}
                  </span>
                </h1>
                <Badge variant="secondary" className="text-xs bg-white/5 text-muted-foreground mt-1">
                  {platformId.toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3">
                {soloQueue && (
                  <RankBadge
                    tier={soloQueue.tier}
                    rank={soloQueue.rank}
                    lp={soloQueue.leaguePoints}
                    queueType={soloQueue.queueType}
                    wins={soloQueue.wins}
                    losses={soloQueue.losses}
                  />
                )}
                {flexQueue && (
                  <RankBadge
                    tier={flexQueue.tier}
                    rank={flexQueue.rank}
                    lp={flexQueue.leaguePoints}
                    queueType={flexQueue.queueType}
                    wins={flexQueue.wins}
                    losses={flexQueue.losses}
                  />
                )}
                {!soloQueue && !flexQueue && (
                  <RankBadge />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Match History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Match History</h2>
            <Select value={queueFilter} onValueChange={setQueueFilter}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                <SelectValue placeholder="All Queues" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="all">All Queues</SelectItem>
                {Object.entries(QUEUE_TYPES).map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Match list */}
          {matchesLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          )}

          {matchesError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-400">{matchesError.message}</span>
            </div>
          )}

          <div className="space-y-2">
            {allMatchIds.map((matchId) => {
              const detail = matchDetails.get(matchId);
              if (!detail) {
                return (
                  <Skeleton key={matchId} className="h-16 w-full rounded-xl" />
                );
              }
              return (
                <MatchCard
                  key={matchId}
                  matchId={matchId}
                  participant={detail.participant as Participant}
                  matchInfo={detail.match.info}
                  platform={platformId}
                  gameName={decodedName}
                  tagLine={decodedTag}
                />
              );
            })}
          </div>

          {/* Load More */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                Load More Matches
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
