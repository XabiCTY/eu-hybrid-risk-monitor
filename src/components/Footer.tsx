import { AUTHOR_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-rule bg-paper">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-6 font-mono text-[11px] uppercase tracking-wide text-muted sm:px-6 lg:flex-row lg:justify-between lg:px-8">
        <span className="text-ink">TLP:CLEAR</span>
        <span>
          Public, zero-cost, open-source publication built exclusively on public
          sources.
        </span>
        <span>Curated by Analyst {AUTHOR_NAME}</span>
      </div>
    </footer>
  );
}
