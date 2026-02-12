import { SearchForm } from "@/components/search-form";
import { Zap, BarChart3, Brain, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-cyan-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
          {/* Branding */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="relative">
                <Zap className="h-10 w-10 text-amber-400" />
                <div className="absolute inset-0 h-10 w-10 text-amber-400 blur-lg opacity-50">
                  <Zap className="h-10 w-10" />
                </div>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
                  LaneIQ
                </span>
              </h1>
            </div>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
              Post-game analytics & AI coaching for League of Legends.
              Understand your mistakes, find patterns, improve your rank.
            </p>
          </div>

          {/* Search */}
          <div className="w-full max-w-lg mx-auto">
            <SearchForm />
          </div>

          <p className="text-xs text-muted-foreground">
            Enter your Riot ID (gameName#tagLine) and select your region
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-amber-400" />}
              title="Deep Metrics"
              description="KDA, CS/min, damage share, vision score, kill participation — and more."
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6 text-cyan-400" />}
              title="AI Coaching"
              description="Gemini-powered insights with role-specific advice and evidence."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-emerald-400" />}
              title="Role Analysis"
              description="Custom coaching for Top, Jungle, Mid, ADC, and Support."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-purple-400" />}
              title="Series Trends"
              description="Analyze up to 50 matches to find patterns and habits."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-white/10 hover:bg-white/[0.04]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
