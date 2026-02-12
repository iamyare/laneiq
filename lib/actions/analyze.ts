"use server";

import { analyzeMatch, analyzeSeries } from "@/lib/ai/client";
import type { FeaturePack, CoachingReport } from "@/lib/types/metrics";

export interface AnalyzeResult {
  report: CoachingReport;
}

export async function analyzeWithAI(
  mode: "single" | "series",
  featurePack?: FeaturePack,
  featurePacks?: FeaturePack[]
): Promise<AnalyzeResult> {
  try {
    if (mode === "series" && featurePacks && featurePacks.length > 0) {
      const report = await analyzeSeries(featurePacks);
      return { report };
    }

    if (featurePack) {
      const report = await analyzeMatch(featurePack);
      return { report };
    }

    throw new Error("Missing featurePack or featurePacks");
  } catch (error) {
    console.error("[Action analyzeWithAI]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Analysis failed: ${message}`);
  }
}
