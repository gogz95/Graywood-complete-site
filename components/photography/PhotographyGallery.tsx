"use client";

import React, { useState, useMemo } from "react";
import { Lightbox, type GalleryAsset } from "./Lightbox";
import {
  Maximize2,
  SlidersHorizontal,
  Search,
  Sparkles,
  Layers,
  X,
} from "lucide-react";

interface PhotographyGalleryProps {
  assets: GalleryAsset[];
  title?: string;
  description?: string;
}

type CategoryKey = "all" | "landscapes" | "architecture" | "portraits" | "editorial";

interface CategoryDef {
  key: CategoryKey;
  label: string;
  keywords: string[];
}

const CATEGORIES: CategoryDef[] = [
  { key: "all", label: "All Works", keywords: [] },
  { key: "landscapes", label: "Landscapes & Fjord", keywords: ["landscape", "fjord", "arctic", "mountain", "snow", "nature", "01", "05"] },
  { key: "architecture", label: "Architecture & Form", keywords: ["arch", "building", "nordic", "facade", "structure", "02", "06"] },
  { key: "portraits", label: "Portraits & Human", keywords: ["portrait", "human", "face", "people", "studio", "03", "07"] },
  { key: "editorial", label: "Editorial & Mood", keywords: ["editorial", "mood", "light", "shadow", "night", "04", "08"] },
];

function getAssetCategory(asset: GalleryAsset, index: number): CategoryKey {
  const name = asset.fileName.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.key === "all") continue;
    if (cat.keywords.some((k) => name.includes(k))) {
      return cat.key;
    }
  }
  const fallbackKeys: CategoryKey[] = ["landscapes", "architecture", "portraits", "editorial"];
  return fallbackKeys[index % fallbackKeys.length];
}

export function PhotographyGallery({ assets, title, description }: PhotographyGalleryProps) {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const enrichedAssets = useMemo(() => {
    return assets.map((asset, idx) => ({
      ...asset,
      category: getAssetCategory(asset, idx),
      originalIndex: idx,
    }));
  }, [assets]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      all: assets.length,
      landscapes: 0,
      architecture: 0,
      portraits: 0,
      editorial: 0,
    };
    enrichedAssets.forEach((a) => {
      counts[a.category]++;
    });
    return counts;
  }, [assets.length, enrichedAssets]);

  const filteredAssets = useMemo(() => {
    return enrichedAssets.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.fileName.toLowerCase().includes(q) ||
        (item.cameraModel && item.cameraModel.toLowerCase().includes(q)) ||
        (item.lensModel && item.lensModel.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [enrichedAssets, activeCategory, searchQuery]);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-nordic-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Curated Exhibition</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-nordic-ink">
            {title || "Visual Archive"}
          </h2>
          <p className="text-sm text-nordic-subtle mt-1 max-w-xl leading-relaxed">
            {description || "Selected editorial collections captured across Svalbard, Lofoten, Oslofjord, and bespoke studio environments."}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-nordic-border bg-nordic-surface px-3 py-1 text-xs font-mono text-nordic-subtle shadow-xs">
            <Layers className="h-3.5 w-3.5 text-nordic-pine" />
            {filteredAssets.length} of {assets.length} Indexed Works
          </span>
        </div>
      </div>

      {/* Filter and Search Controls: Side-by-side with border-b pb-4 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-nordic-border pb-4 mb-10">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.key];
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-nordic-pine text-white shadow-xs border border-nordic-pine"
                    : "border border-nordic-border bg-nordic-surface text-nordic-subtle hover:border-nordic-pine/50 hover:text-nordic-ink hover:bg-nordic-muted/60"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-nordic-muted text-nordic-subtle"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search / Filter Input: explicit width w-full md:w-72 */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nordic-ink/20 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search camera, lens, tag..."
            style={{ paddingLeft: "2.5rem" }}
            className="w-full rounded-full border border-nordic-border bg-nordic-surface pr-8 py-2 text-xs text-nordic-ink placeholder:text-nordic-ink/25 focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nordic-ink/30 hover:text-nordic-ink"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {assets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-nordic-border p-16 text-center bg-nordic-surface/60 max-w-xl mx-auto shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nordic-muted border border-nordic-border mb-4 text-nordic-pine">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h3 className="text-base font-serif text-nordic-ink">No works currently indexed in public archive</h3>
          <p className="text-xs text-nordic-subtle max-w-sm mx-auto mt-1.5 leading-relaxed">
            No media assets found. Access the Master Asset Library in the Command Suite and click &quot;Scan New Files&quot; to index your NAS photography portfolio.
          </p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-nordic-border p-16 text-center bg-nordic-surface/60">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nordic-muted border border-nordic-border mb-4 text-nordic-pine">
            <SlidersHorizontal className="h-6 w-6" />
          </div>
          <h3 className="text-base font-serif text-nordic-ink">No matching works discovered</h3>
          <p className="text-xs text-nordic-subtle max-w-sm mx-auto mt-1.5 leading-relaxed">
            No assets in the archive match the active category and filter criteria.
          </p>
          <button
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-nordic-border bg-nordic-surface px-4 py-2.5 text-xs font-medium text-nordic-ink hover:bg-nordic-muted hover:border-nordic-pine/40 transition cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        /* Masonry Grid */
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredAssets.map((asset) => {
            const aspect =
              asset.width && asset.height
                ? (asset.height / asset.width) * 100
                : 66.6;

            const isLandscape = asset.width && asset.height && asset.width > asset.height;
            const aspectLabel = isLandscape ? "16:9" : "3:2";

            return (
              <div
                key={asset.id}
                onClick={() => setActiveLightboxIndex(asset.originalIndex)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-nordic-border bg-nordic-surface shadow-[0_4px_20px_rgba(28,27,25,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-nordic-pine/50 hover:shadow-[0_12px_40px_rgba(28,27,25,0.08)] break-inside-avoid"
              >
                {/* Image Canvas with Aspect Proportion */}
                <div
                  className="relative w-full bg-nordic-muted overflow-hidden"
                  style={{ paddingBottom: `${Math.min(aspect, 133)}%` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/media/${asset.id}?size=thumb`}
                    alt={asset.fileName}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Top Badges (Category & Aspect) */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
                    <span className="rounded-full bg-nordic-ink/70 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono text-nordic-canvas border border-white/10 uppercase">
                      {asset.category}
                    </span>
                    <span className="rounded-md bg-nordic-ink/60 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-mono text-nordic-muted">
                      {aspectLabel}
                    </span>
                  </div>

                  {/* Gradient Hover Metadata Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-nordic-ink/90 via-nordic-ink/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-5 text-white">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1 pr-2">
                        <p className="text-sm font-medium text-white line-clamp-1 tracking-tight">
                          {asset.fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")}
                        </p>
                        {asset.cameraModel && (
                          <p className="text-xs font-mono text-nordic-clay">
                            {asset.cameraModel}
                          </p>
                        )}
                        {/* Camera telemetry chips */}
                        <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-nordic-muted">
                          {asset.focalLength && <span>{asset.focalLength}</span>}
                          {asset.aperture && <span>· {asset.aperture}</span>}
                          {asset.shutterSpeed && <span>· {asset.shutterSpeed}</span>}
                          {asset.iso && <span>· ISO {asset.iso}</span>}
                        </div>
                      </div>

                      <div className="rounded-xl bg-nordic-pine/90 p-2.5 text-white shadow-lg backdrop-blur-sm shrink-0 transition-transform group-hover:scale-110">
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
    </section>
  );
}
