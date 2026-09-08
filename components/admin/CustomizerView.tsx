"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleSystemModule, updateBrandSettings } from "@/app/actions/customizer";
import {
  updateSiteContent,
  upsertStudioFeature,
  deleteStudioFeature,
} from "@/app/actions/content";
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Palette,
  Layers,
  FileText,
  Camera,
  Compass,
  Award,
  Aperture,
  Plus,
  ArrowUp,
  ArrowDown,
  Sparkles,
  X,
} from "lucide-react";

export interface SerializedModule {
  id: string;
  name: string;
  enabled: boolean;
}

export interface SerializedBrand {
  id: string;
  siteTitle: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

export interface SerializedSiteContent {
  id: string;
  scope: string;
  section: string;
  key: string;
  value: string;
}

export interface SerializedStudioFeature {
  id: string;
  scope: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

interface CustomizerViewProps {
  initialModules: SerializedModule[];
  initialBrands: SerializedBrand[];
  initialContent?: SerializedSiteContent[];
  initialFeatures?: SerializedStudioFeature[];
}

const AVAILABLE_ICONS = [
  { name: "Camera", icon: Camera },
  { name: "Compass", icon: Compass },
  { name: "Award", icon: Award },
  { name: "Aperture", icon: Aperture },
  { name: "Sparkles", icon: Sparkles },
];

export function CustomizerView({
  initialModules,
  initialBrands,
  initialContent = [],
  initialFeatures = [],
}: CustomizerViewProps) {
  const router = useRouter();

  // Master navigation tabs
  const [activeMainTab, setActiveMainTab] = useState<"modules" | "brands" | "content">("content");

  // Modules & Brands state
  const [modules, setModules] = useState<SerializedModule[]>(initialModules);
  const [brands, setBrands] = useState<SerializedBrand[]>(initialBrands);
  const [activeBrandTab, setActiveBrandTab] = useState(initialBrands[0]?.id ?? "GLOBAL");

  // Content state
  const [contentList, setContentList] = useState<SerializedSiteContent[]>(initialContent);
  const [featuresList, setFeaturesList] = useState<SerializedStudioFeature[]>(initialFeatures);
  const [activeContentScope, setActiveContentScope] = useState<"PHOTOGRAPHY" | "MEDIA" | "GLOBAL">("PHOTOGRAPHY");

  // In-flight copy draft edits
  const [copyDrafts, setCopyDrafts] = useState<Record<string, string>>({});

  // Feature modal state
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Partial<SerializedStudioFeature> | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const activeBrand = brands.find((b) => b.id === activeBrandTab) ?? brands[0];

  const safeHex = (color: string | undefined, fallback: string): string => {
    if (!color) return fallback;
    return /^#[0-9A-Fa-f]{6}$/.test(color.trim()) ? color.trim() : fallback;
  };

  // ---------------------------------------------------------------------------
  // Module Handlers
  // ---------------------------------------------------------------------------
  const handleToggleModule = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: newStatus } : m))
    );

    const res = await toggleSystemModule({ id, enabled: newStatus });
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled: currentStatus } : m))
      );
    }
  };

  // ---------------------------------------------------------------------------
  // Brand Handlers
  // ---------------------------------------------------------------------------
  const handleBrandChange = (field: keyof SerializedBrand, value: string) => {
    setBrands((prev) =>
      prev.map((b) => (b.id === activeBrandTab ? { ...b, [field]: value } : b))
    );
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBrand) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await updateBrandSettings({
      id: activeBrand.id,
      siteTitle: activeBrand.siteTitle,
      primaryColor: activeBrand.primaryColor,
      accentColor: activeBrand.accentColor,
      backgroundColor: activeBrand.backgroundColor,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  // ---------------------------------------------------------------------------
  // Site Copy Handlers
  // ---------------------------------------------------------------------------
  const getCopyValue = (section: string, key: string, defaultValue = "") => {
    const compositeKey = `${activeContentScope}.${section}.${key}`;
    if (copyDrafts[compositeKey] !== undefined) {
      return copyDrafts[compositeKey];
    }
    const item = contentList.find(
      (c) => c.scope === activeContentScope && c.section === section && c.key === key
    );
    return item ? item.value : defaultValue;
  };

  const handleCopyChange = (section: string, key: string, value: string) => {
    const compositeKey = `${activeContentScope}.${section}.${key}`;
    setCopyDrafts((prev) => ({ ...prev, [compositeKey]: value }));
  };

  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const entriesToSave: Record<string, string> = {};
    const prefix = `${activeContentScope}.`;

    contentList
      .filter((c) => c.scope === activeContentScope)
      .forEach((c) => {
        entriesToSave[`${c.section}.${c.key}`] = c.value;
      });

    for (const [compositeKey, val] of Object.entries(copyDrafts)) {
      if (compositeKey.startsWith(prefix)) {
        const withoutScope = compositeKey.slice(prefix.length);
        entriesToSave[withoutScope] = val;
      }
    }

    const res = await updateSiteContent(activeContentScope, entriesToSave);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setContentList((prev) => {
        const filtered = prev.filter((c) => c.scope !== activeContentScope);
        const newEntries: SerializedSiteContent[] = Object.entries(entriesToSave).map(
          ([comp, val]) => {
            const [section, key] = comp.split(".");
            return {
              id: `${activeContentScope}_${section}_${key}`,
              scope: activeContentScope,
              section,
              key,
              value: val,
            };
          }
        );
        return [...filtered, ...newEntries];
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  // ---------------------------------------------------------------------------
  // Studio Feature Highlights Handlers
  // ---------------------------------------------------------------------------
  const currentFeatures = featuresList
    .filter((f) => f.scope === activeContentScope)
    .sort((a, b) => a.order - b.order);

  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature?.title || !editingFeature?.description) return;

    setIsSubmitting(true);
    setFeedback(null);

    const targetScope = (activeContentScope === "GLOBAL" ? "PHOTOGRAPHY" : activeContentScope) as "PHOTOGRAPHY" | "MEDIA";
    const payload = {
      id: editingFeature.id,
      scope: targetScope,
      icon: editingFeature.icon || "Camera",
      title: editingFeature.title.trim(),
      description: editingFeature.description.trim(),
      order: editingFeature.order ?? currentFeatures.length + 1,
    };

    const res = await upsertStudioFeature(payload);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setIsFeatureModalOpen(false);
      setEditingFeature(null);
      router.refresh();

      setFeaturesList((prev) => {
        if (payload.id) {
          const updatedId = payload.id;
          return prev.map((f) =>
            f.id === updatedId
              ? { ...f, ...payload, id: updatedId }
              : f
          );
        } else {
          const tempId = `feat_${Date.now()}`;
          return [...prev, { ...payload, id: tempId }];
        }
      });
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm("Are you sure you want to remove this highlight callout?")) return;
    setIsSubmitting(true);
    setFeedback(null);

    const res = await deleteStudioFeature(id);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setFeaturesList((prev) => prev.filter((f) => f.id !== id));
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleReorderFeature = async (feature: SerializedStudioFeature, direction: "up" | "down") => {
    const idx = currentFeatures.findIndex((f) => f.id === feature.id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentFeatures.length) return;

    const other = currentFeatures[targetIdx];
    const newOrder = other.order;
    const otherOrder = feature.order;

    setFeaturesList((prev) =>
      prev.map((f) => {
        if (f.id === feature.id) return { ...f, order: newOrder };
        if (f.id === other.id) return { ...f, order: otherOrder };
        return f;
      })
    );

    await Promise.all([
      upsertStudioFeature({ ...feature, scope: feature.scope as "PHOTOGRAPHY" | "MEDIA", order: newOrder }),
      upsertStudioFeature({ ...other, scope: other.scope as "PHOTOGRAPHY" | "MEDIA", order: otherOrder }),
    ]);

    router.refresh();
  };

  return (
    <div className="w-full flex flex-col space-y-8">
      {/* Top Header */}
      <div className="pb-6 border-b border-nordic-border flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-1">
            <Sliders className="h-3.5 w-3.5" />
            <span>Platform Customization Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-nordic-ink tracking-tight">
            System, Content & Brand Customizer
          </h1>
          <p className="text-xs sm:text-sm text-nordic-subtle mt-1 max-w-xl">
            Centralized In-Site CMS for live copy editing, visual highlight cards, operational module flags, and Scandinavian palette variables.
          </p>
        </div>

        {/* Master Tab Selector */}
        <div className="flex items-center rounded-xl bg-nordic-muted p-1 border border-nordic-border">
          <button
            type="button"
            onClick={() => setActiveMainTab("content")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeMainTab === "content"
                ? "bg-nordic-pine text-white shadow-sm"
                : "text-nordic-subtle hover:text-nordic-ink"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Site Copy & Content</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("brands")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeMainTab === "brands"
                ? "bg-nordic-pine text-white shadow-sm"
                : "text-nordic-subtle hover:text-nordic-ink"
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Brand Palettes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab("modules")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeMainTab === "modules"
                ? "bg-nordic-pine text-white shadow-sm"
                : "text-nordic-subtle hover:text-nordic-ink"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Modules</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs border ${
            feedback.type === "success"
              ? "bg-nordic-pine/10 text-nordic-pine border-nordic-pine/20"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-nordic-pine mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* =======================================================================
          TAB 1: SITE COPY & CONTENT CMS
          ======================================================================= */}
      {activeMainTab === "content" && (
        <div className="space-y-8 animate-fade-in">
          {/* Scope Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-nordic-border bg-nordic-surface">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-nordic-ink">
                Active CMS Scope
              </div>
              <p className="text-[11px] text-nordic-subtle">
                Choose the domain partition to edit headlines, descriptions, and feature callouts.
              </p>
            </div>

            <div className="flex items-center rounded-xl bg-nordic-muted p-1 border border-nordic-border">
              {[
                { id: "PHOTOGRAPHY", label: "Photography Studio" },
                { id: "MEDIA", label: "Media Collective" },
                { id: "GLOBAL", label: "Apex Gateway" },
              ].map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveContentScope(sc.id as "PHOTOGRAPHY" | "MEDIA" | "GLOBAL")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                    activeContentScope === sc.id
                      ? "bg-nordic-pine text-white shadow-sm"
                      : "text-nordic-subtle hover:text-nordic-ink"
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section A: Copywriting & Headlines Form */}
          <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-nordic-border">
              <div>
                <h2 className="text-lg font-serif text-nordic-ink flex items-center gap-2">
                  <FileText className="h-4 w-4 text-nordic-pine" />
                  <span>Dynamic Copy Store ({activeContentScope})</span>
                </h2>
                <p className="text-xs text-nordic-subtle mt-0.5">
                  Live editorial text, badges, hero descriptions, and archive titles. Updates revalidate instantaneously.
                </p>
              </div>
              <span className="text-[11px] font-mono text-nordic-faint uppercase">
                Instant Revalidation
              </span>
            </div>

            <form onSubmit={handleSaveCopy} className="space-y-6">
              {/* HERO SECTION */}
              <div className="p-5 rounded-2xl border border-nordic-border bg-nordic-canvas/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nordic-pine">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Hero Header Section</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-nordic-subtle mb-1">
                      Header Pill Badge (`HERO.badge`)
                    </label>
                    <input
                      type="text"
                      value={getCopyValue("HERO", "badge", "GRAYWOOD STUDIO")}
                      onChange={(e) => handleCopyChange("HERO", "badge", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-nordic-subtle mb-1">
                      Primary Headline (`HERO.title`)
                    </label>
                    <input
                      type="text"
                      value={getCopyValue("HERO", "title", "Visual narratives across the Nordic landscape.")}
                      onChange={(e) => handleCopyChange("HERO", "title", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-nordic-subtle mb-1">
                    Editorial Description (`HERO.description`)
                  </label>
                  <textarea
                    rows={3}
                    value={getCopyValue(
                      "HERO",
                      "description",
                      "Specialized in commercial campaigns, architectural documentation, and editorial storytelling."
                    )}
                    onChange={(e) => handleCopyChange("HERO", "description", e.target.value)}
                    className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                  />
                </div>
              </div>

              {/* ARCHIVE SECTION */}
              <div className="p-5 rounded-2xl border border-nordic-border bg-nordic-canvas/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nordic-pine">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Gallery Archive Intro</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-nordic-subtle mb-1">
                      Archive Title (`ARCHIVE.title`)
                    </label>
                    <input
                      type="text"
                      value={getCopyValue("ARCHIVE", "title", "Visual Archive")}
                      onChange={(e) => handleCopyChange("ARCHIVE", "title", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-nordic-subtle mb-1">
                      Archive Subtitle (`ARCHIVE.description`)
                    </label>
                    <input
                      type="text"
                      value={getCopyValue("ARCHIVE", "description", "Curated master files and commissions.")}
                      onChange={(e) => handleCopyChange("ARCHIVE", "description", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* COMMISSION SECTION */}
              <div className="p-5 rounded-2xl border border-nordic-border bg-nordic-canvas/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-nordic-pine">
                  <Camera className="h-3.5 w-3.5" />
                  <span>Commission Intro</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-nordic-subtle mb-1">
                      Commission Title (`COMMISSION.title`)
                    </label>
                    <input
                      type="text"
                      value={getCopyValue("COMMISSION", "title", "Initiate a Commission")}
                      onChange={(e) => handleCopyChange("COMMISSION", "title", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-nordic-subtle mb-1">
                      Commission Subtitle (`COMMISSION.description`)
                    </label>
                    <input
                      type="text"
                      value={getCopyValue(
                        "COMMISSION",
                        "description",
                        "Available for editorial campaigns, architectural documentation, and select commercial projects."
                      )}
                      onChange={(e) => handleCopyChange("COMMISSION", "description", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-6 py-2.5 text-xs font-medium text-white hover:bg-nordic-pine/90 shadow-sm disabled:opacity-50 cursor-pointer transition"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Copy ({activeContentScope})</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section B: Studio Feature Highlights Manager */}
          <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-nordic-border">
              <div>
                <h2 className="text-lg font-serif text-nordic-ink flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-nordic-clay" />
                  <span>Studio Highlight Callouts ({activeContentScope})</span>
                </h2>
                <p className="text-xs text-nordic-subtle mt-0.5">
                  Dynamic feature boxes displayed below the hero. If zero highlights are added, the section disappears cleanly.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingFeature({
                    scope: activeContentScope === "GLOBAL" ? "PHOTOGRAPHY" : activeContentScope,
                    icon: "Camera",
                    title: "",
                    description: "",
                    order: currentFeatures.length + 1,
                  });
                  setIsFeatureModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-4 py-2 text-xs font-medium text-white hover:bg-nordic-pine/90 shadow-sm cursor-pointer transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Highlight</span>
              </button>
            </div>

            {currentFeatures.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-nordic-border p-8 text-center bg-nordic-canvas/50">
                <p className="text-xs text-nordic-subtle">
                  No highlight callouts defined for {activeContentScope}. The section will render nothing on the public page.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentFeatures.map((f, idx) => {
                  const IconComp = AVAILABLE_ICONS.find((i) => i.name === f.icon)?.icon || Camera;
                  return (
                    <div
                      key={f.id}
                      className="rounded-2xl border border-nordic-border bg-nordic-canvas/70 p-4 flex flex-col justify-between space-y-3 transition hover:border-nordic-divider"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-xl bg-nordic-muted p-2 border border-nordic-border text-nordic-pine">
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-nordic-ink">{f.title}</div>
                            <div className="text-[10px] font-mono text-nordic-faint">Icon: {f.icon} · #{f.order}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleReorderFeature(f, "up")}
                            title="Move Up"
                            className="p-1 rounded-md text-nordic-subtle hover:text-nordic-ink disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === currentFeatures.length - 1}
                            onClick={() => handleReorderFeature(f, "down")}
                            title="Move Down"
                            className="p-1 rounded-md text-nordic-subtle hover:text-nordic-ink disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-nordic-subtle leading-relaxed">{f.description}</p>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-nordic-border/60">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFeature(f);
                            setIsFeatureModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted cursor-pointer transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFeature(f.id)}
                          className="px-2.5 py-1 rounded-lg text-xs text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: BRAND PALETTES & DOMAIN TITLES
          ======================================================================= */}
      {activeMainTab === "brands" && (
        <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)] animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-nordic-border">
            <div>
              <h2 className="text-lg font-serif text-nordic-ink flex items-center gap-2">
                <Palette className="h-4 w-4 text-nordic-clay" />
                <span>Domain Portal Settings & Themes</span>
              </h2>
              <p className="text-xs text-nordic-subtle mt-0.5">
                Customize portal site titles and brand accent colors per domain.
              </p>
            </div>

            <div className="flex items-center rounded-xl bg-nordic-muted p-1 border border-nordic-border">
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBrandTab(b.id)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-mono font-medium transition cursor-pointer ${
                    activeBrandTab === b.id
                      ? "bg-nordic-pine text-white shadow-sm"
                      : "text-nordic-subtle hover:text-nordic-ink"
                  }`}
                >
                  {b.id}
                </button>
              ))}
            </div>
          </div>

          {activeBrand && (
            <form onSubmit={handleSaveBrand} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                    Portal Site Title
                  </label>
                  <input
                    type="text"
                    required
                    value={activeBrand.siteTitle}
                    onChange={(e) => handleBrandChange("siteTitle", e.target.value)}
                    className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={safeHex(activeBrand.accentColor, "#2D3B36")}
                      onChange={(e) => handleBrandChange("accentColor", e.target.value)}
                      className="h-10 w-12 rounded-lg border border-nordic-border bg-nordic-muted cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={activeBrand.accentColor}
                      onChange={(e) => handleBrandChange("accentColor", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm font-mono text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                    Primary Surface Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={safeHex(activeBrand.primaryColor, "#1C1B19")}
                      onChange={(e) => handleBrandChange("primaryColor", e.target.value)}
                      className="h-10 w-12 rounded-lg border border-nordic-border bg-nordic-muted cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={activeBrand.primaryColor}
                      onChange={(e) => handleBrandChange("primaryColor", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm font-mono text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                    Canvas Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={safeHex(activeBrand.backgroundColor, "#F9F8F6")}
                      onChange={(e) => handleBrandChange("backgroundColor", e.target.value)}
                      className="h-10 w-12 rounded-lg border border-nordic-border bg-nordic-muted cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={activeBrand.backgroundColor}
                      onChange={(e) => handleBrandChange("backgroundColor", e.target.value)}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm font-mono text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-nordic-border bg-nordic-canvas/60 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="h-10 w-10 rounded-xl shadow-inner border border-nordic-border flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: activeBrand.accentColor }}
                  >
                    Aa
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-nordic-ink">
                      Theme Preview: {activeBrand.siteTitle}
                    </div>
                    <div className="text-[11px] font-mono text-nordic-subtle">
                      Accent: {activeBrand.accentColor} · Surface: {activeBrand.primaryColor}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-6 py-2.5 text-xs font-medium text-white hover:bg-nordic-pine/90 shadow-sm disabled:opacity-50 cursor-pointer transition"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Save Brand Settings</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* =======================================================================
          TAB 3: OPERATIONAL MODULE FLAGS
          ======================================================================= */}
      {activeMainTab === "modules" && (
        <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)] animate-fade-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-nordic-border">
            <div>
              <h2 className="text-lg font-serif text-nordic-ink flex items-center gap-2">
                <Layers className="h-4 w-4 text-nordic-pine" />
                <span>Operational Module Flags</span>
              </h2>
              <p className="text-xs text-nordic-subtle mt-0.5">
                Live switches enabling or disabling platform feature suites across the ecosystem.
              </p>
            </div>
            <span className="text-xs font-mono text-nordic-faint">
              {modules.filter((m) => m.enabled).length} of {modules.length} ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="rounded-2xl border border-nordic-border bg-nordic-canvas/60 p-5 flex items-center justify-between transition hover:border-nordic-divider"
              >
                <div>
                  <div className="font-medium text-sm text-nordic-ink">{mod.name}</div>
                  <div className="text-[11px] font-mono text-nordic-faint">
                    ID: {mod.id}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={mod.enabled}
                  onClick={() => handleToggleModule(mod.id, mod.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    mod.enabled ? "bg-nordic-pine" : "bg-nordic-border"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      mod.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =======================================================================
          FEATURE MODAL (Add/Edit)
          ======================================================================= */}
      {isFeatureModalOpen && editingFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-nordic-border">
              <h3 className="text-base font-serif text-nordic-ink flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-nordic-pine" />
                <span>{editingFeature.id ? "Edit Highlight Callout" : "New Highlight Callout"}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsFeatureModalOpen(false);
                  setEditingFeature(null);
                }}
                className="p-1 rounded-lg text-nordic-subtle hover:text-nordic-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFeature} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Lucide Icon Identifier
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((it) => {
                    const Comp = it.icon;
                    const isSelected = (editingFeature.icon || "Camera") === it.name;
                    return (
                      <button
                        key={it.name}
                        type="button"
                        onClick={() => setEditingFeature((prev) => ({ ...prev, icon: it.name }))}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                          isSelected
                            ? "border-nordic-pine bg-nordic-pine/10 text-nordic-pine font-medium shadow-xs"
                            : "border-nordic-border bg-nordic-muted text-nordic-subtle hover:border-nordic-divider"
                        }`}
                      >
                        <Comp className="h-4 w-4 mb-1" />
                        <span className="text-[10px]">{it.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Callout Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medium Format Rig"
                  value={editingFeature.title || ""}
                  onChange={(e) => setEditingFeature((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Description Text
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Ultra high-fidelity sensor captures up to 100 megapixels."
                  value={editingFeature.description || ""}
                  onChange={(e) => setEditingFeature((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-nordic-border">
                <button
                  type="button"
                  onClick={() => {
                    setIsFeatureModalOpen(false);
                    setEditingFeature(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-nordic-subtle hover:text-nordic-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-5 py-2 text-xs font-medium text-white hover:bg-nordic-pine/90 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Callout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
