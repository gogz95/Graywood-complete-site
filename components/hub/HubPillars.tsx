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

export function HubPillars() {
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
    <div className="flex flex-col flex-1 w-full">
      {/* Ecosystem Telemetry Sub-header */}
      <section className="w-full border-b border-border/70 bg-surface/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-zinc-400">ECOSYSTEM STATUS:</span>
          <span className="font-semibold text-emerald-400">ALL 3 NODES ACTIVE</span>
        </div>

        <div className="flex items-center gap-6 text-xs font-mono text-muted">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span>OSLO (CET):</span>
            <span className="font-semibold text-foreground">
              {timeString ? `Kl. ${timeString}` : "Kl. --:--:--"}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <Radio className="h-3.5 w-3.5 text-blue-400" />
            <span>59.9139° N, 10.7522° E</span>
          </div>
        </div>
      </section>

      {/* Hero Headline */}
      <section className="relative px-6 pt-16 pb-12 sm:pt-20 sm:pb-16 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/30 px-4 py-1.5 text-xs text-blue-300 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-mono uppercase tracking-wider">
            Graywood Unified Creative Platform
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
          Two specialized studios. <br className="hidden sm:inline" />
          One coherent creative standard.
        </h1>
        <p className="text-base sm:text-lg text-muted mt-4 max-w-2xl mx-auto leading-relaxed">
          Select an entity to explore our medium-format still archives, cinematic motion productions, or client proofing portals.
        </p>
      </section>

      {/* Main Dual-Pillar Interactive Section */}
      <section className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 gap-8">
        {/* ===================================================================
            LEFT PILLAR — Graywood Photography
            =================================================================== */}
        <div className="group relative flex-1 flex flex-col justify-between p-8 sm:p-12 rounded-3xl border border-border bg-surface shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-amber-500/10 overflow-hidden">
          {/* Subtle Amber Ambient Glow */}
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-amber-500/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div>
            {/* Top Category Label */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-widest">
                <Camera className="h-4 w-4" />
                <span>Entity 01 · Still Imagery</span>
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-mono text-amber-300">
                graywoodphotography.no
              </span>
            </div>

            {/* Core Content */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                Graywood Photography
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Nordic editorial commissions, architectural documentation, and commercial still photography. Engineered around Hasselblad medium format sensors and bespoke atmospheric light grading.
              </p>

              {/* Feature Chips */}
              <div className="pt-4 flex flex-wrap gap-2 text-xs font-mono text-zinc-300">
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 border border-border">
                  100MP Medium Format
                </span>
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 border border-border">
                  EXIF Telemetry Engine
                </span>
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 border border-border">
                  Client Proofing Vault
                </span>
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 border border-border">
                  Fine Art Print Archive
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-10 border-t border-border/80 mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Link
              id="hub-link-photography"
              href="/photography"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition cursor-pointer"
            >
              <span>Enter Photography Studio</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/photography#contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-surface transition"
            >
              <span>Book Shoot</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted" />
            </Link>
          </div>
        </div>

        {/* ===================================================================
            RIGHT PILLAR — Graywood Media
            =================================================================== */}
        <div className="group relative flex-1 flex flex-col justify-between p-8 sm:p-12 rounded-3xl border border-border bg-surface shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1 hover:border-violet-500/60 hover:shadow-violet-500/10 overflow-hidden">
          {/* Subtle Violet Ambient Glow */}
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-violet-600/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div>
            {/* Top Category Label */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-violet-400 text-xs font-mono uppercase tracking-widest">
                <Video className="h-4 w-4" />
                <span>Entity 02 · Motion & Sound</span>
              </div>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-mono text-violet-300">
                graywoodmedia.no
              </span>
            </div>

            {/* Core Content */}
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white group-hover:text-violet-300 transition-colors">
                Graywood Media
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                Creative motion collective specializing in high-impact brand films, 3D motion design, and spatial soundscapes. Built with ARRI cinema workflows, Unreal Engine 5.4, and DaVinci color mastering.
              </p>

              {/* Feature Chips */}
              <div className="pt-4 flex flex-wrap gap-2 text-xs font-mono text-zinc-300">
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 border border-border">
                  ARRI Alexa Mini LF
                </span>
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 border border-border">
                  Unreal 5 & Houdini 3D
                </span>
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 border border-border">
                  Dolby Atmos Sound
                </span>
                <span className="rounded-lg bg-surface-2 px-3 py-1.5 border border-border">
                  Director Collective
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-10 border-t border-border/80 mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <Link
              id="hub-link-media"
              href="/media"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 hover:bg-violet-500 transition cursor-pointer"
            >
              <span>Enter Media Collective</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/media#showreel"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-surface transition"
            >
              <span>Watch Reel</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
