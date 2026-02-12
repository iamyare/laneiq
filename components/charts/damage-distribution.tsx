"use client";

import { Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

const chartConfig = {
  physical: {
    label: "Physical",
    color: "#ef4444", // red-500
  },
  magic: {
    label: "Magic",
    color: "#3b82f6", // blue-500
  },
  true: {
    label: "True",
    color: "#f5f5f5", // white
  },
} satisfies ChartConfig;

interface DamageDistributionChartProps {
  physical: number;
  magic: number;
  trueDamage: number;
}

export function DamageDistributionChart({ physical, magic, trueDamage }: DamageDistributionChartProps) {
  const data = [
    { type: "physical", value: physical, fill: "var(--color-physical)" },
    { type: "magic", value: magic, fill: "var(--color-magic)" },
    { type: "true", value: trueDamage, fill: "var(--color-true)" },
  ];

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[300px]">
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="type"
          innerRadius={60}
          strokeWidth={5}
        />
        <ChartLegend content={<ChartLegendContent />} className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center" />
      </PieChart>
    </ChartContainer>
  );
}
