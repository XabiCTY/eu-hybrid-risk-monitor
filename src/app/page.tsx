import RadarWorkspace from "@/components/RadarWorkspace";
import SignalBar from "@/components/SignalBar";
import { getBriefs, getMeta, getSignals } from "@/lib/data";

export default function Home() {
  const signals = getSignals();
  const meta = getMeta();
  const briefs = getBriefs();

  return (
    <>
      <SignalBar meta={meta} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <RadarWorkspace
          signals={signals}
          briefs={briefs}
          anchorUtc={meta.last_ingest_utc}
        />
      </main>
    </>
  );
}
