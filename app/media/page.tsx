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

const PRESTIGE_CLIENTS = [
  { name: "Snøhetta Architects", sector: "Spatial & Architecture" },
  { name: "Munch Museum Oslo", sector: "Fine Arts & Cultural" },
  { name: "Polestar Nordic", sector: "Automotive & Electric" },
  { name: "Oslo Runway", sector: "Fashion & Couture" },
  { name: "Vipp Living", sector: "Scandinavian Design" },
  { name: "Equinor Future", sector: "Renewable Energy" },
];

export default async function MediaPage() {
  const artists = await prisma.artistProfile.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cinematic Hero */}
      <section className="relative w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center border-b border-border overflow-hidden">
        {/* Violet ambient glow for MEDIA theme */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-4 py-1.5 text-xs text-zinc-300">
            <Video className="h-3.5 w-3.5 text-violet-400" />
            <span className="font-mono uppercase tracking-widest text-violet-300">
              Nordic Motion Collective
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            Motion, sound, and story in harmonious tension.
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Graywood Media is a collaborative studio crafting commercial brand films, high-end motion design, and immersive digital artifacts for visionary brands across Northern Europe.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#showreel"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700 shadow-xl shadow-violet-600/25"
            >
              <MonitorPlay className="h-4 w-4" />
              Watch 2026 Showreel
            </a>
            <a
              href="#collective"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3.5 text-sm font-semibold text-foreground transition hover:bg-surface-2"
            >
              Meet the Collective
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full border-t border-border/60 pt-8 text-left">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-surface-2 p-2.5 border border-border">
              <Film className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">ARRI Cinema Pipeline</p>
              <p className="text-xs text-muted">Large format sensors with anamorphic glass and raw ProRes workflows.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-surface-2 p-2.5 border border-border">
              <Tv className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Spatial Audio Mastering</p>
              <p className="text-xs text-muted">Dolby Atmos downmixing and proprietary acoustic field captures.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-surface-2 p-2.5 border border-border">
              <Award className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">International Recognition</p>
              <p className="text-xs text-muted">Selected at Nordic Creative Festivals, Cannes Lions, and EuroDocs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Prestige Client Showcase Strip */}
      <section className="w-full border-b border-border/80 bg-surface-2/40 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              Trusted by Nordic Industry Leaders
            </span>
            <span className="text-xs text-muted font-mono">
              COMMERCIAL · BRAND · DOCUMENTARY
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRESTIGE_CLIENTS.map((client) => (
              <div
                key={client.name}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-border/60 bg-surface/60 text-center transition hover:border-violet-500/50 hover:bg-surface"
              >
                <Building2 className="h-4 w-4 text-zinc-400 mb-1.5" />
                <span className="text-xs font-semibold text-zinc-200">
                  {client.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {client.sector}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showreel Cinematic Feature Banner with interactive modal */}
      <ShowreelPlayer />

      {/* Member Spotlights (ArtistProfile Table) */}
      <section id="collective" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-violet-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Creative Leadership</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Member Spotlights
            </h2>
            <p className="text-sm text-muted mt-1 max-w-md">
              Directors, cinematographers, and colorists operating collectively on international productions.
            </p>
          </div>
          <p className="text-xs text-muted font-mono mt-4 md:mt-0">
            {artists.length} CORE ARTISTS · AUTONOMOUS COLLABORATORS
          </p>
        </div>

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
              className="group rounded-3xl border border-border bg-surface p-7 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-500/10 flex flex-col justify-between"
            >
              <div>
                {/* Avatar / Portrait */}
                <div className="relative mb-6 overflow-hidden rounded-2xl aspect-square bg-surface-2 border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      artist.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop"
                    }
                    alt={artist.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {artist.featured && (
                    <span className="absolute top-3 right-3 rounded-full bg-violet-600/90 backdrop-blur-md px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white border border-violet-400/40">
                      Lead Director
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-zinc-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10">
                    <span>OSLO / COPENHAGEN</span>
                    <span>2026 ACTIVE</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-foreground group-hover:text-violet-300 transition-colors">
                  {artist.name}
                </h3>
                <p className="text-xs font-mono text-violet-400 mt-0.5">
                  @{artist.slug}
                </p>

                <p className="text-sm text-muted mt-3 leading-relaxed">
                  {artist.bio || "Creative collaborator and director at Graywood Media Collective."}
                </p>
              </div>

              <div className="pt-6 border-t border-border/80 mt-6 flex items-center justify-between text-xs">
                <span className="text-muted flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  Available for Commissions
                </span>
                <Link
                  href="/photography#contact"
                  className="font-semibold text-violet-400 group-hover:underline flex items-center gap-1"
                >
                  Book Artist &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collective Disciplines Grid */}
      <section id="capabilities" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-violet-400 mb-2">
            <Layers className="h-3.5 w-3.5" />
            <span>Integrated Workflows</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Studio Disciplines & Capabilities
          </h2>
          <p className="text-sm text-muted mt-2 leading-relaxed">
            End-to-end production pipelines engineered for cinematic impact, from initial storyboard treatments to master theatrical delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-border bg-surface p-7 hover:border-violet-500/50 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 border border-border text-violet-400 mb-5">
              <Film className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Commercial Films</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Scriptwriting, Arctic location scouting, large-format cinema cameras, and narrative pacing for brand identities.
            </p>
            <div className="mt-4 pt-4 border-t border-border/60 text-[10px] font-mono text-zinc-400">
              ARRI ALEXA MINI LF · COOKE S4/I
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-7 hover:border-violet-500/50 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 border border-border text-violet-400 mb-5">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Motion Graphics & 3D</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Procedural visual design, title sequences, 3D product simulation, photorealistic digital artifacts.
            </p>
            <div className="mt-4 pt-4 border-t border-border/60 text-[10px] font-mono text-zinc-400">
              UNREAL ENGINE 5.4 · HOUDINI
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-7 hover:border-violet-500/50 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 border border-border text-violet-400 mb-5">
              <Clapperboard className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Color Grading & Post</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              DaVinci Resolve Studio color grading, calibrated mastering, spatial sound effects, and DCP delivery encoding.
            </p>
            <div className="mt-4 pt-4 border-t border-border/60 text-[10px] font-mono text-zinc-400">
              ACES 1.3 · PRORES 4444 XQ
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-7 hover:border-violet-500/50 transition">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 border border-border text-violet-400 mb-5">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Remote Live Monitoring</h3>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Encrypted ultra-low latency wireless video feeds for remote client agency supervision anywhere worldwide.
            </p>
            <div className="mt-4 pt-4 border-t border-border/60 text-[10px] font-mono text-zinc-400">
              TERADEK BOLT 4K · LIVE SRT PROXIES
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <div className="mt-16 rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/50 via-zinc-900 to-violet-950/30 p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div>
            <h3 className="text-2xl font-bold text-white">Have a production in mind?</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-lg">
              Let&apos;s assemble the right directors, cinematographers, and post-production artists for your next campaign.
            </p>
          </div>
          <Link
            href="/photography#contact"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 hover:bg-violet-700 transition cursor-pointer"
          >
            <span>Start a Production Inquiry</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
