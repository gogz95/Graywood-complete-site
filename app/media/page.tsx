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
  const [artists, publicAlbums] = await Promise.all([
    prisma.artistProfile.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.album.findMany({
      where: { type: "PUBLIC_PORTFOLIO" },
      include: {
        _count: { select: { photos: true } },
      },
      take: 6,
    }),
  ]);

  return (
    <main className="w-full min-h-screen bg-nordic-canvas text-nordic-ink">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col space-y-16">
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
                className="inline-flex items-center gap-2 rounded-xl bg-nordic-clay px-6 py-3.5 text-sm font-medium text-white transition hover:bg-nordic-clay/90 shadow-sm cursor-pointer"
              >
                <MonitorPlay className="h-4 w-4" />
                Watch 2026 Showreel
              </a>
              <a
                href="#collective"
                className="inline-flex items-center gap-2 rounded-xl border border-nordic-border bg-nordic-surface px-6 py-3.5 text-sm font-medium text-nordic-ink transition hover:bg-nordic-muted cursor-pointer"
              >
                Meet the Collective
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Feature Highlights Banner */}
          <div className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full border-t border-nordic-border pt-8 text-left">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-nordic-muted p-2.5 border border-nordic-border">
                <Film className="h-4 w-4 text-nordic-clay" />
              </div>
              <div>
                <p className="text-xs font-semibold text-nordic-ink">ARRI Cinema Pipeline</p>
                <p className="text-xs text-nordic-subtle">Large format sensors with anamorphic glass and raw ProRes workflows.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-nordic-muted p-2.5 border border-nordic-border">
                <Tv className="h-4 w-4 text-nordic-clay" />
              </div>
              <div>
                <p className="text-xs font-semibold text-nordic-ink">Spatial Audio Mastering</p>
                <p className="text-xs text-nordic-subtle">Dolby Atmos downmixing and proprietary acoustic field captures.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-nordic-muted p-2.5 border border-nordic-border">
                <Award className="h-4 w-4 text-nordic-clay" />
              </div>
              <div>
                <p className="text-xs font-semibold text-nordic-ink">International Recognition</p>
                <p className="text-xs text-nordic-subtle">Selected at Nordic Creative Festivals, Cannes Lions, and EuroDocs.</p>
              </div>
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
                    {album._count.photos} Works
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Showreel Cinematic Feature Banner with interactive modal */}
        <ShowreelPlayer />

      {/* Member Spotlights (ArtistProfile Table) */}
      <section id="collective" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-nordic-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-clay mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Creative Leadership</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-nordic-ink">
              Member Spotlights
            </h2>
            <p className="text-sm text-nordic-subtle mt-1 max-w-md">
              Directors, cinematographers, and colorists operating collectively on international productions.
            </p>
          </div>
          <p className="text-xs text-nordic-faint font-mono mt-4 md:mt-0">
            {artists.length} CORE ARTISTS · AUTONOMOUS COLLABORATORS
          </p>
        </div>

        {artists.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-nordic-border p-16 text-center bg-nordic-surface/60">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nordic-muted border border-nordic-border mb-4 text-nordic-clay">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-base font-serif text-nordic-ink">No artists currently registered</h3>
            <p className="text-xs text-nordic-subtle max-w-sm mx-auto mt-1.5 leading-relaxed">
              No artist profiles currently registered in the collective. Create profiles in the operations portal.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {artists.map((artist: {
              id: string;
              name: string;
              slug: string;
              bio: string | null;
              avatarUrl: string | null;
              featured: boolean;
              sortOrder: number;
            }) => (
              <div
                key={artist.id}
                className="group rounded-3xl border border-nordic-border bg-nordic-surface p-7 shadow-[0_8px_30px_rgba(28,27,25,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-nordic-clay/60 hover:shadow-[0_16px_48px_rgba(28,27,25,0.08)] flex flex-col justify-between"
              >
                <div>
                  {/* Avatar / Portrait */}
                  <div className="relative mb-6 overflow-hidden rounded-2xl aspect-square bg-nordic-muted border border-nordic-border">
                    {artist.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={artist.avatarUrl}
                        alt={artist.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center bg-nordic-muted text-nordic-subtle">
                        <Video className="h-10 w-10 text-nordic-clay/60 mb-2" />
                        <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                          {artist.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                    )}
                    {artist.featured && (
                      <span className="absolute top-3 right-3 rounded-full bg-nordic-clay/95 backdrop-blur-md px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white border border-nordic-clay/40">
                        Lead Director
                      </span>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-zinc-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                      <span>NORDIC REGION</span>
                      <span>ACTIVE</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-serif text-nordic-ink group-hover:text-nordic-clay transition-colors">
                    {artist.name}
                  </h3>
                  <p className="text-xs font-mono text-nordic-clay mt-0.5">
                    @{artist.slug}
                  </p>

                  <p className="text-sm text-nordic-subtle mt-3 leading-relaxed">
                    {artist.bio || "Creative collaborator and director at Graywood Media Collective."}
                  </p>
                </div>

                <div className="pt-6 border-t border-nordic-border mt-6 flex items-center justify-between text-xs">
                  <span className="text-nordic-subtle flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-nordic-pine" />
                    Available for Commissions
                  </span>
                  <Link
                    href="/photography#contact"
                    className="font-medium text-nordic-clay hover:underline flex items-center gap-1"
                  >
                    Book Artist &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Collective Disciplines Grid */}
      <section id="capabilities" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-nordic-border">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-clay mb-2">
            <Layers className="h-3.5 w-3.5" />
            <span>Integrated Workflows</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-nordic-ink">
            Studio Disciplines & Capabilities
          </h2>
          <p className="text-sm text-nordic-subtle mt-2 leading-relaxed">
            End-to-end production pipelines engineered for cinematic impact, from initial storyboard treatments to master theatrical delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-7 hover:border-nordic-clay/50 transition shadow-[0_4px_20px_rgba(28,27,25,0.03)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nordic-muted border border-nordic-border text-nordic-clay mb-5">
              <Film className="h-6 w-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-nordic-ink">Commercial Films</h3>
            <p className="text-xs text-nordic-subtle mt-2 leading-relaxed">
              Scriptwriting, Arctic location scouting, large-format cinema cameras, and narrative pacing for brand identities.
            </p>
            <div className="mt-4 pt-4 border-t border-nordic-border text-[10px] font-mono text-nordic-faint">
              ARRI ALEXA MINI LF · COOKE S4/I
            </div>
          </div>

          <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-7 hover:border-nordic-clay/50 transition shadow-[0_4px_20px_rgba(28,27,25,0.03)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nordic-muted border border-nordic-border text-nordic-clay mb-5">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-nordic-ink">Motion Graphics & 3D</h3>
            <p className="text-xs text-nordic-subtle mt-2 leading-relaxed">
              Procedural visual design, title sequences, 3D product simulation, photorealistic digital artifacts.
            </p>
            <div className="mt-4 pt-4 border-t border-nordic-border text-[10px] font-mono text-nordic-faint">
              UNREAL ENGINE 5.4 · HOUDINI
            </div>
          </div>

          <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-7 hover:border-nordic-clay/50 transition shadow-[0_4px_20px_rgba(28,27,25,0.03)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nordic-muted border border-nordic-border text-nordic-clay mb-5">
              <Clapperboard className="h-6 w-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-nordic-ink">Color Grading & Post</h3>
            <p className="text-xs text-nordic-subtle mt-2 leading-relaxed">
              DaVinci Resolve Studio color grading, calibrated mastering, spatial sound effects, and DCP delivery encoding.
            </p>
            <div className="mt-4 pt-4 border-t border-nordic-border text-[10px] font-mono text-nordic-faint">
              ACES 1.3 · PRORES 4444 XQ
            </div>
          </div>

          <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-7 hover:border-nordic-clay/50 transition shadow-[0_4px_20px_rgba(28,27,25,0.03)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-nordic-muted border border-nordic-border text-nordic-clay mb-5">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-base font-serif font-bold text-nordic-ink">Remote Live Monitoring</h3>
            <p className="text-xs text-nordic-subtle mt-2 leading-relaxed">
              Encrypted ultra-low latency wireless video feeds for remote client agency supervision anywhere worldwide.
            </p>
            <div className="mt-4 pt-4 border-t border-nordic-border text-[10px] font-mono text-nordic-faint">
              TERADEK BOLT 4K · LIVE SRT PROXIES
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="mt-16 rounded-3xl border border-nordic-border bg-nordic-surface p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(28,27,25,0.06)]">
          <div>
            <h3 className="text-2xl font-serif text-nordic-ink">Have a production in mind?</h3>
            <p className="text-sm text-nordic-subtle mt-1 max-w-lg">
              Let&apos;s assemble the right directors, cinematographers, and post-production artists for your next campaign.
            </p>
          </div>
          <Link
            href="/photography#contact"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-nordic-clay px-7 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-nordic-clay/90 transition cursor-pointer"
          >
            <span>Start a Production Inquiry</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      </div>
    </main>
  );
}
