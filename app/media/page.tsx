import { prisma } from "@/lib/prisma";
import { ShowreelPlayer } from "@/components/media/ShowreelPlayer";
import {
  Video,
  Film,
  Sparkles,
  Clapperboard,
  ArrowRight,
  MonitorPlay,
  CheckCircle,
  Building2,
  Tv,
  Layers,
  Award,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const [publicAlbums] = await Promise.all([
    prisma.album.findMany({
      where: { type: "PORTFOLIO" },
      include: {
        _count: { select: { items: true } },
      },
      take: 6,
    }),
  ]);

  return (
    <main className="w-full min-h-screen bg-nordic-canvas text-nordic-ink">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 flex flex-col space-y-20">
        {/* Cinematic Hero */}
        <section className="relative w-full py-20 px-6 sm:px-10 flex flex-col items-center justify-center text-center rounded-3xl border border-nordic-border bg-nordic-surface/60 overflow-hidden">
          {/* Subtle warm ambient glow for MEDIA theme */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] rounded-full bg-nordic-clay/5 blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-nordic-border bg-nordic-surface px-4 py-1.5 text-xs text-nordic-clay">
              <Video className="h-3.5 w-3.5 text-nordic-clay" />
              <span className="font-mono uppercase tracking-widest text-nordic-clay">
                Nordic Motion Collective
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-nordic-ink leading-[1.1]">
              Motion, sound, and story in harmonious tension.
            </h1>

            <p className="text-base sm:text-lg text-nordic-subtle max-w-2xl mx-auto leading-relaxed">
              Graywood Media is a collaborative studio crafting commercial brand films, high-end motion design, and immersive digital artifacts for visionary brands across Northern Europe.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="#showreel"
                className="inline-flex items-center gap-2 rounded-xl bg-nordic-clay px-6 py-3 text-sm font-medium text-white transition hover:bg-nordic-clay/90 shadow-sm cursor-pointer"
              >
                <span>Watch 2026 Reel</span>
                <MonitorPlay className="h-4 w-4" />
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-xl border border-nordic-border bg-nordic-surface px-6 py-3 text-sm font-medium text-nordic-ink transition hover:bg-nordic-muted cursor-pointer"
              >
                Explore Production Services
              </a>
            </div>
          </div>

          {/* Key Metric Highlights */}
          <div className="relative z-10 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl w-full border-t border-nordic-border pt-8 text-left">
            <div>
              <p className="text-3xl font-serif text-nordic-ink">8K RAW</p>
              <p className="text-xs text-nordic-subtle mt-0.5">RED & ARRI Capture</p>
            </div>
            <div>
              <p className="text-3xl font-serif text-nordic-ink">Davinci</p>
              <p className="text-xs text-nordic-subtle mt-0.5">ACES Color Pipeline</p>
            </div>
            <div>
              <p className="text-3xl font-serif text-nordic-ink">Spatial</p>
              <p className="text-xs text-nordic-subtle mt-0.5">Dolby Atmos Audio</p>
            </div>
            <div>
              <p className="text-3xl font-serif text-nordic-ink">Oslo & Arctic</p>
              <p className="text-xs text-nordic-subtle mt-0.5">Extreme Field Readiness</p>
            </div>
          </div>
        </section>

        {/* Dynamic Public Portfolio Strip */}
        {publicAlbums.length > 0 && (
          <section className="w-full rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <span className="text-xs font-mono uppercase tracking-widest text-nordic-subtle">
                Active Production Portfolios
              </span>
              <span className="text-xs text-nordic-faint font-mono">
                COMMERCIAL · BRAND · DOCUMENTARY
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {publicAlbums.map((album) => (
                <div
                  key={album.id}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-nordic-border bg-nordic-muted/40 text-center transition hover:border-nordic-clay/50 hover:bg-nordic-surface"
                >
                  <Building2 className="h-4 w-4 text-nordic-faint mb-1.5" />
                  <span className="text-xs font-medium text-nordic-ink truncate max-w-full">
                    {album.title}
                  </span>
                  <span className="text-[10px] font-mono text-nordic-subtle mt-0.5">
                    {album._count.items} Works
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Showreel Cinematic Feature Banner with interactive modal */}
        <ShowreelPlayer />

        {/* Core Production Capabilities Grid */}
        <section id="services" className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-clay">
              <Layers className="h-3.5 w-3.5" />
              <span>Full-Spectrum Production</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-nordic-ink">
              End-to-End Craft
            </h2>
            <p className="text-sm text-nordic-subtle leading-relaxed">
              From concept development and treatment pitch decks through extreme on-location principal photography to master finishing and digital distribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)] transition hover:border-nordic-clay/50">
              <div className="h-12 w-12 rounded-2xl bg-nordic-muted border border-nordic-border flex items-center justify-center text-nordic-clay mb-6">
                <Clapperboard className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif text-nordic-ink mb-2">Commercial Brand Films</h3>
              <p className="text-xs text-nordic-subtle leading-relaxed mb-6">
                High-concept short films and broadcast-ready advertisements crafted for Nordic architecture, mobility, and luxury goods brands.
              </p>
              <ul className="space-y-2 text-xs text-nordic-subtle border-t border-nordic-border/60 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Script & Treatment Writing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Storyboard & Shot Planning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Casting & Location Scouting</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)] transition hover:border-nordic-clay/50">
              <div className="h-12 w-12 rounded-2xl bg-nordic-muted border border-nordic-border flex items-center justify-center text-nordic-clay mb-6">
                <Tv className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif text-nordic-ink mb-2">Motion Graphics & 3D</h3>
              <p className="text-xs text-nordic-subtle leading-relaxed mb-6">
                Algorithmic simulations, typographic animation, and 3D architectural visualizations crafted in Houdini and Unreal Engine.
              </p>
              <ul className="space-y-2 text-xs text-nordic-subtle border-t border-nordic-border/60 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Procedural VFX & Physics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Unreal Engine Real-time Virtual Sets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Kinetic Identity Systems</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)] transition hover:border-nordic-clay/50">
              <div className="h-12 w-12 rounded-2xl bg-nordic-muted border border-nordic-border flex items-center justify-center text-nordic-clay mb-6">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-serif text-nordic-ink mb-2">Editorial Color & Sound</h3>
              <p className="text-xs text-nordic-subtle leading-relaxed mb-6">
                Precise color-science grading on reference displays and immersive bespoke sound design tuned for cinema and high-end digital.
              </p>
              <ul className="space-y-2 text-xs text-nordic-subtle border-t border-nordic-border/60 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>ACES / DaVinci Color Mastery</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Original Score Composition</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Dolby Atmos Spatial Mixing</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technical Specification Banner */}
        <section className="rounded-3xl border border-nordic-border bg-nordic-surface p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-clay">
                <Film className="h-3.5 w-3.5" />
                <span>Camera & Pipeline Infrastructure</span>
              </div>
              <h2 className="text-3xl font-serif text-nordic-ink">
                Extreme Climate & High-Fidelity Capture
              </h2>
              <p className="text-xs sm:text-sm text-nordic-subtle leading-relaxed">
                Our in-house package includes weather-sealed cinema rigs ready for sub-zero Arctic winds, heavy snowstorms, and deep fjord operations. Backed by high-speed dual-redundant NVMe storage arrays on site.
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 text-xs font-medium text-nordic-clay hover:underline"
                >
                  <span>Studio Hardware Operations</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-nordic-border bg-nordic-muted/40 p-6 space-y-4 text-xs font-mono">
              <div className="flex justify-between border-b border-nordic-border/60 pb-2">
                <span className="text-nordic-subtle">PRIMARY CAPTURE</span>
                <span className="text-nordic-ink font-medium">RED V-Raptor XL 8K VV / Sony FX9</span>
              </div>
              <div className="flex justify-between border-b border-nordic-border/60 pb-2">
                <span className="text-nordic-subtle">ANAMORPHIC GLASS</span>
                <span className="text-nordic-ink font-medium">Atlas Orion 2x Full Set (32, 40, 65, 100mm)</span>
              </div>
              <div className="flex justify-between border-b border-nordic-border/60 pb-2">
                <span className="text-nordic-subtle">STABILIZATION</span>
                <span className="text-nordic-ink font-medium">DJI Ronin 2 + Flowcine Black Arm</span>
              </div>
              <div className="flex justify-between border-b border-nordic-border/60 pb-2">
                <span className="text-nordic-subtle">AERIAL RECON</span>
                <span className="text-nordic-ink font-medium">DJI Inspire 3 (8K CinemaDNG)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-nordic-subtle">DELIVERY MASTERS</span>
                <span className="text-nordic-ink font-medium">ProRes 4444 XQ / DCP / Uncompressed TIFF</span>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="rounded-3xl border border-nordic-border bg-nordic-surface p-10 sm:p-16 text-center max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-nordic-ink">
            Initiate a Motion Commission
          </h2>
          <p className="text-sm sm:text-base text-nordic-subtle max-w-xl mx-auto leading-relaxed">
            Accepting commercial campaigns, documentary productions, and interactive installations for the 2026/2027 seasons across Scandinavia and Europe.
          </p>
          <div>
            <a
              href="mailto:productions@graywood.no"
              className="inline-flex items-center gap-2 rounded-xl bg-nordic-clay px-8 py-3.5 text-sm font-medium text-white transition hover:bg-nordic-clay/90 shadow-sm"
            >
              <span>Contact Productions Desk</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="text-xs font-mono text-nordic-faint">
            productions@graywood.no · Oslo, Norway
          </p>
        </section>
      </div>
    </main>
  );
}
