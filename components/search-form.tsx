"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlatformSelect } from "@/components/platform-select";
import type { PlatformId } from "@/lib/constants/regions";
import { Search, Loader2 } from "lucide-react";

interface SearchFormProps {
  defaultPlatform?: PlatformId;
  compact?: boolean;
}

export function SearchForm({ defaultPlatform = "na1", compact = false }: SearchFormProps) {
  const router = useRouter();
  const [riotId, setRiotId] = useState("");
  const [platform, setPlatform] = useState<PlatformId>(defaultPlatform);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate Riot ID format: gameName#tagLine
    const parts = riotId.split("#");
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      setError("Enter a valid Riot ID (e.g., Player#NA1)");
      return;
    }

    const [gameName, tagLine] = parts.map((p) => p.trim());
    setLoading(true);
    router.push(`/${platform}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex items-stretch gap-2 ${compact ? "" : "flex-col sm:flex-row"}`}>
        <div className="flex flex-1 items-stretch gap-2">
          <PlatformSelect value={platform} onValueChange={setPlatform} />
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Riot ID (e.g., Player#NA1)"
              value={riotId}
              onChange={(e) => {
                setRiotId(e.target.value);
                setError("");
              }}
              className={`pl-10 bg-white/5 border-white/10 placeholder:text-white/30 
                ${compact ? "h-10" : "h-12 text-lg"}
                ${error ? "border-red-500/50" : ""}`}
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading || !riotId.trim()}
          className={`bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all
            ${compact ? "h-10 px-4" : "h-12 px-8 text-base"}
            disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </form>
  );
}
