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
  { name: "Nordic Limestone", hex: "#F9F8F6" },
  { name: "Pristine Canvas", hex: "#FFFFFF" },
  { name: "Warm Muted", hex: "#F1EFEA" },
];

const ACCENT_PRESETS = [
  { name: "Nordic Pine", hex: "#2D3B36" },
  { name: "Terracotta Clay", hex: "#C86D51" },
  { name: "Subtle Earth", hex: "#68655E" },
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
    backgroundColor: "#F9F8F6",
    accentColor: "#2D3B36",
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-nordic-canvas text-nordic-ink">
      <div className="w-full max-w-2xl rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-10 shadow-[0_8px_30px_rgba(28,27,25,0.06)] relative overflow-hidden">
        {/* Ambient glow */}
        <div
          className="absolute -top-32 -right-32 h-80 w-80 rounded-full blur-[100px] pointer-events-none opacity-20 transition-colors duration-500"
          style={{ backgroundColor: formData.accentColor }}
        />

        {/* Top Header */}
        <div className="text-center mb-8">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border mb-4 shadow-sm transition-colors duration-500"
            style={{
              backgroundColor: `${formData.accentColor}15`,
              borderColor: `${formData.accentColor}40`,
              color: formData.accentColor,
            }}
          >
            <Sparkles className="h-6 w-6" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-nordic-border bg-nordic-muted px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-nordic-pine mb-2">
            First-Time Installation · Setup Wizard
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-nordic-ink tracking-tight">
            Bootstrap Graywood Ecosystem
          </h1>
          <p className="text-xs sm:text-sm text-nordic-subtle mt-1 max-w-md mx-auto">
            Configure your root administrator, global visual branding, and active feature suites in 3 quick steps.
          </p>
        </div>

        {/* Multi-step progress bar */}
        <div className="flex items-center justify-between max-w-sm mx-auto mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-nordic-border -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-nordic-pine -translate-y-1/2 z-0 transition-all duration-300"
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
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium font-mono transition-all duration-300 ${
                    isCompleted
                      ? "bg-nordic-pine text-white shadow-sm"
                      : isCurrent
                      ? "border-2 border-nordic-pine bg-nordic-surface text-nordic-pine"
                      : "border border-nordic-border bg-nordic-muted text-nordic-faint"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : item.step}
                </div>
                <span
                  className={`text-[10px] font-mono mt-1 ${
                    isCurrent
                      ? "text-nordic-pine font-medium"
                      : "text-nordic-faint"
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
            className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-700 shadow-sm animate-fade-in"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: ROOT ADMINISTRATOR */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-nordic-border pb-3 mb-4">
                <h2 className="text-sm font-serif text-nordic-ink flex items-center gap-2">
                  <User className="h-4 w-4 text-nordic-pine" />
                  <span>Step 1: Primary Administrator Account</span>
                </h2>
                <p className="text-xs text-nordic-subtle mt-0.5">
                  This account will have unrestricted root permissions across all three domains.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 h-4 w-4 text-nordic-ink/20 pointer-events-none transition-colors z-10" />
                  <input
                    type="text"
                    required
                    placeholder="Administrator Name"
                    value={formData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    autoFocus
                    style={{ paddingLeft: "2.75rem" }}
                    className="w-full rounded-xl border border-nordic-border bg-nordic-muted pr-4 py-2.5 text-sm text-nordic-ink placeholder:text-nordic-ink/25 focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-nordic-ink/20 pointer-events-none transition-colors z-10" />
                  <input
                    type="email"
                    required
                    placeholder="admin@graywood.no"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    style={{ paddingLeft: "2.75rem" }}
                    className="w-full rounded-xl border border-nordic-border bg-nordic-muted pr-4 py-2.5 text-sm text-nordic-ink placeholder:text-nordic-ink/25 focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                    Security Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-nordic-ink/20 pointer-events-none transition-colors z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="At least 8 characters"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      style={{ paddingLeft: "2.75rem", paddingRight: "2.5rem" }}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted py-2.5 text-sm text-nordic-ink placeholder:text-nordic-ink/25 focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-nordic-ink/25 hover:text-nordic-ink transition-colors p-1 z-10"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-nordic-ink/20 pointer-events-none transition-colors z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      style={{ paddingLeft: "2.75rem" }}
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted pr-4 py-2.5 text-sm text-nordic-ink placeholder:text-nordic-ink/25 focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BRAND IDENTITY & PALETTES */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-nordic-border pb-3 mb-4">
                <h2 className="text-sm font-serif text-nordic-ink flex items-center gap-2">
                  <Palette className="h-4 w-4 text-nordic-clay" />
                  <span>Step 2: Brand Identity & Palette Variables</span>
                </h2>
                <p className="text-xs text-nordic-subtle mt-0.5">
                  Configure the primary naming and dynamic theme colors injected across all layouts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                    Studio Entity Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.siteTitle}
                    onChange={(e) => updateField("siteTitle", e.target.value)}
                    placeholder="e.g. Graywood"
                    className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink placeholder:text-nordic-ink/25 focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                    Global Tagline
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => updateField("tagline", e.target.value)}
                    placeholder="e.g. Nordic Creative Studio"
                    className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm text-nordic-ink placeholder:text-nordic-ink/25 focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Accent Color Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-nordic-subtle">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    {ACCENT_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => updateField("accentColor", p.hex)}
                        title={p.name}
                        className="h-5 w-5 rounded-full border border-nordic-border transition hover:scale-110 shadow-sm"
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
                    className="h-10 w-12 rounded-lg border border-nordic-border bg-nordic-muted cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => updateField("accentColor", e.target.value)}
                    className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm font-mono text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Background Color Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-nordic-subtle">
                    Background Canvas Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    {BG_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => updateField("backgroundColor", p.hex)}
                        title={p.name}
                        className="h-5 w-5 rounded-full border border-nordic-border transition hover:scale-110 shadow-sm"
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
                    className="h-10 w-12 rounded-lg border border-nordic-border bg-nordic-muted cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => updateField("backgroundColor", e.target.value)}
                    className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-sm font-mono text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Live Card Preview */}
              <div
                className="rounded-2xl border border-nordic-border p-4 mt-4 transition-all shadow-sm"
                style={{ backgroundColor: formData.backgroundColor }}
              >
                <span className="text-[10px] font-mono text-nordic-faint block uppercase">
                  Live Theme Visualizer
                </span>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <h3 className="text-sm font-serif text-nordic-ink">{formData.siteTitle}</h3>
                    <p className="text-xs text-nordic-subtle">{formData.tagline}</p>
                  </div>
                  <span
                    className="rounded-lg px-3 py-1 text-xs font-medium text-white shadow-sm"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    Action Accent
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: MODULAR SUITES & CONFIRMATION */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-nordic-border pb-3 mb-4">
                <h2 className="text-sm font-serif text-nordic-ink flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-nordic-pine" />
                  <span>Step 3: Ecosystem Modules & Activation</span>
                </h2>
                <p className="text-xs text-nordic-subtle mt-0.5">
                  Select which modular capabilities should be active out of the box. You can modify these anytime in the customizer.
                </p>
              </div>

              <div className="space-y-3">
                {/* Module 1 */}
                <label className="flex items-center justify-between p-4 rounded-2xl border border-nordic-border bg-nordic-canvas/60 cursor-pointer hover:border-nordic-divider transition">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-nordic-muted p-2.5 border border-nordic-border text-nordic-clay">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-nordic-ink">Client Proofing Vault</div>
                      <div className="text-[11px] text-nordic-subtle">
                        Private encrypted galleries with bespoke PIN verification & streaming ZIP downloads.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableClientPortal}
                    onChange={(e) => updateField("enableClientPortal", e.target.checked)}
                    className="h-4 w-4 rounded border-nordic-border text-nordic-pine focus:ring-nordic-pine"
                  />
                </label>

                {/* Module 2 */}
                <label className="flex items-center justify-between p-4 rounded-2xl border border-nordic-border bg-nordic-canvas/60 cursor-pointer hover:border-nordic-divider transition">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-nordic-muted p-2.5 border border-nordic-border text-nordic-pine">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-nordic-ink">Co-Owner Gear Desk</div>
                      <div className="text-[11px] text-nordic-subtle">
                        Equipment check-in/out tracking with condition reports and immutable audit logging.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableGearDesk}
                    onChange={(e) => updateField("enableGearDesk", e.target.checked)}
                    className="h-4 w-4 rounded border-nordic-border text-nordic-pine focus:ring-nordic-pine"
                  />
                </label>

                {/* Module 3 */}
                <label className="flex items-center justify-between p-4 rounded-2xl border border-nordic-border bg-nordic-canvas/60 cursor-pointer hover:border-nordic-divider transition">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-nordic-muted p-2.5 border border-nordic-border text-nordic-pine">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-nordic-ink">Manga Reader Dock</div>
                      <div className="text-[11px] text-nordic-subtle">
                        Sandboxed iframe suite with Content-Security-Policy frame-src protection.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableMangaReader}
                    onChange={(e) => updateField("enableMangaReader", e.target.checked)}
                    className="h-4 w-4 rounded border-nordic-border text-nordic-pine focus:ring-nordic-pine"
                  />
                </label>

                {/* Module 4 */}
                <label className="flex items-center justify-between p-4 rounded-2xl border border-nordic-border bg-nordic-canvas/60 cursor-pointer hover:border-nordic-divider transition">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-nordic-muted p-2.5 border border-nordic-border text-nordic-pine">
                      <Server className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-nordic-ink">Dedicated Game Server Monitors</div>
                      <div className="text-[11px] text-nordic-subtle">
                        Operations dashboard cards tracking private studio gaming cluster nodes.
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.enableGameServers}
                    onChange={(e) => updateField("enableGameServers", e.target.checked)}
                    className="h-4 w-4 rounded border-nordic-border text-nordic-pine focus:ring-nordic-pine"
                  />
                </label>
              </div>

              {/* Ready Summary */}
              <div className="rounded-2xl border border-nordic-pine/20 bg-nordic-pine/5 p-4 text-xs text-nordic-pine flex items-center gap-3 mt-4">
                <ShieldCheck className="h-5 w-5 shrink-0 text-nordic-pine" />
                <span>
                  Ready to bootstrap: Clicking Activate will finalize the configuration, commit the database transaction, and lock the setup wizard.
                </span>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-nordic-border flex items-center justify-between gap-4">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2)}
                className="inline-flex items-center gap-2 rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink transition cursor-pointer"
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
                className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-6 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-nordic-pine/90 transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-7 py-3 text-xs font-medium text-white shadow-sm hover:bg-nordic-pine/90 transition disabled:opacity-50 cursor-pointer"
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
