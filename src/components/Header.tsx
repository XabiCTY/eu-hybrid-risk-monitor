"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LINKEDIN_URL, NAV_ITEMS } from "@/lib/constants";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-[640px]">
          <h1 className="font-serif text-[26px] font-semibold uppercase leading-tight tracking-wide text-ink sm:text-3xl">
            <Link href="/">European Hybrid &amp; Geopolitical Risk Monitor</Link>
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            An OSINT &amp; Cyber Threat Intelligence repository tracking
            multi-domain hybrid warfare, kinetic proxies, and critical
            infrastructure vulnerabilities (NIS2). Curated by Analyst Xabier
            Barbero.
          </p>
        </div>

        <nav aria-label="Primary" className="lg:shrink-0">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block border-b-2 py-1.5 font-mono text-[11px] uppercase tracking-wide ${
                      active
                        ? "border-oxford text-oxford"
                        : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-b-2 border-transparent py-1.5 font-mono text-[11px] uppercase tracking-wide text-muted hover:text-ink"
              >
                LINKEDIN ↗
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
