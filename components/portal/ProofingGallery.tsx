"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { lockAlbumSession } from "@/app/actions/portal";
import { Lightbox, type GalleryAsset } from "@/components/photography/Lightbox";
import {
  Download,
  Lock,
  Heart,
  Check,
  Maximize2,
  Camera,
  Layers,
  Sparkles,
} from "lucide-react";

interface ProofingGalleryProps {
  album: {
    id: string;
    slug: string;
    title: string;
    allowDownload: boolean;
  };
  assets: GalleryAsset[];
}

export function ProofingGallery({ album, assets }: ProofingGalleryProps) {
  const router = useRouter();
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLocking, setIsLocking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const toggleFavorite = (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  const handleLock = async () => {
    setIsLocking(true);
    try {
      await lockAlbumSession(album.slug);
      router.refresh();
    } catch (err: unknown) {
      console.error("Lock error:", err);
    } finally {
      setIsLocking(false);
    }
  };

  const handleDownloadAll = () => {
    setIsDownloading(true);
    const link = document.createElement("a");
    link.href = `/api/portal/${album.slug}/download`;
    link.setAttribute("download", `${album.slug}-gallery.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Proofing Album Header Banner */}
      <div className="rounded-3xl border border-border bg-surface p-8 sm:p-12 mb-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-amber-400 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Client Proofing Vault · Private Session</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              {album.title}
            </h1>
            <p className="text-sm text-muted mt-2 max-w-xl">
              High-resolution digital master proofs. Inspect camera telemetry, mark selections for final color delivery, or export the complete archive.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-4 text-xs font-mono text-zinc-300">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 border border-border px-3 py-1">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                {assets.length} Master Proofs
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-amber-300">
                <Heart className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                {favorites.size} Selected for Retouching
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {album.allowDownload && (
              <button
                id="portal-download-all-btn"
                onClick={handleDownloadAll}
                disabled={isDownloading || assets.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-xs font-semibold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 transition cursor-pointer disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isDownloading ? "Preparing Stream..." : "Download All (ZIP)"}</span>
              </button>
            )}

            <button
              id="portal-lock-btn"
              onClick={handleLock}
              disabled={isLocking}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-surface transition cursor-pointer"
              title="Lock this gallery and destroy private session"
            >
              <Lock className="h-3.5 w-3.5 text-zinc-400" />
              <span>Lock Gallery</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      {assets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-16 text-center bg-surface/40">
          <Camera className="h-10 w-10 text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No assets in this proofing album</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Media files attached to this album will appear here once linked by the studio.
          </p>
        </div>
      ) : (
        /* Masonry Grid */
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {assets.map((asset, index) => {
            const aspect =
              asset.width && asset.height
                ? (asset.height / asset.width) * 100
                : 75;

            const isFavorite = favorites.has(asset.id);

            return (
              <div
                key={asset.id}
                onClick={() => setActiveLightboxIndex(index)}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-surface shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl break-inside-avoid ${
                  isFavorite
                    ? "border-amber-500 shadow-amber-500/10 ring-2 ring-amber-500/20"
                    : "border-border hover:border-amber-500/60"
                }`}
              >
                {/* Image Container with Aspect Ratio */}
                <div
                  className="relative w-full bg-surface-2 overflow-hidden"
                  style={{ paddingBottom: `${Math.min(aspect, 133)}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/media/${asset.id}?size=preview`}
                    alt={asset.fileName}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Favorite / Selection Action Button */}
                  <button
                    onClick={(e) => toggleFavorite(asset.id, e)}
                    className={`absolute top-3 right-3 z-20 rounded-full p-2.5 backdrop-blur-md transition-transform duration-200 cursor-pointer ${
                      isFavorite
                        ? "bg-amber-500 text-black scale-110 shadow-lg"
                        : "bg-black/60 text-white/80 hover:scale-110 hover:text-white border border-white/10"
                    }`}
                    aria-label={isFavorite ? "Remove selection" : "Select for retouches"}
                  >
                    {isFavorite ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <Heart className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Image Metadata Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-5 text-white pointer-events-none">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1 pr-2">
                        <p className="text-sm font-bold text-zinc-100 line-clamp-1">
                          {asset.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")}
                        </p>
                        <p className="text-xs font-mono text-amber-400">
                          {asset.cameraModel || "Master Proof"}
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-zinc-400">
                          {asset.focalLength && <span>{asset.focalLength}</span>}
                          {asset.aperture && <span>· {asset.aperture}</span>}
                          {asset.shutterSpeed && <span>· {asset.shutterSpeed}</span>}
                          {asset.iso && <span>· ISO {asset.iso}</span>}
                        </div>
                      </div>

                      <div className="rounded-xl bg-amber-500/90 p-2 text-black shadow-lg backdrop-blur-sm shrink-0">
                        <Maximize2 className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && (
        <Lightbox
          assets={assets}
          currentIndex={activeLightboxIndex}
          onClose={() => setActiveLightboxIndex(null)}
          onSelectIndex={(idx) => setActiveLightboxIndex(idx)}
        />
      )}
    </div>
  );
}
