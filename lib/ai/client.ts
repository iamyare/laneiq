import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt, buildUserPrompt } from "./prompts";
import { parseCoachingReport } from "./parser";
import type { FeaturePack, CoachingReport } from "@/lib/types/metrics";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("[GeminiClient] GEMINI_API_KEY not set — AI analysis will fail");
}

function getClient() {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Analyze a single match with Gemini.
 */
export async function analyzeMatch(
  featurePack: FeaturePack
): Promise<CoachingReport> {
  const client = getClient();
  const role = featurePack.metadata.role;
  const systemPrompt = getSystemPrompt(role);
  const userPrompt = buildUserPrompt(JSON.stringify(featurePack, null, 2));

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  return parseCoachingReport(text);
}

/**
 * Analyze multiple matches (series) with Gemini.
 */
export async function analyzeSeries(
  featurePacks: FeaturePack[]
): Promise<CoachingReport> {
  const client = getClient();
  // Use the most common role from the series
  const roleCounts = featurePacks.reduce((acc, fp) => {
    acc[fp.metadata.role] = (acc[fp.metadata.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const primaryRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "MIDDLE";

  const systemPrompt = getSystemPrompt(primaryRole) + `

SERIES ANALYSIS MODE:
You are analyzing ${featurePacks.length} matches. Look for:
- Recurring patterns and habits (not just single-game issues)
- Trends across games (improving or declining)
- Consistent strengths to reinforce
- Core weaknesses that show up in multiple games
Weight your advice toward patterns, not outliers.`;

  // Compact the data for series to fit context window
  const compactData = featurePacks.map((fp) => ({
    matchId: fp.metadata.matchId,
    champion: fp.metadata.champion,
    role: fp.metadata.role,
    win: fp.metadata.win,
    duration: fp.metadata.gameDuration,
    metrics: fp.aggregates.base,
    tagSummary: fp.coachingTags.map((t) => `[${t.severity}] ${t.label}`),
    roams: fp.roamEvents?.length || 0,
    keyEventCount: fp.keyEvents.length,
    topEvents: fp.keyEvents.slice(0, 10),
  }));

  const userPrompt = buildUserPrompt(JSON.stringify(compactData, null, 2));

  const response = await client.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.3,
      maxOutputTokens: 6144,
      responseMimeType: "application/json",
    },
  });

  const text = response.text ?? "";
  return parseCoachingReport(text);
}
