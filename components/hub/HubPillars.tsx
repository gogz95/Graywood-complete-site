"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Video,
  ArrowRight,
  Clock,
  Radio,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface HubPillarsProps {
  photoCount?: number;
  artistCount?: number;
  proofingCount?: number;
  photoTitle?: string;
  mediaTitle?: string;
  photographyDomain?: string;
  mediaDomain?: string;
}

export function HubPillars({
  photoCount = 0,
  artistCount = 0,
  proofingCount = 0,
  photoTitle = "Graywood Photography",
  mediaTitle = "Graywood Media",
  photographyDomain = "graywoodphotography.no",
  mediaDomain = "graywoodmedia.no",
}: HubPillarsProps) {
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("nb-NO", {
          timeZone: "Europe/Oslo",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col flex-1 w-full bg-nordic-canvas text-nordic-ink">
      {/* Ecosystem Telemetry Sub-header */}
      <section className="w-full border-b border-nordic-border bg-nordic-surface/80 backdrop-blur-md px-6 sm:px-10 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-mono text-nordic-subtle">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nordic-pine opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-nordic-pine" />
            </span>
            <span className="tracking-wider uppercase text-[11px] text-nordic-faint">Ecosystem Status:</span>
            <span className="font-semibold text-nordic-pine">All 3 Nodes Operational</span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono text-nordic-subtle">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-nordic-faint" />
              <span className="text-[11px] text-nordic-faint tracking-wider">OSLO (CET):</span>
              <span className="font-medium text-nordic-ink">
                {timeString ? `Kl. ${timeString}` : "Kl. --:--:--"}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-nordic-faint">
              <Radio className="h-3.5 w-3.5 text-nordic-clay" />
              <span className="text-[11px]">59.9139° N, 10.7522° E</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Headline — Scandinavian Editorial Typography */}
      <section className="relative px-6 pt-20 pb-14 sm:pt-28 sm:pb-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-nordic-border bg-nordic-surface px-4 py-1.5 text-xs text-nordic-subtle shadow-xs mb-8">
          <Sparkles className="h-3.5 w-3.5 text-nordic-clay" />
          <span className="font-mono text-[11px] tracking-widest uppercase">
            Graywood Unified Visual Platform
          </span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-nordic-ink leading-[1.08]">
          Two specialized studios. <br className="hidden sm:inline" />
          <span className="italic font-light">One coherent standard.</span>
        </h1>

        <p className="text-base sm:text-lg text-nordic-subtle mt-6 max-w-2xl mx-auto font-light leading-relaxed">
          Select an entity to explore our medium-format still archives, cinematic motion productions, or private client proofing vaults.
        </p>
      </section>

      {/* Main Dual-Pillar Interactive Section — White Floating Cards */}
      <section className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-6 sm:px-8 pb-24 gap-8">
        {/* ===================================================================
            LEFT PILLAR — Graywood Photography
            =================================================================== */}
        <div className="group relative flex-1 flex flex-col justify-between p-8 sm:p-12 rounded-3xl border border-nordic-border bg-nordic-surface shadow-[0_4px_30px_rgba(28,27,25,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_50px_rgba(28,27,25,0.08)] hover:border-nordic-divider">
          <div>
            {/* Top Category Label */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-nordic-border/60">
              <div className="flex items-center gap-2 text-nordic-pine text-xs font-mono uppercase tracking-widest">
                <Camera className="h-4 w-4 text-nordic-clay" />
                <span>Entity 01 · Still Imagery</span>
              </div>
              <span className="rounded-full border border-nordic-border bg-nordic-muted px-3 py-1 text-[11px] font-mono text-nordic-subtle">
                {photographyDomain}
              </span>
            </div>

            {/* Core Content */}
            <div className="space-y-4">
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-nordic-ink group-hover:text-nordic-pine transition-colors">
                {photoTitle}
              </h2>
              <p className="text-sm sm:text-base text-nordic-subtle font-light leading-relaxed">
                Nordic editorial commissions, architectural documentation, and commercial still photography. Engineered around Hasselblad medium-format precision and authentic atmospheric light.
              </p>

              {/* Feature Chips */}
              <div className="pt-4 flex flex-wrap gap-2 text-xs font-mono text-nordic-subtle">
                <span className="rounded-full bg-nordic-muted px-3.5 py-1.5 border border-nordic-border/70">
                  {photoCount > 0 ? `${photoCount} Curated Plates` : "Medium Format Archive"}
                </span>
                <span className="rounded-full bg-nordic-muted px-3.5 py-1.5 border border-nordic-border/70">
                  EXIF Telemetry Engine
                </span>
                <span className="rounded-full bg-nordic-muted px-3.5 py-1.5 border border-nordic-border/70">
                  {proofingCount > 0 ? `${proofingCount} Proofing Vaults` : "Client Proofing Vault"}
                </span>
                <span className="rounded-full bg-nordic-muted px-3.5 py-1.5 border border-nordic-border/70">
                  Fine Art Print Archive
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-10 border-t border-nordic-border/80 mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Link
              id="hub-link-photography"
              href="/photography"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-nordic-pine px-6 py-3.5 text-sm font-medium text-white shadow-xs hover:bg-[#1e2824] transition cursor-pointer"
            >
              <span>Enter Photography Studio</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/photography#contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-nordic-border bg-nordic-muted/50 px-4 py-3.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted hover:border-nordic-divider transition"
            >
              <span>Book Commission</span>
              <ExternalLink className="h-3.5 w-3.5 text-nordic-faint" />
            </Link>
          </div>
        </div>

        {/* ===================================================================
            RIGHT PILLAR — Graywood Media
            =================================================================== */}
        <div className="group relative flex-1 flex flex-col justify-between p-8 sm:p-12 rounded-3xl border border-nordic-border bg-nordic-surface shadow-[0_4px_30px_rgba(28,27,25,0.03)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_16px_50px_rgba(28,27,25,0.08)] hover:border-nordic-divider">
          <div>
            {/* Top Category Label */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-nordic-border/60">
              <div className="flex items-center gap-2 text-nordic-pine text-xs font-mono uppercase tracking-widest">
                <Video className="h-4 w-4 text-nordic-clay" />
                <span>Entity 02 · Motion & Sound</span>
              </div>
              <span className="rounded-full border border-nordic-border bg-nordic-muted px-3 py-1 text-[11px] font-mono text-nordic-subtle">
                {mediaDomain}
              </span>
            </div>

            {/* Core Content */}
            <div className="space-y-4">
              <h2 className="font-serif text-3xl sm:text-4xl font-normal text-nordic-ink group-hover:text-nordic-pine transition-colors">
                {mediaTitle}
              </h2>
              <p className="text-sm sm:text-base text-nordic-subtle font-light leading-relaxed">
                Creative motion collective specializing in high-impact brand films, 3D motion design, and spatial soundscapes. Built on ARRI cinema workflows, Unreal Engine 5.4, and DaVinci color mastering.
              </p>

              {/* Feature Chips */}
              <div className="pt-4 flex flex-wrap gap-2 text-xs font-mono text-nordic-subtle">
                <span className="rounded-full bg-nordic-muted px-3.5 py-1.5 border border-nordic-border/70">
                  ARRI Alexa Cinema Rig
                </span>
                <span className="rounded-full bg-nordic-muted px-3.5 py-1.5 border border-nordic-border/70">
                  Unreal 5 & Houdini 3D
                </span>
                <span className="rounded-full bg-nordic-muted px-3.5 py-1.5 border border-nordic-border/70">
                  Dolby Atmos Sound
                </span>
                <span className="rounded-full bg-nordic-muted px-3.5 py-1.5 border border-nordic-border/70">
                  {artistCount > 0 ? `${artistCount} Core Collaborators` : "Director Collective"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-10 border-t border-nordic-border/80 mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Link
              id="hub-link-media"
              href="/media"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-nordic-pine px-6 py-3.5 text-sm font-medium text-white shadow-xs hover:bg-[#1e2824] transition cursor-pointer"
            >
              <span>Enter Media Collective</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/media#showreel"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-nordic-border bg-nordic-muted/50 px-4 py-3.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted hover:border-nordic-divider transition"
            >
              <span>Watch 2026 Reel</span>
              <ExternalLink className="h-3.5 w-3.5 text-nordic-faint" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
