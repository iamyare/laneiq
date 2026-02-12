import { NextRequest, NextResponse } from "next/server";
import { analyzeMatch, analyzeSeries } from "@/lib/ai/client";
import type { FeaturePack } from "@/lib/types/metrics";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featurePack, featurePacks, mode } = body as {
      featurePack?: FeaturePack;
      featurePacks?: FeaturePack[];
      mode?: "single" | "series";
    };

    if (mode === "series" && featurePacks && featurePacks.length > 0) {
      const report = await analyzeSeries(featurePacks);
      return NextResponse.json({ report });
    }

    if (featurePack) {
      const report = await analyzeMatch(featurePack);
      return NextResponse.json({ report });
    }

    return NextResponse.json(
      { error: "Missing featurePack or featurePacks in request body" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API /analyze]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
