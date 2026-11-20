import type { ReactNode } from "react";

export default function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 border-b border-rule pb-6">
      <h2 className="font-serif text-2xl font-semibold uppercase leading-tight tracking-wide text-ink sm:text-3xl">
        {title}
      </h2>
      {children ? (
        <div className="mt-3 max-w-[760px] text-sm leading-relaxed text-muted">
          {children}
        </div>
      ) : null}
    </header>
  );
}
