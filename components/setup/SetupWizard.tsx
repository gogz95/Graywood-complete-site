"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { bootstrapSystem, type BootstrapInput } from "@/app/actions/setup";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Palette,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Briefcase,
  BookOpen,
  Server,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

const BG_PRESETS = [
  { name: "Void Dark", hex: "#09090b" },
  { name: "Obsidian", hex: "#030712" },
  { name: "Deep Charcoal", hex: "#121214" },
];

const ACCENT_PRESETS = [
  { name: "Royal Blue", hex: "#3b82f6" },
  { name: "Nordic Amber", hex: "#f59e0b" },
  { name: "Electric Violet", hex: "#8b5cf6" },
  { name: "Emerald Glade", hex: "#10b981" },
];

export function SetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    siteTitle: "Graywood",
    tagline: "Nordic Creative Studio",
    backgroundColor: "#09090b",
    accentColor: "#3b82f6",
    enableClientPortal: true,
    enableGearDesk: true,
    enableMangaReader: true,
    enableGameServers: true,
  });

  const updateField = <K extends keyof typeof formData>(
    key: K,
    val: typeof formData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    setErrorMessage(null);
  };

  const handleNextStep = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        setErrorMessage("Please enter an administrator name (at least 2 characters).");
        return;
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      if (formData.password.length < 8) {
        setErrorMessage("Password must be at least 8 characters long.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.siteTitle.trim()) {
        setErrorMessage("Please enter a site title.");
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: BootstrapInput = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      siteTitle: formData.siteTitle.trim(),
      tagline: formData.tagline.trim(),
      backgroundColor: formData.backgroundColor,
      accentColor: formData.accentColor,
      enableClientPortal: formData.enableClientPortal,
      enableGearDesk: formData.enableGearDesk,
      enableMangaReader: formData.enableMangaReader,
      enableGameServers: formData.enableGameServers,
    };

    try {
      const res = await bootstrapSystem(payload);
      if (res.success && res.redirectUrl) {
        router.push(res.redirectUrl);
        router.refresh();
      } else {
        setErrorMessage(res.message || "Failed to bootstrap platform.");
      }
    } catch {
      setErrorMessage("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-[#09090b] text-foreground">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background effect */}
        <div
          className="absolute -top-32 -right-32 h-80 w-80 rounded-full blur-[100px] pointer-events-none opacity-30 transition-colors duration-500"
          style={{ backgroundColor: formData.accentColor }}
        />

        {/* Top Header */}
        <div className="text-center mb-8">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border mb-4 shadow-inner transition-colors duration-500"
            style={{
              backgroundColor: `${formData.accentColor}15`,
              borderColor: `${formData.accentColor}40`,
              color: formData.accentColor,
            }}
          >
            <Sparkles className="h-6 w-6" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2">
            First-Time Installation · Setup Wizard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Bootstrap Graywood Ecosystem
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md mx-auto">
            Configure your root administrator, global visual branding, and active feature suites in 3 quick steps.
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="flex items-center justify-between max-w-sm mx-auto mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-800 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0 transition-all duration-300"
            style={{
              width:
                currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
            }}
          />

          {[
            { step: 1, label: "Admin" },
            { step: 2, label: "Branding" },
            { step: 3, label: "Modules" },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div key={item.step} className="flex flex-col items-center relative z-10">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 ${
                    isCompleted
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : isCurrent
                      ? "border-2 border-blue-500 bg-zinc-900 text-blue-400"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : item.step}
                </div>
                <span
                  className={`text-[10px] font-mono mt-1 ${
                    isCurrent
                      ? "text-blue-400 font-semibold"
                      : "text-zinc-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl bg-red-950/40 border border-red-800/60 p-4 text-xs text-red-300 shadow-md animate-fade-in"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* =================================================================
              STEP 1: ROOT ADMINISTRATOR
              ================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-zinc-800 pb-3 mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span>Step 1: Primary Administrator Account</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  This account will have unrestricted root permissions across all three domains.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Henrik Graywood"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="admin@graywood.no"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Security Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              STEP 2: BRAND IDENTITY & PALETTES
              ================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-zinc-800 pb-3 mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-400" />
                  <span>Step 2: Brand Identity & Palette Variables</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure the primary naming and dynamic theme colors injected across all layouts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Studio Entity Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.siteTitle}
                    onChange={(e) => updateField("siteTitle", e.target.value)}
                    placeholder="e.g. Graywood"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Global Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    placeholder="e.g. Nordic Creative Studio"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Accent Color Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    {ACCENT_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => updateField("accentColor", p.hex)}
                        title={p.name}
                        className="h-5 w-5 rounded-full border border-white/20 transition hover:scale-110"
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="h-10 w-12 rounded-lg border border-zinc-800 bg-zinc-900 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Background Color Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Background Canvas Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    {BG_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => updateField("backgroundColor", p.hex)}
                        title={p.name}
                        className="h-5 w-5 rounded-full border border-white/20 transition hover:scale-110"
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => updateField("backgroundColor", e.target.value)}
                    className="h-10 w-12 rounded-lg border border-zinc-800 bg-zinc-900 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => updateField("backgroundColor", e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-mono text-white focus:border-blue-500 focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Live Card Preview */}
              <div
                className="rounded-2xl border border-zinc-800 p-4 mt-4 transition-all"
                style={{ backgroundColor: formData.backgroundColor }}
              >
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">
                  Live Theme Visualizer
                </span>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{formData.siteTitle}</h3>
                    <p className="text-xs text-zinc-400">{formData.tagline}</p>
                  </div>
                  <span
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-white shadow"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    Action Accent
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              STEP 3: MODULAR SUITES & CONFIRMATION
              ================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-zinc-800 pb-3 mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-400" />
                  <span>Step 3: Ecosystem Modules & Activation</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Select which modular capabilities should be active out of the box. You can modify these anytime in the customizer.
                </p>
              </div>

              <div className="space-y-3">
                {/* Module 1 */}
                <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:border-zinc-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500/10 p-2.5 border border-amber-500/20 text-amber-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Client Proofing Vault</div>
                      <div className="text-[11px] text-zinc-400">
                        Private encrypted galleries with bespoke PIN verification & streaming ZIP downloads.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableClientPortal}
                    onChange={(e) => updateField("enableClientPortal", e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500 bg-zinc-800"
                  />
                </label>

                {/* Module 2 */}
                <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:border-zinc-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-500/10 p-2.5 border border-blue-500/20 text-blue-400">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Co-Owner Gear Desk</div>
                      <div className="text-[11px] text-zinc-400">
                        Equipment check-in/out tracking with condition reports and immutable audit logging.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableGearDesk}
                    onChange={(e) => updateField("enableGearDesk", e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500 bg-zinc-800"
                  />
                </label>

                {/* Module 3 */}
                <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:border-zinc-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-purple-500/10 p-2.5 border border-purple-500/20 text-purple-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Manga Reader Dock</div>
                      <div className="text-[11px] text-zinc-400">
                        Sandboxed iframe suite with Content-Security-Policy frame-src protection.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableMangaReader}
                    onChange={(e) => updateField("enableMangaReader", e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500 bg-zinc-800"
                  />
                </label>

                {/* Module 4 */}
                <label className="flex items-center justify-between p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:border-zinc-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2.5 border border-emerald-500/20 text-emerald-400">
                      <Server className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Dedicated Game Server Monitors</div>
                      <div className="text-[11px] text-zinc-400">
                        Operations dashboard cards tracking private studio gaming cluster nodes.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableGameServers}
                    onChange={(e) => updateField("enableGameServers", e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 text-blue-600 focus:ring-blue-500 bg-zinc-800"
                  />
                </label>
              </div>

              {/* Ready Summary */}
              <div className="rounded-2xl border border-blue-800/60 bg-blue-950/20 p-4 text-xs text-blue-300 flex items-center gap-3 mt-4">
                <ShieldCheck className="h-5 w-5 shrink-0 text-blue-400" />
                <span>
                  Ready to bootstrap: Clicking Activate will finalize the configuration, commit the database transaction, and lock the setup wizard.
                </span>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Bootstrapping System...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Activate Ecosystem</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
