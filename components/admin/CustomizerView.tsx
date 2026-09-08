"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleSystemModule, updateBrandSettings } from "@/app/actions/customizer";
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Palette,
  Layers,
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

interface CustomizerViewProps {
  initialModules: SerializedModule[];
  initialBrands: SerializedBrand[];
}

export function CustomizerView({
  initialModules,
  initialBrands,
}: CustomizerViewProps) {
  const router = useRouter();
  const [modules, setModules] = useState<SerializedModule[]>(initialModules);
  const [brands, setBrands] = useState<SerializedBrand[]>(initialBrands);
  const [activeBrandTab, setActiveBrandTab] = useState(initialBrands[0]?.id ?? "GLOBAL");

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

  const handleToggleModule = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Optimistic UI update
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: newStatus } : m))
    );

    const res = await toggleSystemModule({ id, enabled: newStatus });
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
      // Revert optimistic update
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled: currentStatus } : m))
      );
    }
  };

  const handleBrandChange = (
    field: keyof SerializedBrand,
    value: string
  ) => {
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

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-10">
      {/* Top Header */}
      <div className="pb-6 border-b border-nordic-border">
        <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-1">
          <Sliders className="h-3.5 w-3.5" />
          <span>Platform Customization Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif text-nordic-ink tracking-tight">
          System & Brand Customizer
        </h1>
        <p className="text-xs sm:text-sm text-nordic-subtle mt-1 max-w-xl">
          Toggle operational modules and adjust dynamic palette variables across all three Norwegian domain entities.
        </p>
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

      {/* SECTION 1: SYSTEM MODULE FLAGS */}
      <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-nordic-border">
          <div>
            <h2 className="text-lg font-serif text-nordic-ink flex items-center gap-2">
              <Layers className="h-4 w-4 text-nordic-pine" />
              <span>Operational Module Flags</span>
            </h2>
            <p className="text-xs text-nordic-subtle mt-0.5">
              Live switches enabling or disabling platform feature suites.
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

              {/* Toggle Switch */}
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

      {/* SECTION 2: BRAND PALETTES & TITLES */}
      <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
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

          {/* Portal Tabs */}
          <div className="flex items-center rounded-xl bg-nordic-muted p-1 border border-nordic-border">
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBrandTab(b.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-mono font-medium transition ${
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
              {/* Site Title */}
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

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={safeHex(activeBrand.accentColor, "#3b82f6")}
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

              {/* Primary Color */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                  Primary Surface Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={safeHex(activeBrand.primaryColor, "#18181b")}
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

              {/* Background Color */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                  Canvas Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={safeHex(activeBrand.backgroundColor, "#09090b")}
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

            {/* Live Palette Visualizer */}
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
    </div>
  );
}
