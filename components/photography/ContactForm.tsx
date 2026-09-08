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

interface ContactFormProps {
  title?: string;
  description?: string;
}

export function ContactForm({ title, description }: ContactFormProps = {}) {
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
    <section id="contact" className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-8 sm:p-12 shadow-[0_16px_50px_rgba(28,27,25,0.06)] relative overflow-hidden">
        {/* Subtle warm ambient background tone */}
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-nordic-pine/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-nordic-clay/5 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 pb-8 border-b border-nordic-border">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Commission Inquiries</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-nordic-ink">
              {title || "Initiate a Commission"}
            </h2>
            <p className="text-sm text-nordic-subtle mt-2 max-w-xl leading-relaxed">
              {description ||
                "Available for editorial campaigns, architectural documentation, and select commercial projects throughout the Nordic region and internationally."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-xl bg-nordic-muted border border-nordic-border px-3.5 py-2 text-xs text-nordic-subtle">
              <Clock className="h-3.5 w-3.5 text-nordic-pine" />
              <span>Response time: &lt; 4 hours</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-nordic-muted border border-nordic-border px-3.5 py-2 text-xs text-nordic-subtle">
              <ShieldCheck className="h-3.5 w-3.5 text-nordic-pine" />
              <span>Direct Studio Contact</span>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div
            role="alert"
            className={`mb-8 flex items-start gap-3 rounded-2xl p-5 text-sm border shadow-xs ${
              statusMessage.type === "success"
                ? "bg-[#EAF3EE] text-[#2D5A3D] border-[#C5DFD0]"
                : "bg-[#FDF3EE] text-[#9C4B33] border-[#F4D7C8]"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2D5A3D] mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-[#9C4B33] mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-medium">
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
            <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-3">
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
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      isSelected
                        ? "bg-nordic-pine text-white border-nordic-pine shadow-xs"
                        : "bg-nordic-surface border-nordic-border text-nordic-subtle hover:border-nordic-pine/50 hover:text-nordic-ink"
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
            <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-3">
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
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      isSelected
                        ? "bg-nordic-pine text-white border-nordic-pine shadow-xs"
                        : "bg-nordic-surface border-nordic-border text-nordic-subtle hover:border-nordic-pine/50 hover:text-nordic-ink"
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
                className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2"
              >
                Full Name <span className="text-nordic-clay">*</span>
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Henrik Ibsen"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-nordic-canvas border text-xs text-nordic-ink placeholder-nordic-faint focus:outline-none focus:border-nordic-pine transition ${
                  fieldErrors.name ? "border-red-500" : "border-nordic-border"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-xs text-[#9C4B33] mt-1">{fieldErrors.name[0]}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2"
              >
                Email Address <span className="text-nordic-clay">*</span>
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="director@agency.no"
                className={`w-full px-3.5 py-2.5 rounded-xl bg-nordic-canvas border text-xs text-nordic-ink placeholder-nordic-faint focus:outline-none focus:border-nordic-pine transition ${
                  fieldErrors.email ? "border-red-500" : "border-nordic-border"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-xs text-[#9C4B33] mt-1">{fieldErrors.email[0]}</p>
              )}
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label
              htmlFor="contact-phone"
              className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2"
            >
              Contact Phone (Optional)
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+47 982 00 000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-nordic-canvas border border-nordic-border text-xs text-nordic-ink placeholder-nordic-faint focus:outline-none focus:border-nordic-pine transition"
            />
          </div>

          {/* Message Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="contact-message"
                className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle"
              >
                Project Scope & Deliverables <span className="text-nordic-clay">*</span>
              </label>
              <span className="text-[10px] font-mono text-nordic-faint">
                Min. 10 characters
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
              className={`w-full px-3.5 py-2.5 rounded-xl bg-nordic-canvas border text-xs text-nordic-ink placeholder-nordic-faint focus:outline-none focus:border-nordic-pine transition ${
                fieldErrors.message ? "border-red-500" : "border-nordic-border"
              }`}
            />
            {fieldErrors.message && (
              <p className="text-xs text-[#9C4B33] mt-1">{fieldErrors.message[0]}</p>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-nordic-border">
            <div className="flex items-center gap-2 text-xs text-nordic-subtle">
              <Mail className="h-3.5 w-3.5 text-nordic-faint" />
              <span>Encrypted transmission · Stored in Oslo archive</span>
            </div>
            <button
              id="contact-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-nordic-pine hover:bg-nordic-ink text-white font-mono text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
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
