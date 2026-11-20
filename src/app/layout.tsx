import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "European Hybrid & Geopolitical Risk Monitor",
  description:
    "Open-source intelligence and cyber threat intelligence repository tracking hybrid warfare, kinetic proxies and critical infrastructure exposure under NIS2. TLP:CLEAR. Curated by Analyst Xabier Barbero.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${newsreader.variable} ${inter.variable} ${jetbrains.variable} h-full`}
    >
      <body
        suppressHydrationWarning
        className="flex min-h-full flex-col bg-paper text-ink"
      >
        <div className="bg-oxford px-4 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-paper print:hidden">
          TLP: CLEAR // OPEN-SOURCE INTELLIGENCE &amp; HYBRID THREAT ANALYSIS ON
          EUROPEAN SECURITY
        </div>
        <div className="print:hidden">
          <Header />
        </div>
        <div className="flex flex-1 flex-col">{children}</div>
        <div className="print:hidden">
          <Footer />
        </div>
      </body>
    </html>
  );
}
