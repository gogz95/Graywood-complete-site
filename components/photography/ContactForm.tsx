"use client";

import React, { useState } from "react";
import { submitContactInquiry } from "@/app/actions/contact";
import { ContactInquirySchema, type ContactInquiryInput } from "@/lib/validations";
import { useDomain } from "@/components/DomainProvider";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  Mail,
  Sparkles,
} from "lucide-react";

const PROJECT_TYPES = [
  "Editorial Campaign",
  "Architectural Archive",
  "Commercial Production",
  "Private Portraiture",
  "Fine Art Print Acquisition",
];

const BUDGET_RANGES = [
  "< 25,000 NOK",
  "25,000 – 60,000 NOK",
  "60,000 – 150,000 NOK",
  "Enterprise / Retainer",
];

export function ContactForm() {
  const domain = useDomain();
  const [selectedProjectType, setSelectedProjectType] = useState<string>("Editorial Campaign");
  const [selectedBudget, setSelectedBudget] = useState<string>("25,000 – 60,000 NOK");

  const [formData, setFormData] = useState<ContactInquiryInput>({
    name: "",
    email: "",
    phone: "",
    message: "",
    domainSource: domain,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validate raw user message length before prepending scope metadata
    const rawMessage = formData.message.trim();
    if (rawMessage.length < 10) {
      setFieldErrors((prev) => ({
        ...prev,
        message: ["Message must be at least 10 characters."],
      }));
      return;
    }

    // Append project type & budget to message payload
    const enrichedMessage = `[Scope: ${selectedProjectType} | Budget: ${selectedBudget}]\n\n${rawMessage}`;

    const payload = {
      ...formData,
      message: enrichedMessage,
      domainSource: domain,
    };

    // Client-side Zod validation
    const validation = ContactInquirySchema.safeParse(payload);
    if (!validation.success) {
      setFieldErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await submitContactInquiry(validation.data);
      if (res.success) {
        setStatusMessage({ type: "success", text: res.message });
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          domainSource: domain,
        });
        setFieldErrors({});
      } else {
        setStatusMessage({ type: "error", text: res.message });
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Network error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-24">
      <div className="rounded-3xl border border-border bg-surface p-8 sm:p-14 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background effect */}
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 pb-8 border-b border-border/80">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-accent mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Commission Inquiries</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Initiate a Commission
            </h2>
            <p className="text-sm text-muted mt-2 max-w-xl leading-relaxed">
              Available for editorial campaigns, architectural documentation, and select commercial projects throughout the Nordic region and internationally.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-surface-2 border border-border px-3.5 py-2 text-xs text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span>Response time: &lt; 4 hours</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface-2 border border-border px-3.5 py-2 text-xs text-zinc-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Direct Studio Contact</span>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            role="alert"
            className={`mb-8 flex items-start gap-3 rounded-2xl p-5 text-sm border shadow-lg ${
              statusMessage.type === "success"
                ? "bg-emerald-950/50 text-emerald-200 border-emerald-800/80"
                : "bg-red-950/50 text-red-200 border-red-800/80"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">
                {statusMessage.type === "success"
                  ? "Inquiry Dispatched"
                  : "Submission Notice"}
              </p>
              <p className="text-xs opacity-90">{statusMessage.text}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Type Selection Chips */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              1. Project Discipline / Scope
            </label>
            <div className="flex flex-wrap gap-2.5">
              {PROJECT_TYPES.map((type) => {
                const isSelected = selectedProjectType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedProjectType(type)}
                    className={`rounded-xl px-4 py-2 text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? "bg-accent text-white shadow-md shadow-accent/20 border border-accent"
                        : "border border-border bg-surface-2 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Range Selection Chips */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-3">
              2. Anticipated Production Budget (NOK)
            </label>
            <div className="flex flex-wrap gap-2.5">
              {BUDGET_RANGES.map((range) => {
                const isSelected = selectedBudget === range;
                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setSelectedBudget(range)}
                    className={`rounded-xl px-4 py-2 text-xs font-mono transition cursor-pointer ${
                      isSelected
                        ? "bg-accent text-white shadow-md shadow-accent/20 border border-accent"
                        : "border border-border bg-surface-2 text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    {range}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name & Email Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="contact-name"
                className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2"
              >
                Full Name <span className="text-accent">*</span>
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Henrik Ibsen"
                className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent transition ${
                  fieldErrors.name ? "border-red-500" : "border-border"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2"
              >
                Email Address <span className="text-accent">*</span>
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="director@agency.no"
                className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent transition ${
                  fieldErrors.email ? "border-red-500" : "border-border"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label
              htmlFor="contact-phone"
              className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2"
            >
              Phone / Signal <span className="text-muted/60 lowercase">(optional)</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="+47 982 00 000"
              className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent transition"
            />
          </div>

          {/* Message Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="contact-message"
                className="block text-xs font-semibold uppercase tracking-wider text-muted"
              >
                Project Details & Timeline <span className="text-accent">*</span>
              </label>
              <span className="text-[11px] font-mono text-muted">
                {formData.message.length} chars
              </span>
            </div>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder="Outline project timeline, locations, deliverables, aesthetic vision..."
              className={`w-full rounded-xl border bg-surface-2 px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent transition ${
                fieldErrors.message ? "border-red-500" : "border-border"
              }`}
            />
            {fieldErrors.message && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.message[0]}</p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              <span>Encrypted transmission · Stored in Oslo archive</span>
            </div>
            <button
              id="contact-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-accent px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-accent/25 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Dispatch Commission Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
