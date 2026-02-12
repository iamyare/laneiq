"use client";

import { useMutation } from "@tanstack/react-query";
import { analyzeWithAI } from "@/lib/actions/analyze";
import type { FeaturePack, CoachingReport } from "@/lib/types/metrics";

interface AnalyzeRequest {
  featurePack?: FeaturePack;
  featurePacks?: FeaturePack[];
  mode: "single" | "series";
}

interface AnalyzeResponse {
  report: CoachingReport;
}

export function useAnalyze() {
  return useMutation({
    mutationFn: (req: AnalyzeRequest): Promise<AnalyzeResponse> =>
      analyzeWithAI(req.mode, req.featurePack, req.featurePacks),
  });
}
