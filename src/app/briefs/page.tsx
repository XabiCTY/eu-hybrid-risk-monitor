import type { Metadata } from "next";
import BriefCard from "@/components/BriefCard";
import SectionHeader from "@/components/SectionHeader";
import { getBriefs } from "@/lib/data";

export const metadata: Metadata = {
  title: "Executive Briefs | European Hybrid & Geopolitical Risk Monitor",
  description:
    "Archive of human-audited two-page Executive Briefs released at TLP:CLEAR.",
};

export default function BriefsPage() {
  const briefs = getBriefs();

  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeader title="03 // EXECUTIVE BRIEFS ARCHIVE (2P PDF)">
        <p>
          Tier 2 strategic intelligence: two-page Executive Briefs that
          combine primary-source evidence with analytic judgments and an
          explicit confidence level. Each brief is audited by a human analyst
          before release and is published at TLP:CLEAR only.
        </p>
      </SectionHeader>

      {briefs.length === 0 ? (
        <div className="max-w-[760px] border border-rule bg-stone p-6">
          <p className="font-serif text-xl text-ink">
            No Executive Brief has been published yet.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Briefs appear in this archive once they have passed human analyst
            audit and been cleared for public release at TLP:CLEAR. Tier 1
            automated signals remain available in the Radar Feed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {briefs.map((b) => (
            <BriefCard key={b.id} brief={b} />
          ))}
        </div>
      )}
    </main>
  );
}
