import Link from "next/link";
import { Camera, Video, Layers, Compass, ArrowRight, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <main className="w-full min-h-[75vh] flex items-center justify-center bg-nordic-canvas px-6 py-16 text-nordic-ink">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Subtle status badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-nordic-border bg-nordic-surface px-4 py-1.5 text-xs text-nordic-subtle shadow-xs">
          <Compass className="h-3.5 w-3.5 text-nordic-pine" />
          <span className="font-mono text-[11px] tracking-widest uppercase">
            Error 404 · Navigation Notice
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-nordic-ink">
            Plate Not Located
          </h1>
          <p className="text-base text-nordic-subtle max-w-lg mx-auto leading-relaxed">
            The plate, production record, or private vault you requested does not exist at this address or requires direct authentication.
          </p>
        </div>

        {/* Portal Notice */}
        <div className="rounded-2xl border border-nordic-border bg-nordic-surface/80 p-5 text-left flex items-start gap-4 shadow-xs">
          <div className="rounded-xl bg-nordic-muted p-2 text-nordic-pine shrink-0 border border-nordic-border">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="text-xs space-y-1">
            <p className="font-medium text-nordic-ink">Client Proofing Vault Notice</p>
            <p className="text-nordic-subtle leading-relaxed">
              Client proofing galleries are zero-discovery and unlisted. Please use the exact private URL sent in your commission confirmation email.
            </p>
          </div>
        </div>

        {/* Navigation Portals */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            href="/photography"
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-nordic-border bg-nordic-surface hover:border-nordic-pine/50 transition-all hover:-translate-y-0.5 shadow-xs group"
          >
            <Camera className="h-5 w-5 text-nordic-pine mb-2" />
            <span className="text-xs font-semibold text-nordic-ink group-hover:text-nordic-pine transition-colors">
              Photography
            </span>
            <span className="text-[10px] text-nordic-subtle font-mono mt-0.5">
              Still Archives
            </span>
          </Link>

          <Link
            href="/media"
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-nordic-border bg-nordic-surface hover:border-nordic-clay/50 transition-all hover:-translate-y-0.5 shadow-xs group"
          >
            <Video className="h-5 w-5 text-nordic-clay mb-2" />
            <span className="text-xs font-semibold text-nordic-ink group-hover:text-nordic-clay transition-colors">
              Media
            </span>
            <span className="text-[10px] text-nordic-subtle font-mono mt-0.5">
              Motion Collective
            </span>
          </Link>

          <Link
            href="/hub"
            className="flex flex-col items-center justify-center p-5 rounded-2xl border border-nordic-border bg-nordic-surface hover:border-nordic-pine/50 transition-all hover:-translate-y-0.5 shadow-xs group"
          >
            <Layers className="h-5 w-5 text-nordic-pine mb-2" />
            <span className="text-xs font-semibold text-nordic-ink group-hover:text-nordic-pine transition-colors">
              Graywood Hub
            </span>
            <span className="text-[10px] text-nordic-subtle font-mono mt-0.5">
              Ecosystem Standard
            </span>
          </Link>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-nordic-subtle hover:text-nordic-ink transition"
          >
            <span>Return to Studio Home</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </main>
  );
}
