"use client";

import React, { useState, useEffect } from "react";
import {
  MonitorPlay,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Sparkles,
} from "lucide-react";

export function ShowreelPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(35);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === " " && isOpen) {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Simulate video playback progress
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
    }, 200);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  return (
    <>
      {/* Trigger Banner (Matches #showreel in media page) */}
      <section id="showreel" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div
          onClick={() => {
            setIsOpen(true);
            setIsPlaying(true);
          }}
          className="relative aspect-video w-full rounded-3xl overflow-hidden border border-border bg-surface-2 shadow-2xl group flex items-center justify-center cursor-pointer"
        >
          {/* Visual gradient backdrop simulating cinema lighting */}
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-violet-950/40 to-zinc-900 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)]" />

          {/* Film Grain & Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

          {/* Corner Framing Marks */}
          <div className="absolute top-6 left-6 font-mono text-[10px] text-violet-400/80 pointer-events-none">
            REC ● 00:01:24:12
          </div>
          <div className="absolute top-6 right-6 font-mono text-[10px] text-zinc-400 pointer-events-none">
            PRORES 4444 XQ · 24.000 FPS
          </div>
          <div className="absolute bottom-6 left-6 font-mono text-[10px] text-zinc-400 pointer-events-none">
            COLOR: ARRI LOG-C3 / BESPOKE LUT
          </div>
          <div className="absolute bottom-6 right-6 font-mono text-[10px] text-violet-400 pointer-events-none">
            4K DCI · 2.39:1 CINEMASCOPE
          </div>

          <div className="relative z-10 flex flex-col items-center gap-5 text-center p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-600/90 text-white shadow-2xl shadow-violet-600/50 backdrop-blur-md transition-all duration-300 group-hover:scale-115 group-hover:bg-violet-500">
              <MonitorPlay className="h-8 w-8 translate-x-0.5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-950/60 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-violet-300">
                <Sparkles className="h-3 w-3" />
                <span>Official Showreel · 2026 Edition</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                Visual Cadence 2026
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                Click to launch high-fidelity 4K stream with directional sound design and original score.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cinematic Modal Player */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-8 animate-fade-in">
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-6 right-6 z-50 rounded-full bg-zinc-900/80 p-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Close Showreel"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col">
            {/* Simulated Video Display Canvas */}
            <div className="relative aspect-video w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              {/* Animated Cinematic Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-tr from-violet-950 via-zinc-900 to-indigo-950 transition-opacity duration-1000 ${
                  isPlaying ? "opacity-100" : "opacity-60"
                }`}
              />

              {/* Viewfinder crosshairs & timecode */}
              <div className="absolute inset-8 pointer-events-none flex flex-col justify-between text-zinc-500 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-violet-400 flex items-center gap-1.5 font-bold">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    LIVE 4K PLAYBACK
                  </span>
                  <span>TIME: {Math.floor((progress / 100) * 90)}s / 90s</span>
                </div>

                <div className="flex justify-center items-center">
                  <div className="h-12 w-12 border border-white/20 rounded-full flex items-center justify-center">
                    <div className="h-2 w-2 bg-white/40 rounded-full" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px]">
                  <span>GRAYWOOD MEDIA // MASTER_V04.MOV</span>
                  <span>DOLBY 5.1 STEREO DOWNMIX</span>
                </div>
              </div>

              {/* Center Play/Pause button indicator */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="relative z-20 flex h-20 w-20 items-center justify-center rounded-full bg-violet-600/80 text-white backdrop-blur-md transition hover:scale-110 hover:bg-violet-600"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 translate-x-0.5" />
                )}
              </button>
            </div>

            {/* Video Controls Bar */}
            <div className="bg-zinc-900/90 border-t border-zinc-800 p-4 flex flex-col gap-3">
              {/* Progress Scrubber */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickPos = (e.clientX - rect.left) / rect.width;
                  setProgress(clickPos * 100);
                }}
                className="relative h-1.5 w-full bg-zinc-800 rounded-full cursor-pointer overflow-hidden group"
              >
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="hover:text-white transition"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="hover:text-white transition"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <span className="text-zinc-300 font-sans font-medium">
                    Visual Cadence · Official 2026 Showreel
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="rounded bg-violet-950 px-2 py-0.5 text-violet-300 border border-violet-800/50">
                    4K UHD
                  </span>
                  <button
                    onClick={() => {
                      if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen?.();
                      } else {
                        document.exitFullscreen?.();
                      }
                    }}
                    className="hover:text-white transition"
                    aria-label="Fullscreen"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
