"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useSummoner } from "@/lib/hooks/use-summoner";
import { useMatchDetail } from "@/lib/hooks/use-matches";
import { useAnalyze } from "@/lib/hooks/use-analyze";
import { ChampionIcon } from "@/components/champion-icon";
import { ItemIcon } from "@/components/item-icon";
import { KDADisplay } from "@/components/kda-display";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { QUEUE_TYPES, ROLE_LABELS } from "@/lib/constants/regions";
import type { PlatformId } from "@/lib/constants/regions";
import type { Participant } from "@/lib/types/riot";
import type { CoachingReport } from "@/lib/types/metrics";
import {
  ArrowLeft,
  Brain,
  Loader2,
  Eye,
  Sword,
  Target,
  Shield,
  AlertCircle,
  Trophy,
  Clock,
  Crosshair,
  Sparkles,
  CheckCircle2,
  Download,
  TrendingUp,
} from "lucide-react";
import { generateMatchMarkdown } from "@/lib/utils/export-match";
import { GoldXPChart } from "@/components/charts/gold-xp-chart";
import { DamageDistributionChart } from "@/components/charts/damage-distribution";
import { TimelineEventsChart } from "@/components/charts/timeline-events";

interface MatchPageProps {
  params: Promise<{
    platform: string;
    gameName: string;
    tagLine: string;
    matchId: string;
  }>;
}

export default function MatchPage({ params }: MatchPageProps) {
  const { platform, gameName, tagLine, matchId } = use(params);
  const decodedName = decodeURIComponent(gameName);
  const decodedTag = decodeURIComponent(tagLine);
  const platformId = platform as PlatformId;

  const [showTimeline, setShowTimeline] = useState(false);
  const [report, setReport] = useState<CoachingReport | null>(null);

  // Fetch summoner to get PUUID
  const { data: summonerProfile } = useSummoner(decodedName, decodedTag, platformId);
  const puuid = summonerProfile?.account.puuid ?? null;

  const {
    data: matchData,
    isLoading: matchLoading,
    error: matchError,
  } = useMatchDetail(matchId, platformId, puuid, showTimeline);

  const analyze = useAnalyze();

  const handleAnalyze = () => {
    if (!matchData) return;
    analyze.mutate(
      {
        featurePack: {
          metadata: {
            matchId,
            gameDuration: matchData.match.info.gameDuration,
            gameVersion: matchData.match.info.gameVersion,
            role: matchData.participant.individualPosition || "",
            champion: matchData.participant.championName,
            teamId: matchData.participant.teamId,
            win: matchData.participant.win,
            queueType: QUEUE_TYPES[matchData.match.info.queueId] || "",
          },
          windows: [],
          keyEvents: [],
          aggregates: {
            base: matchData.metrics.base,
            timeline: matchData.metrics.timeline || undefined,
          },
          coachingTags: matchData.coachingTags,
        },
        mode: "single",
      },
      { onSuccess: (data) => setReport(data.report) }
    );
  };

  const handleExport = () => {
    if (!matchData) return;
    const md = generateMatchMarkdown(matchData, report);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `match-${matchId}-analysis.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const match = matchData?.match;
  const participant = matchData?.participant;
  const metrics = matchData?.metrics;
  const coachingTags = matchData?.coachingTags || [];

  const blueTeam = match?.info.participants.filter((p) => p.teamId === 100) || [];
  const redTeam = match?.info.participants.filter((p) => p.teamId === 200) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 bg-white/2 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href={`/${platformId}/${encodeURIComponent(decodedName)}/${encodeURIComponent(decodedTag)}`}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <span className="font-medium text-sm">{decodedName}#{decodedTag}</span>
            <span className="text-muted-foreground text-xs ml-2">Match Detail</span>
          </div>
          {matchData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2 bg-white/5 border-white/10 hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Analysis</span>
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Loading */}
        {matchLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        )}

        {/* Error */}
        {matchError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{matchError.message}</p>
          </div>
        )}

        {match && participant && metrics && (
          <>
            {/* Match Header */}
            <div className={`rounded-2xl border p-6 ${participant.win
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-red-500/20 bg-red-500/5"
              }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <ChampionIcon championName={participant.championName} size={64} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold">{participant.championName}</h1>
                      <Badge className={participant.win ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>
                        {participant.win ? "VICTORY" : "DEFEAT"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{ROLE_LABELS[participant.individualPosition || participant.teamPosition] || "Unknown"}</span>
                      <span className="text-white/10">•</span>
                      <span>{QUEUE_TYPES[match.info.queueId] || "Custom"}</span>
                      <span className="text-white/10">•</span>
                      <span>{Math.floor(match.info.gameDuration / 60)}:{(match.info.gameDuration % 60).toString().padStart(2, "0")}</span>
                    </div>
                  </div>
                </div>
                <KDADisplay kills={participant.kills} deaths={participant.deaths} assists={participant.assists} />
              </div>
            </div>

            {/* Metrics Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="overview" className="gap-2">
                  <Target className="h-3.5 w-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="vision" className="gap-2">
                  <Eye className="h-3.5 w-3.5" /> Vision
                </TabsTrigger>
                <TabsTrigger value="combat" className="gap-2">
                  <Sword className="h-3.5 w-3.5" /> Combat
                </TabsTrigger>
                <TabsTrigger value="objectives" className="gap-2">
                  <Trophy className="h-3.5 w-3.5" /> Objectives
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="CS/min" value={metrics.base.csPerMin.toFixed(1)} icon={<Crosshair className="h-4 w-4" />} />
                  <MetricCard label="Gold/min" value={metrics.base.goldPerMin.toFixed(0)} icon={<Sparkles className="h-4 w-4 text-amber-400" />} />
                  <MetricCard label="Damage/min" value={metrics.base.damagePerMin.toFixed(0)} icon={<Sword className="h-4 w-4 text-red-400" />} />
                  <MetricCard label="Kill Part." value={`${(metrics.base.killParticipation * 100).toFixed(0)}%`} icon={<Target className="h-4 w-4 text-blue-400" />} />
                  <MetricCard label="Damage Share" value={`${(metrics.base.damageShare * 100).toFixed(0)}%`} icon={<Sword className="h-4 w-4" />} />
                  <MetricCard label="Gold Eff." value={`${(metrics.base.goldEfficiency * 100).toFixed(0)}%`} icon={<Sparkles className="h-4 w-4" />} />
                  <MetricCard label="Total CS" value={String(participant.totalMinionsKilled + participant.neutralMinionsKilled)} icon={<Crosshair className="h-4 w-4" />} />
                  <MetricCard label="Time Alive" value={`${((1 - participant.totalTimeSpentDead / match.info.gameDuration) * 100).toFixed(0)}%`} icon={<Clock className="h-4 w-4" />} />
                </div>
              </TabsContent>

              <TabsContent value="vision" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="Vision Score" value={String(participant.visionScore)} icon={<Eye className="h-4 w-4 text-cyan-400" />} />
                  <MetricCard label="Wards Placed" value={String(participant.wardsPlaced)} icon={<Eye className="h-4 w-4" />} />
                  <MetricCard label="Wards Killed" value={String(participant.wardsKilled)} icon={<Eye className="h-4 w-4 text-red-400" />} />
                  <MetricCard label="Control Wards" value={String(participant.detectorWardsPlaced)} icon={<Eye className="h-4 w-4 text-pink-400" />} />
                </div>
              </TabsContent>

              <TabsContent value="combat" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="Total Damage" value={participant.totalDamageDealtToChampions.toLocaleString()} icon={<Sword className="h-4 w-4 text-red-400" />} />
                  <MetricCard label="Damage Taken" value={participant.totalDamageTaken.toLocaleString()} icon={<Shield className="h-4 w-4 text-blue-400" />} />
                  <MetricCard label="Healing" value={participant.totalHeal.toLocaleString()} icon={<Shield className="h-4 w-4 text-emerald-400" />} />
                  <MetricCard label="CC Time" value={`${participant.timeCCingOthers}s`} icon={<Clock className="h-4 w-4 text-purple-400" />} />
                  <MetricCard label="Largest Spree" value={String(participant.largestKillingSpree)} icon={<Sword className="h-4 w-4 text-amber-400" />} />
                  <MetricCard label="Multi-kills" value={`${participant.doubleKills}D/${participant.tripleKills}T/${participant.quadraKills}Q/${participant.pentaKills}P`} icon={<Sparkles className="h-4 w-4" />} />
                  <MetricCard label="First Blood" value={participant.firstBloodKill ? "Yes ✓" : "No"} icon={<Sword className="h-4 w-4" />} />
                  <MetricCard label="Self Mitigated" value={participant.damageSelfMitigated.toLocaleString()} icon={<Shield className="h-4 w-4" />} />
                </div>
              </TabsContent>

              <TabsContent value="objectives" className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetricCard label="Turrets" value={String(participant.turretKills)} icon={<Target className="h-4 w-4 text-amber-400" />} />
                  <MetricCard label="Inhibitors" value={String(participant.inhibitorKills)} icon={<Target className="h-4 w-4 text-purple-400" />} />
                  <MetricCard label="Dragons" value={String(participant.dragonKills)} icon={<Trophy className="h-4 w-4 text-orange-400" />} />
                  <MetricCard label="Barons" value={String(participant.baronKills)} icon={<Trophy className="h-4 w-4 text-purple-400" />} />
                  <MetricCard label="Obj. Stolen" value={String(participant.objectivesStolen)} icon={<Sparkles className="h-4 w-4 text-cyan-400" />} />
                  <MetricCard label="Obj. Part." value={`${(metrics.base.objectiveParticipation * 100).toFixed(0)}%`} icon={<Target className="h-4 w-4" />} />
                </div>
              </TabsContent>
            </Tabs>

            {/* Items */}
            <Card className="bg-white/2 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-1.5">
                  {[participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6].map((itemId, i) => (
                    <ItemIcon key={i} itemId={itemId} size={36} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Coaching Tags */}
            {coachingTags.length > 0 && (
              <Card className="bg-white/2 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Coaching Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {coachingTags.map((tag) => (
                      <div
                        key={tag.id}
                        className={`rounded-lg border p-3 text-sm ${tag.severity === "critical"
                            ? "border-red-500/20 bg-red-500/5"
                            : tag.severity === "warning"
                              ? "border-amber-500/20 bg-amber-500/5"
                              : tag.severity === "strength"
                                ? "border-emerald-500/20 bg-emerald-500/5"
                                : "border-white/10 bg-white/2"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`text-[10px] ${tag.severity === "critical"
                                ? "bg-red-500/20 text-red-400"
                                : tag.severity === "warning"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : tag.severity === "strength"
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-white/10 text-white/60"
                              }`}
                          >
                            {tag.severity}
                          </Badge>
                          <span className="font-medium text-xs">{tag.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{tag.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scoreboard */}
            <Card className="bg-white/2 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Scoreboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <TeamScoreboard team={blueTeam} label="Blue Team" color="blue" highlightPuuid={puuid || ""} platformId={platformId} />
                <Separator className="bg-white/5" />
                <TeamScoreboard team={redTeam} label="Red Team" color="red" highlightPuuid={puuid || ""} platformId={platformId} />
              </CardContent>
            </Card>

            {/* Analyze with AI */}
            <Card className="bg-linear-to-br from-amber-500/5 to-cyan-500/5 border-amber-500/20">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <Brain className="h-10 w-10 text-amber-400" />
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Analyze with AI</h3>
                  <p className="text-sm text-muted-foreground mt-1">Get role-specific coaching and improvement priorities</p>
                </div>
                {!showTimeline && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTimeline(true)}
                    className="text-xs bg-white/5 border-white/10"
                  >
                    Load Timeline Data (for deeper analysis)
                  </Button>
                )}

                {showTimeline && metrics.timeline && (
                  <div className="w-full space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-amber-400" />
                          Gold & XP Lead
                        </h4>
                        <div className="rounded-xl border border-white/10 bg-white/2 p-4">
                          <GoldXPChart
                            goldDiff={metrics.timeline.goldDiffTimeline}
                            xpDiff={metrics.timeline.xpDiffTimeline}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Sword className="h-4 w-4 text-red-400" />
                          Damage Distribution
                        </h4>
                        <div className="rounded-xl border border-white/10 bg-white/2 p-4 flex flex-col items-center justify-center">
                          <DamageDistributionChart
                            physical={participant.physicalDamageDealtToChampions}
                            magic={participant.magicDamageDealtToChampions}
                            trueDamage={participant.trueDamageDealtToChampions}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-400" />
                        Timeline Events
                      </h4>
                      <div className="rounded-xl border border-white/10 bg-white/2 p-6 pt-2">
                        <TimelineEventsChart
                          duration={match.info.gameDuration}
                          deaths={metrics.timeline.punishableDeaths}
                          badBacks={metrics.timeline.badBacks}
                          dangerZones={metrics.timeline.dangerZoneEntries}
                        />
                      </div>
                    </div>

                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={analyze.isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8 py-3 text-base"
                >
                  {analyze.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Brain className="h-4 w-4 mr-2" /> Analyze Match</>
                  )}
                </Button>
                {analyze.error && <p className="text-sm text-red-400">{analyze.error.message}</p>}
              </CardContent>
            </Card>

            {/* AI Report */}
            {report && <AIReportSection report={report} />}
          </>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ──

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/2 p-4 space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function TeamScoreboard({ team, label, color, highlightPuuid, platformId }: { team: Participant[]; label: string; color: "blue" | "red"; highlightPuuid: string; platformId: string }) {
  return (
    <div>
      <h4 className={`text-xs font-medium mb-2 ${color === "blue" ? "text-blue-400" : "text-red-400"}`}>
        {label} {team[0]?.win ? "— Victory" : "— Defeat"}
      </h4>
      <div className="space-y-1">
        {team.map((p) => {
          const profileUrl = p.riotIdGameName && p.riotIdTagline 
            ? `/${platformId}/${encodeURIComponent(p.riotIdGameName)}/${encodeURIComponent(p.riotIdTagline)}`
            : null;

          const content = (
            <>
              <ChampionIcon championName={p.championName} size={28} />
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block text-[11px]">{p.riotIdGameName || p.championName}</span>
                <span className="text-[10px] text-muted-foreground">{ROLE_LABELS[p.individualPosition || p.teamPosition] || ""}</span>
              </div>
              <KDADisplay kills={p.kills} deaths={p.deaths} assists={p.assists} showRatio={false} />
              <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
                <span>{p.totalMinionsKilled + p.neutralMinionsKilled} CS</span>
                <span>{p.visionScore} Vis</span>
                <span>{(p.totalDamageDealtToChampions / 1000).toFixed(1)}k dmg</span>
              </div>
              <div className="hidden md:flex gap-0.5">
                {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((id, i) => (
                  <ItemIcon key={i} itemId={id} size={20} />
                ))}
              </div>
            </>
          );

          return profileUrl ? (
            <Link 
              key={p.puuid} 
              href={profileUrl}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-white/10 ${p.puuid === highlightPuuid ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/2"}`}
            >
              {content}
            </Link>
          ) : (
            <div key={p.puuid} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs ${p.puuid === highlightPuuid ? "bg-amber-500/10 border border-amber-500/20" : "bg-white/2"}`}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIReportSection({ report }: { report: CoachingReport }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Brain className="h-5 w-5 text-amber-400" />
        AI Coaching Report
        <Badge className="bg-amber-500/20 text-amber-400 text-xs">Score: {report.overallScore}/10</Badge>
      </h2>

      {/* Priorities */}
      <Card className="bg-white/2 border-white/10">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">🎯 Priorities</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {report.priorities.map((p) => (
            <div key={p.rank} className="flex gap-3">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0 ${p.impact === "high" ? "bg-red-500/20 text-red-400" : p.impact === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                #{p.rank}
              </div>
              <div>
                <h4 className="font-medium text-sm">{p.area}: {p.summary}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{p.details}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Insights */}
      {report.insights.length > 0 && (
        <Card className="bg-white/2 border-white/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">💡 Insights</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {report.insights.map((ins, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/2 p-3">
                <Badge variant="secondary" className="text-[10px] bg-white/5 mb-2">{ins.category}</Badge>
                <p className="text-sm">{ins.finding}</p>
                <p className="text-xs text-muted-foreground mt-1">{ins.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Practice Plan */}
      {report.practicePlan.length > 0 && (
        <Card className="bg-white/2 border-white/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">📋 Practice Plan</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {report.practicePlan.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${item.priority === "high" ? "text-red-400" : item.priority === "medium" ? "text-amber-400" : "text-blue-400"}`} />
                <div>
                  <span className="font-medium">{item.goal}</span>
                  <span className="text-muted-foreground"> — {item.metric}: {item.target}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Measure Next */}
      {report.measureNext.length > 0 && (
        <Card className="bg-linear-to-br from-cyan-500/5 to-purple-500/5 border-cyan-500/20">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">📊 Track in Next Games</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {report.measureNext.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Roam Analysis */}
      {report.roamAnalysis && (
        <Card className="bg-white/2 border-white/10">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">🗺️ Roam Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Total Roams" value={String(report.roamAnalysis.totalRoams)} icon={<Target className="h-4 w-4" />} />
              <MetricCard label="Good Roams" value={String(report.roamAnalysis.goodRoams)} icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
              <MetricCard label="Bad Roams" value={String(report.roamAnalysis.badRoams)} icon={<AlertCircle className="h-4 w-4 text-red-400" />} />
            </div>
            <p className="text-sm text-muted-foreground">{report.roamAnalysis.summary}</p>
            {report.roamAnalysis.recommendations.map((rec, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {rec}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
