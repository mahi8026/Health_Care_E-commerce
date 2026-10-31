// health-care/src/components/seo/GuideSources.jsx
//
// "Sources you can verify" block for guide pages (E-E-A-T: cited sources).
//
// Deliberately plain <a> links with rel="noopener noreferrer": these are
// independent references the reader can check, not affiliate or internal links.
// Only URLs verified to resolve (HTTP 200) are listed in GUIDE_SOURCES — see the
// note in config/guides.js.

import { GUIDE_SOURCES } from '@/config/guides';

export default function GuideSources({ sources = GUIDE_SOURCES }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;

  return (
    <section
      aria-labelledby="guide-sources-heading"
      className="mb-10 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] p-5"
    >
      <h2
        id="guide-sources-heading"
        className="text-sm font-semibold text-[var(--color-brand-navy)] mb-2"
      >
        Sources you can verify
      </h2>
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">
        Regulatory references for the claims made on this page. Links open the official
        websites.
      </p>
      <ul className="space-y-1.5">
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-brand-teal)] hover:underline"
            >
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
