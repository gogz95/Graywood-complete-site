import { Layers, ArrowRight } from "lucide-react";

/**
 * graywood.no — Main / hub landing page stub.
 * Phase 1: structural skeleton only. Full content comes in Phase 2.
 */
export default function MainPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center animate-fade-in">
      {/* Logo mark */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border shadow-lg">
        <Layers className="h-10 w-10 text-accent" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <div className="space-y-3 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">
          Graywood
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Photography · Media
          <br />· Creative.
        </h1>
        <p className="text-lg text-muted leading-relaxed">
          The Graywood hub — where photography, media production,
          and creative direction meet.
        </p>
      </div>

      {/* Domain links stub */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          id="main-link-photography"
          href="https://graywoodphotography.no"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-2 hover:border-accent"
        >
          Photography
          <ArrowRight className="h-4 w-4" />
        </a>
        <a
          id="main-link-media"
          href="https://graywoodmedia.no"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-2 hover:border-accent"
        >
          Media
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Domain badge */}
      <span className="mt-4 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
        graywood.no · Phase 1 stub
      </span>
    </main>
  );
}
