import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LegalFooter } from "@/components/legal-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
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
