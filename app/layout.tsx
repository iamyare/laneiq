import type { Metadata } from "next";
import { Roboto_Flex, JetBrains_Mono } from 'next/font/google';
import { QueryProvider } from "@/lib/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LegalFooter } from "@/components/legal-footer";
import "./globals.css";

const roboto_flex = Roboto_Flex({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--display-family',
});
const jetbrains_mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--body-family',
});

export const metadata: Metadata = {
  title: "LaneIQ — LoL Match Analytics & AI Coach",
  description:
    "Analyze your League of Legends matches with advanced metrics and AI-powered coaching. Get actionable insights to improve your gameplay.",
  keywords: ["League of Legends", "LoL", "analytics", "coaching", "AI", "match analysis"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto_flex.variable} ${jetbrains_mono.variable} dark`} suppressHydrationWarning>
      <body
        className={`antialiased min-h-screen flex flex-col font-body`}
      >
        <QueryProvider>
          <TooltipProvider>
            <main className="flex-1">{children}</main>
            <LegalFooter />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
