"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyAlbumPin } from "@/app/actions/portal";
import {
  Lock,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface PinEntryFormProps {
  albumSlug: string;
  albumTitle: string;
}

export function PinEntryForm({ albumSlug, albumTitle }: PinEntryFormProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await verifyAlbumPin({
        albumSlug,
        pin: pin.trim(),
      });

      if (res.success) {
        // Refresh page to let Server Component render the authorized gallery
        router.refresh();
      } else {
        setErrorMessage(res.message);
        setPin("");
      }
    } catch {
      setErrorMessage("Network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[75vh] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-nordic-border bg-nordic-surface p-8 sm:p-10 shadow-[0_16px_50px_rgba(28,27,25,0.06)] relative overflow-hidden">
        {/* Subtle warm ambient background tone */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-nordic-pine/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-nordic-clay/5 blur-3xl pointer-events-none" />

        {/* Lock Icon Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-nordic-muted border border-nordic-border text-nordic-pine mb-5 shadow-xs">
            <Lock className="h-6 w-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-nordic-border bg-nordic-muted px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-nordic-pine mb-3">
            <Sparkles className="h-3 w-3" />
            <span>Private Proofing Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-nordic-ink">
            {albumTitle}
          </h1>
          <p className="text-xs text-nordic-subtle mt-2 max-w-xs mx-auto leading-relaxed">
            This gallery is restricted to authorized clients. Enter your bespoke access PIN to view and download high-resolution proofs.
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

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label
              htmlFor="client-pin-input"
              className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2 text-center"
            >
              Security Access PIN
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-nordic-faint pointer-events-none" />
              <input
                id="client-pin-input"
                type="password"
                required
                maxLength={32}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full rounded-xl border border-nordic-border bg-nordic-canvas pl-11 pr-4 py-3.5 text-center text-lg font-mono tracking-widest text-nordic-ink placeholder:text-nordic-faint focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine transition shadow-xs"
              />
            </div>
          </div>

          <button
            id="client-pin-submit-btn"
            type="submit"
            disabled={isSubmitting || !pin}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-nordic-pine px-6 py-3.5 text-sm font-medium text-white shadow-sm hover:bg-nordic-pine/90 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Unlock Gallery</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-nordic-border flex items-center justify-center gap-2 text-[11px] text-nordic-subtle font-mono relative z-10">
          <ShieldCheck className="h-3.5 w-3.5 text-nordic-pine" />
          <span>Encrypted Session · Zero-Discovery Protocol</span>
        </div>
      </div>
    </div>
  );
}
