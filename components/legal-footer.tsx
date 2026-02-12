"use client";

export function LegalFooter() {
  return (
    <footer className="border-t border-white/5 bg-black/30 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          LaneIQ isn&apos;t endorsed by Riot Games and doesn&apos;t reflect the views or opinions
          of Riot Games or anyone officially involved in producing or managing Riot Games
          properties. Riot Games, and all associated properties are trademarks or
          registered trademarks of Riot Games, Inc.
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <a
            href="https://developer.riotgames.com/policies/general"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Riot API Policy
          </a>
          <span className="text-white/10">•</span>
          <a
            href="https://www.riotgames.com/en/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Privacy Notice
          </a>
        </div>
      </div>
    </footer>
  );
}
