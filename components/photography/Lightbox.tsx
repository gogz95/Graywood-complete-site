"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Camera,
  Calendar,
  Layers,
  Download,
  Check,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Grid3X3,
  Maximize,
  Minimize,
} from "lucide-react";

export interface GalleryAsset {
  id: string;
  filePath: string;
  fileName: string;
  width: number | null;
  height: number | null;
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: number | null;
  capturedAt: string | null;
}

interface LightboxProps {
  assets: GalleryAsset[];
  currentIndex: number;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
}

export function Lightbox({
  assets,
  currentIndex,
  onClose,
  onSelectIndex,
}: LightboxProps) {
  const [showExif, setShowExif] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pan offset when zoomed
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);

  const currentAsset = assets[currentIndex];

  const handleNext = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    if (currentIndex < assets.length - 1) {
      onSelectIndex(currentIndex + 1);
    } else {
      onSelectIndex(0); // loop around
    }
  }, [currentIndex, assets.length, onSelectIndex]);

  const handlePrev = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    if (currentIndex > 0) {
      onSelectIndex(currentIndex - 1);
    } else {
      onSelectIndex(assets.length - 1); // loop around
    }
  }, [currentIndex, assets.length, onSelectIndex]);

  // Slideshow auto-advance timer (4 seconds)
  useEffect(() => {
    if (!isSlideshow) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4000);
    return () => clearInterval(timer);
  }, [isSlideshow, handleNext]);

  // Auto-scroll active filmstrip thumbnail into center view
  useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentIndex]);

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    } catch {
      // Non-fatal if browser blocks fullscreen
    }
  };

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.target as HTMLElement)?.tagName === "INPUT" ||
        (e.target as HTMLElement)?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "i" || e.key === "I") setShowExif((prev) => !prev);
      if (e.key === "g" || e.key === "G") setShowGrid((prev) => !prev);
      if (e.key === "f" || e.key === "F") toggleFullscreen();
      if (e.key === " ") {
        e.preventDefault();
        setIsSlideshow((prev) => !prev);
      }
      if (e.key === "+" || e.key === "=") {
        setZoomLevel((prev) => Math.min(prev + 0.5, 3));
      }
      if (e.key === "-") {
        setZoomLevel((prev) => {
          const next = Math.max(prev - 0.5, 1);
          if (next === 1) setPanPosition({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === "0") {
        setZoomLevel(1);
        setPanPosition({ x: 0, y: 0 });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  // Global mouseup & touchend listener to prevent sticky drag state
  useEffect(() => {
    const handleGlobalRelease = () => {
      setIsDragging(false);
    };
    window.addEventListener("mouseup", handleGlobalRelease);
    window.addEventListener("touchend", handleGlobalRelease);
    return () => {
      window.removeEventListener("mouseup", handleGlobalRelease);
      window.removeEventListener("touchend", handleGlobalRelease);
    };
  }, []);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          // Clipboard write denied
        });
    }
  };

  // Drag-to-pan handlers when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panPosition.x,
      y: e.clientY - panPosition.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile swipe (when unzoomed) and pan (when zoomed)
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX - panPosition.x,
        y: touch.clientY - panPosition.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    if (zoomLevel > 1 && isDragging) {
      setPanPosition({
        x: touch.clientX - dragStartRef.current.x,
        y: touch.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    if (zoomLevel <= 1 && e.changedTouches[0]) {
      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
      // Horizontal swipe threshold: 50px, with horizontal movement > vertical movement
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX > 0) {
          handlePrev();
        } else {
          handleNext();
        }
      }
    }
  };

  const handleDoubleClick = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  };

  if (!currentAsset) return null;

  const formattedDate = currentAsset.capturedAt
    ? new Date(currentAsset.capturedAt).toLocaleDateString("no-NO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-2xl animate-fade-in select-none"
      onMouseUp={handleMouseUp}
    >
      {/* Top Toolbar */}
      <div className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/95 via-black/80 to-transparent z-30">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono tracking-widest text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
            ASSET {currentIndex + 1} OF {assets.length}
          </span>
          <span className="hidden sm:inline text-xs text-zinc-300 font-mono">
            {currentAsset.fileName}
          </span>
          {isSlideshow && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>SLIDESHOW ACTIVE (4s)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center rounded-full bg-surface-2/80 border border-border p-0.5">
            <button
              onClick={() =>
                setZoomLevel((prev) => {
                  const next = Math.max(prev - 0.5, 1);
                  if (next === 1) setPanPosition({ x: 0, y: 0 });
                  return next;
                })
              }
              disabled={zoomLevel <= 1}
              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 transition"
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-mono text-zinc-300 px-1.5 min-w-[3rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(prev + 0.5, 3))}
              disabled={zoomLevel >= 3}
              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 transition"
              aria-label="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanPosition({ x: 0, y: 0 });
                }}
                className="p-1.5 text-amber-400 hover:text-amber-300 transition"
                aria-label="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Composition Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Rule-of-Thirds Grid (G)"
            className={`p-2 rounded-full border transition ${
              showGrid
                ? "bg-amber-500 text-black border-amber-400"
                : "bg-surface-2/80 text-zinc-400 border-border hover:text-white"
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>

          {/* Slideshow Play/Pause */}
          <button
            onClick={() => setIsSlideshow(!isSlideshow)}
            title="Autoplay Slideshow (Space)"
            className={`p-2 rounded-full border transition ${
              isSlideshow
                ? "bg-emerald-500 text-black border-emerald-400"
                : "bg-surface-2/80 text-zinc-400 border-border hover:text-white"
            }`}
          >
            {isSlideshow ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5 translate-x-0.5" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
            className="p-2 rounded-full border border-border bg-surface-2/80 text-zinc-400 hover:text-white transition"
          >
            {isFullscreen ? (
              <Minimize className="h-3.5 w-3.5" />
            ) : (
              <Maximize className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Copy / Share */}
          <button
            onClick={handleShare}
            aria-label="Share image"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition border border-border bg-surface-2/80 text-zinc-300 hover:bg-surface-2 hover:text-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          {/* Download Preview */}
          <a
            href={`/api/media/${currentAsset.id}?size=preview`}
            download={currentAsset.fileName}
            aria-label="Download preview"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition border border-border bg-surface-2/80 text-zinc-300 hover:bg-surface-2 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* EXIF HUD Toggle Button */}
          <button
            id="lightbox-toggle-exif"
            onClick={() => setShowExif(!showExif)}
            aria-label="Toggle EXIF details"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition border ${
              showExif
                ? "bg-amber-500 text-black font-semibold border-amber-400 shadow-lg shadow-amber-500/20"
                : "bg-surface-2/80 text-zinc-300 border-border hover:bg-surface-2 hover:text-white"
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>EXIF HUD</span>
          </button>

          {/* Close button */}
          <button
            id="lightbox-close"
            onClick={onClose}
            aria-label="Close lightbox"
            className="rounded-full bg-surface-2/80 p-2 text-zinc-300 border border-border hover:bg-surface-2 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Image Area with Viewfinder & Zoom Pan Canvas */}
      <div
        className="relative flex-1 w-full max-w-7xl flex items-center justify-center px-4 py-2 overflow-hidden touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows */}
        {assets.length > 1 && (
          <>
            <button
              id="lightbox-prev"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-6 z-20 rounded-full bg-surface-2/80 p-3.5 text-white border border-border/80 backdrop-blur-md hover:bg-surface-2 transition hover:scale-110 shadow-2xl"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              id="lightbox-next"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-6 z-20 rounded-full bg-surface-2/80 p-3.5 text-white border border-border/80 backdrop-blur-md hover:bg-surface-2 transition hover:scale-110 shadow-2xl"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Framing Box with Corner Viewfinder Brackets */}
        <div
          className={`relative max-h-[72vh] max-w-[85vw] flex items-center justify-center transition-all ${
            zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
          }`}
          onDoubleClick={handleDoubleClick}
        >
          {/* Viewfinder corner brackets */}
          <div className="absolute -top-3 -left-3 h-6 w-6 border-t-2 border-l-2 border-amber-400/80 pointer-events-none z-20" />
          <div className="absolute -top-3 -right-3 h-6 w-6 border-t-2 border-r-2 border-amber-400/80 pointer-events-none z-20" />
          <div className="absolute -bottom-3 -left-3 h-6 w-6 border-b-2 border-l-2 border-amber-400/80 pointer-events-none z-20" />
          <div className="absolute -bottom-3 -right-3 h-6 w-6 border-b-2 border-r-2 border-amber-400/80 pointer-events-none z-20" />

          {/* Rule-of-Thirds Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-3 grid-rows-3 border border-amber-400/30">
              <div className="border-r border-b border-amber-400/20" />
              <div className="border-r border-b border-amber-400/20" />
              <div className="border-b border-amber-400/20" />
              <div className="border-r border-b border-amber-400/20" />
              <div className="border-r border-b border-amber-400/20" />
              <div className="border-b border-amber-400/20" />
              <div className="border-r border-amber-400/20" />
              <div className="border-r border-amber-400/20" />
              <div />
            </div>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={currentAsset.id}
            src={`/api/media/${currentAsset.id}?size=preview`}
            alt={currentAsset.fileName}
            style={{
              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
              transition: isDragging ? "none" : "transform 200ms ease-out",
            }}
            className="max-h-[70vh] max-w-[82vw] object-contain rounded shadow-2xl pointer-events-none select-none"
          />

          {/* EXIF Data HUD Overlay */}
          {showExif && (
            <aside
              id="lightbox-exif-hud"
              className="absolute bottom-4 right-4 z-30 w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-border/90 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-2xl animate-fade-in text-left text-zinc-100"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-amber-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
                    Optics & Exposure HUD
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  RAW METRICS
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {currentAsset.cameraModel && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono block">
                      Camera Sensor
                    </span>
                    <span className="font-medium text-zinc-200">
                      {currentAsset.cameraModel}
                    </span>
                  </div>
                )}

                {currentAsset.lensModel && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono block">
                      Optics Rig
                    </span>
                    <span className="font-medium text-zinc-300">
                      {currentAsset.lensModel}
                    </span>
                  </div>
                )}

                {/* Exposure telemetry grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg bg-surface-2/70 p-2 border border-border/50">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Focal</span>
                    <span className="font-mono text-zinc-200 font-semibold">
                      {currentAsset.focalLength || "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface-2/70 p-2 border border-border/50">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Aperture</span>
                    <span className="font-mono text-zinc-200 font-semibold">
                      {currentAsset.aperture || "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface-2/70 p-2 border border-border/50">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Shutter</span>
                    <span className="font-mono text-zinc-200 font-semibold">
                      {currentAsset.shutterSpeed || "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-surface-2/70 p-2 border border-border/50">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono">Sensitivity</span>
                    <span className="font-mono text-zinc-200 font-semibold">
                      {currentAsset.iso ? `ISO ${currentAsset.iso}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Dimensions & Capture Date */}
                <div className="pt-2 border-t border-border/60 flex flex-col gap-1 text-[11px] text-zinc-400">
                  {currentAsset.width && currentAsset.height && (
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3 text-zinc-500" />
                      <span>
                        {currentAsset.width} × {currentAsset.height} px
                      </span>
                    </div>
                  )}
                  {formattedDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3 text-zinc-500" />
                      <span>{formattedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Bottom Filmstrip Carousel */}
      <div className="w-full bg-gradient-to-t from-black/95 via-black/85 to-transparent pt-3 pb-5 px-6 z-30">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-2.5">
          {/* Filmstrip thumbnails */}
          <div className="flex items-center gap-2.5 overflow-x-auto max-w-full px-2 py-1.5 scrollbar-none">
            {assets.map((thumb, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={thumb.id}
                  ref={isActive ? activeThumbRef : null}
                  onClick={() => {
                    setZoomLevel(1);
                    setPanPosition({ x: 0, y: 0 });
                    onSelectIndex(idx);
                  }}
                  className={`relative shrink-0 h-12 w-16 rounded-lg overflow-hidden transition-all duration-200 border cursor-pointer ${
                    isActive
                      ? "ring-2 ring-amber-400 border-amber-400 scale-105 shadow-lg shadow-amber-500/25"
                      : "opacity-40 hover:opacity-100 border-zinc-700 hover:border-zinc-500"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/media/${thumb.id}?size=thumb`}
                    alt={thumb.fileName}
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-5 text-[10px] font-mono text-zinc-500">
            <span>[← / → Navigate]</span>
            <span>[Space Slideshow]</span>
            <span>[Double-click / + - Zoom]</span>
            <span>[G Rule-of-Thirds]</span>
            <span>[F Fullscreen]</span>
            <span>[I EXIF HUD]</span>
            <span>[ESC Close]</span>
          </div>
        </div>
      </div>
    </div>
  );
}
