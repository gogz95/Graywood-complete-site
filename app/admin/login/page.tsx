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
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[#09090b]">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-blue-400 mb-5 shadow-inner">
            <Shield className="h-7 w-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-blue-300 mb-3">
            <span>Operations Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Graywood Executive Dock
          </h1>
          <p className="text-xs text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Restricted access for studio administrators and co-owners. All sessions are cryptographically audited.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl bg-red-950/40 border border-red-800/60 p-4 text-xs text-red-300 shadow-md"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-email-input"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2"
            >
              Operator Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@graywood.no"
                autoFocus
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2"
            >
              Security Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>

          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

        {/* Quick Credentials Sandbox Autofill */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 space-y-2">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 text-center">
            Development Quick-Fill Credentials
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <button
              type="button"
              onClick={() =>
                autofillCredentials("admin@graywood.no", "admin-change-me-123!")
              }
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition text-center"
            >
              <div className="font-semibold text-blue-400">ADMIN</div>
              <div className="text-[10px] text-zinc-500 truncate">admin@graywood.no</div>
            </button>

            <button
              type="button"
              onClick={() =>
                autofillCredentials("partner@graywood.no", "coowner-change-me-123!")
              }
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-300 hover:text-white hover:border-zinc-700 transition text-center"
            >
              <div className="font-semibold text-amber-400">CO_OWNER</div>
              <div className="text-[10px] text-zinc-500 truncate">partner@graywood.no</div>
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-mono">
          <KeyRound className="h-3 w-3 text-emerald-400" />
          <span>Encrypted Iron-Session · Rate-Limited Terminal</span>
        </div>
      </div>
    </div>
  );
}
