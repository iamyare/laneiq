import type { CoachingReport } from "@/lib/types/metrics";

/**
 * Parse Gemini's JSON response into a typed CoachingReport.
 */
export function parseCoachingReport(raw: string): CoachingReport {
  // Strip markdown code fences if present
  let jsonStr = raw.trim();
  const match = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) {
    jsonStr = match[1];
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```\w*\s*/, "").replace(/\s*```$/, "");
  }

  // Attempt to find JSON object bounds if it contains other text
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
  }

  jsonStr = jsonStr.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and fill defaults
    const report: CoachingReport = {
      overallScore: typeof parsed.overallScore === "number"
        ? Math.min(10, Math.max(1, parsed.overallScore))
        : 5,
      priorities: Array.isArray(parsed.priorities)
        ? parsed.priorities.map((p: Record<string, unknown>, i: number) => ({
            rank: typeof p.rank === "number" ? p.rank : i + 1,
            area: String(p.area || "General"),
            impact: ["high", "medium", "low"].includes(p.impact as string)
              ? p.impact as string
              : "medium",
            summary: String(p.summary || ""),
            details: String(p.details || ""),
          }))
        : [],
      insights: Array.isArray(parsed.insights)
        ? parsed.insights.map((ins: Record<string, unknown>) => ({
            category: String(ins.category || "General"),
            finding: String(ins.finding || ""),
            evidence: Array.isArray(ins.evidence)
              ? ins.evidence.map((e: Record<string, unknown>) => ({
                  matchId: String(e.matchId || ""),
                  timestamp: typeof e.timestamp === "number" ? e.timestamp : undefined,
                  event: typeof e.event === "string" ? e.event : undefined,
                }))
              : [],
            recommendation: String(ins.recommendation || ""),
          }))
        : [],
      practicePlan: Array.isArray(parsed.practicePlan)
        ? parsed.practicePlan.map((item: Record<string, unknown>) => ({
            goal: String(item.goal || ""),
            metric: String(item.metric || ""),
            target: String(item.target || ""),
            priority: ["high", "medium", "low"].includes(item.priority as string)
              ? item.priority as string
              : "medium",
          }))
        : [],
      measureNext: Array.isArray(parsed.measureNext)
        ? parsed.measureNext.map(String)
        : [],
    };

    // Add roam analysis if present
    if (parsed.roamAnalysis) {
      report.roamAnalysis = {
        totalRoams: typeof parsed.roamAnalysis.totalRoams === "number"
          ? parsed.roamAnalysis.totalRoams : 0,
        goodRoams: typeof parsed.roamAnalysis.goodRoams === "number"
          ? parsed.roamAnalysis.goodRoams : 0,
        badRoams: typeof parsed.roamAnalysis.badRoams === "number"
          ? parsed.roamAnalysis.badRoams : 0,
        avgCost: typeof parsed.roamAnalysis.avgCost === "number"
          ? parsed.roamAnalysis.avgCost : 0,
        avgReward: typeof parsed.roamAnalysis.avgReward === "number"
          ? parsed.roamAnalysis.avgReward : 0,
        summary: String(parsed.roamAnalysis.summary || ""),
        recommendations: Array.isArray(parsed.roamAnalysis.recommendations)
          ? parsed.roamAnalysis.recommendations.map(String)
          : [],
      };
    }

    return report;
  } catch (error) {
    // Return a minimal report on parse failure
    console.error("[AIParser] Failed to parse Gemini response:", error);
    return {
      overallScore: 5,
      priorities: [
        {
          rank: 1,
          area: "Analysis Error",
          impact: "high" as const,
          summary: "Unable to parse AI analysis",
          details: "The AI response couldn't be parsed. Please try again.",
        },
      ],
      insights: [],
      practicePlan: [],
      measureNext: [],
    };
  }
}
