"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/app/actions/admin";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await adminLogin({ email, password });
      if (res.success) {
        if (res.role === "CO_OWNER") {
          router.push("/admin/gear");
        } else {
          router.push("/admin/dashboard");
        }
        router.refresh();
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Network error occurred during authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const autofillCredentials = (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-nordic-canvas">
      <div className="w-full max-w-md rounded-3xl border border-nordic-border bg-nordic-surface p-8 sm:p-10 shadow-[0_16px_50px_rgba(28,27,25,0.06)] relative overflow-hidden">
        {/* Subtle Ambient Tone */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-nordic-pine/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-nordic-clay/5 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nordic-muted border border-nordic-border text-nordic-pine mb-5 shadow-xs">
            <Shield className="h-6 w-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-nordic-border bg-nordic-muted px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-nordic-pine mb-3">
            <span>Operations Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-nordic-ink">
            Graywood Executive Dock
          </h1>
          <p className="text-xs text-nordic-subtle mt-2 max-w-xs mx-auto leading-relaxed">
            Restricted access for studio administrators and co-owners. All sessions are cryptographically audited.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl bg-[#FDF3EE] border border-[#F4D7C8] p-4 text-xs text-[#9C4B33] shadow-xs relative z-10"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-[#9C4B33] mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label
              htmlFor="admin-email-input"
              className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2"
            >
              Operator Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-nordic-ink/30 pointer-events-none transition-colors" />
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@graywood.no"
                autoFocus
                className="w-full rounded-xl border border-nordic-border bg-nordic-canvas pl-11 pr-4 py-3 text-sm text-nordic-ink placeholder:text-nordic-faint/70 focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine transition shadow-xs"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2"
            >
              Security Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-nordic-ink/30 pointer-events-none transition-colors" />
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-nordic-border bg-nordic-canvas pl-11 pr-4 py-3 text-sm text-nordic-ink placeholder:text-nordic-faint/70 focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine transition shadow-xs"
              />
            </div>
          </div>

          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-nordic-pine px-6 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-nordic-pine/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authorizing...</span>
              </>
            ) : (
              <>
                <span>Access Command Suite</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Sandbox Autofill (Development / Staging Only) */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-8 pt-6 border-t border-nordic-border space-y-2 relative z-10">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-nordic-faint text-center">
              Development Quick-Fill Credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <button
                type="button"
                onClick={() =>
                  autofillCredentials("admin@graywood.no", "admin-change-me-123!")
                }
                className="rounded-xl border border-nordic-border bg-nordic-muted/50 p-2 text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-surface transition text-center cursor-pointer"
              >
                <div className="font-semibold text-nordic-pine">ADMIN</div>
                <div className="text-[10px] text-nordic-faint truncate">admin@graywood.no</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  autofillCredentials("partner@graywood.no", "coowner-change-me-123!")
                }
                className="rounded-xl border border-nordic-border bg-nordic-muted/50 p-2 text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-surface transition text-center cursor-pointer"
              >
                <div className="font-semibold text-nordic-clay">CO_OWNER</div>
                <div className="text-[10px] text-nordic-faint truncate">partner@graywood.no</div>
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-nordic-subtle font-mono relative z-10">
          <KeyRound className="h-3 w-3 text-nordic-pine" />
          <span>Encrypted Iron-Session · Rate-Limited Terminal</span>
        </div>
      </div>
    </div>
  );
}
