"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis, ReferenceLine } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { TimePoint } from "@/lib/types/metrics";

const chartConfig = {
  goldDiff: {
    label: "Gold Diff",
    color: "#fbbf24", // amber-400
  },
  xpDiff: {
    label: "XP Diff",
    color: "#60a5fa", // blue-400
  },
} satisfies ChartConfig;

interface GoldXPChartProps {
  goldDiff: TimePoint[];
  xpDiff: TimePoint[];
}

export function GoldXPChart({ goldDiff, xpDiff }: GoldXPChartProps) {
  // Merge data based on timestamp
  const data = goldDiff.map((point, index) => ({
    timestamp: point.timestamp,
    goldDiff: point.value,
    xpDiff: xpDiff[index]?.value || 0,
  }));

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="timestamp"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${Math.round(value)}m`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `${value}`}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
        <Line
          dataKey="goldDiff"
          type="monotone"
          stroke="var(--color-goldDiff)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="xpDiff"
          type="monotone"
          stroke="var(--color-xpDiff)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
