import { Video, ArrowRight } from "lucide-react";

/**
 * graywoodmedia.no — Landing page stub.
 * Phase 1: structural skeleton only. Full content comes in Phase 2.
 */
export default function MediaPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center animate-fade-in">
      {/* Logo mark */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border shadow-lg">
        <Video className="h-10 w-10 text-accent" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <div className="space-y-3 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Graywood Media
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Creative production
          <br />
          for the modern age.
        </h1>
        <p className="text-lg text-muted leading-relaxed">
          Video production, motion graphics, brand films & digital content.
          Storytelling that moves audiences.
        </p>
      </div>

      {/* CTA stub */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          id="media-cta-showreel"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          Watch Showreel
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          id="media-cta-contact"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-2"
        >
          Start a Project
        </button>
      </div>

      {/* Domain badge */}
      <span className="mt-4 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
        graywoodmedia.no · Phase 1 stub
      </span>
    </main>
  );
}
