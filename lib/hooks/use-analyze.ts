"use client";

import { useMutation } from "@tanstack/react-query";
import type { FeaturePack, CoachingReport } from "@/lib/types/metrics";

interface AnalyzeRequest {
  featurePack?: FeaturePack;
  featurePacks?: FeaturePack[];
  mode: "single" | "series";
}

interface AnalyzeResponse {
  report: CoachingReport;
}

async function analyzeWithAI(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Analysis failed (${res.status})`);
  }
  return res.json();
}

export function useAnalyze() {
  return useMutation({
    mutationFn: analyzeWithAI,
  });
}
