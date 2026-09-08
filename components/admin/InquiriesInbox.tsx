"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Inbox,
  MailOpen,
  Archive,
  Trash2,
  Search,
  Filter,
  Phone,
  Mail,
  Tag,
  Banknote,
  Globe2,
  Calendar,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { updateInquiryStatus, deleteInquiry } from "@/app/actions/inquiries";

export interface SerializedInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  discipline: string;
  budgetTier: string | null;
  details: string;
  message: string;
  domainSource: string;
  status: string;
  createdAt: string;
}

interface InquiriesInboxProps {
  inquiries: SerializedInquiry[];
}

type StatusFilter = "ALL" | "NEW" | "REVIEWED" | "ARCHIVED";

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  NEW: {
    label: "New",
    color: "bg-[#EAF3EE] border border-[#C5DFD0] text-[#2D5A3D]",
    icon: <Clock className="h-3 w-3" />,
  },
  REVIEWED: {
    label: "Reviewed",
    color: "bg-nordic-muted border border-nordic-border text-nordic-subtle",
    icon: <MailOpen className="h-3 w-3" />,
  },
  ARCHIVED: {
    label: "Archived",
    color: "bg-nordic-muted border border-nordic-border text-nordic-faint",
    icon: <Archive className="h-3 w-3" />,
  },
};

function InquiryCard({ inquiry }: { inquiry: SerializedInquiry }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusMeta = STATUS_META[inquiry.status] ?? STATUS_META.NEW;

  const handleStatus = (next: "NEW" | "REVIEWED" | "ARCHIVED") => {
    startTransition(async () => {
      await updateInquiryStatus(inquiry.id, next);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      await deleteInquiry(inquiry.id);
      router.refresh();
    });
  };

  const domainLabel =
    inquiry.domainSource === "MEDIA" ? "Graywood Media" : "Graywood Photography";

  return (
    <div
      className={`rounded-2xl border transition-all shadow-[0_4px_16px_rgba(28,27,25,0.04)] ${
        inquiry.status === "NEW"
          ? "border-[#C5DFD0] bg-[#F7FBF8]"
          : inquiry.status === "ARCHIVED"
          ? "border-nordic-border bg-nordic-muted/30 opacity-70"
          : "border-nordic-border bg-nordic-surface"
      }`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider ${statusMeta.color}`}
              >
                {statusMeta.icon}
                {statusMeta.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-nordic-border bg-nordic-surface px-2.5 py-0.5 text-[10px] font-mono text-nordic-subtle">
                <Globe2 className="h-2.5 w-2.5" />
                {domainLabel}
              </span>
            </div>

            <h3 className="text-sm font-semibold text-nordic-ink truncate">{inquiry.name}</h3>

            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <a
                href={`mailto:${inquiry.email}`}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-nordic-pine hover:underline"
              >
                <Mail className="h-3 w-3" />
                {inquiry.email}
              </a>
              {inquiry.phone && (
                <a
                  href={`tel:${inquiry.phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-nordic-subtle hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {inquiry.phone}
                </a>
              )}
            </div>
          </div>

          <span className="text-[10px] font-mono text-nordic-faint flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3" />
            {new Date(inquiry.createdAt).toLocaleDateString("nb-NO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Metadata chips */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-lg border border-nordic-border bg-nordic-muted px-2 py-1 text-[10px] font-mono text-nordic-subtle">
            <Tag className="h-2.5 w-2.5" />
            {inquiry.discipline}
          </span>
          {inquiry.budgetTier && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-nordic-border bg-nordic-muted px-2 py-1 text-[10px] font-mono text-nordic-subtle">
              <Banknote className="h-2.5 w-2.5" />
              {inquiry.budgetTier}
            </span>
          )}
        </div>

        {/* Message preview */}
        <p className="mt-3 text-xs text-nordic-subtle line-clamp-2 leading-relaxed">
          {inquiry.details || inquiry.message}
        </p>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-nordic-border/60 pt-4 space-y-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-nordic-faint mb-1.5">
              Full Message
            </div>
            <p className="text-xs text-nordic-ink leading-relaxed whitespace-pre-wrap rounded-xl border border-nordic-border bg-nordic-muted p-3">
              {inquiry.message}
            </p>
          </div>
          {inquiry.details && inquiry.details !== inquiry.message && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-nordic-faint mb-1.5">
                Project Details
              </div>
              <p className="text-xs text-nordic-ink leading-relaxed whitespace-pre-wrap rounded-xl border border-nordic-border bg-nordic-muted p-3">
                {inquiry.details}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="px-5 py-3 border-t border-nordic-border/60 flex items-center justify-between gap-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-mono text-nordic-subtle hover:text-nordic-ink transition"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Expand
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {isPending ? (
            <Loader2 className="h-4 w-4 text-nordic-faint animate-spin" />
          ) : (
            <>
              {inquiry.status !== "REVIEWED" && (
                <button
                  onClick={() => handleStatus("REVIEWED")}
                  className="inline-flex items-center gap-1 rounded-lg border border-nordic-border bg-nordic-surface px-2.5 py-1.5 text-[10px] font-mono text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted transition"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Mark Reviewed
                </button>
              )}
              {inquiry.status !== "ARCHIVED" && (
                <button
                  onClick={() => handleStatus("ARCHIVED")}
                  className="inline-flex items-center gap-1 rounded-lg border border-nordic-border bg-nordic-surface px-2.5 py-1.5 text-[10px] font-mono text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted transition"
                >
                  <Archive className="h-3 w-3" />
                  Archive
                </button>
              )}
              {inquiry.status === "ARCHIVED" && (
                <button
                  onClick={() => handleStatus("NEW")}
                  className="inline-flex items-center gap-1 rounded-lg border border-nordic-border bg-nordic-surface px-2.5 py-1.5 text-[10px] font-mono text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted transition"
                >
                  <Inbox className="h-3 w-3" />
                  Restore
                </button>
              )}
              {confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#9C4B33]">Confirm delete?</span>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#F4D7C8] bg-[#FDF3EE] px-2.5 py-1.5 text-[10px] font-mono text-[#9C4B33] hover:bg-[#F4D7C8] transition"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border border-nordic-border bg-nordic-surface p-1.5 text-nordic-subtle hover:bg-nordic-muted transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  title="Delete"
                  className="inline-flex items-center gap-1 rounded-lg border border-nordic-border bg-nordic-surface px-2.5 py-1.5 text-[10px] font-mono text-nordic-subtle hover:text-[#9C4B33] hover:border-[#F4D7C8] hover:bg-[#FDF3EE] transition"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function InquiriesInbox({ inquiries }: InquiriesInboxProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    return {
      newCount: inquiries.filter((i) => i.status === "NEW").length,
      reviewedCount: inquiries.filter((i) => i.status === "REVIEWED").length,
      archivedCount: inquiries.filter((i) => i.status === "ARCHIVED").length,
      total: inquiries.length,
    };
  }, [inquiries]);

  const filtered = useMemo(() => {
    let list = inquiries;
    if (statusFilter !== "ALL") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.discipline.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q) ||
          i.details.toLowerCase().includes(q)
      );
    }
    return list;
  }, [inquiries, statusFilter, search]);

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: counts.total },
    { key: "NEW", label: "New", count: counts.newCount },
    { key: "REVIEWED", label: "Reviewed", count: counts.reviewedCount },
    { key: "ARCHIVED", label: "Archived", count: counts.archivedCount },
  ];

  return (
    <div className="flex flex-col space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#C5DFD0] bg-[#EAF3EE] p-5 flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#2D5A3D] mb-2">
            Awaiting Response
          </span>
          <span className="text-3xl font-bold font-mono text-[#2D5A3D]">
            {counts.newCount}
          </span>
          <span className="text-xs text-[#2D5A3D]/70 mt-1">New inquiries</span>
        </div>
        <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-5 flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-wider text-nordic-subtle mb-2">
            Reviewed
          </span>
          <span className="text-3xl font-bold font-mono text-nordic-ink">
            {counts.reviewedCount}
          </span>
          <span className="text-xs text-nordic-subtle mt-1">Processed inquiries</span>
        </div>
        <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-5 flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-wider text-nordic-subtle mb-2">
            Total Ledger
          </span>
          <span className="text-3xl font-bold font-mono text-nordic-ink">
            {counts.total}
          </span>
          <span className="text-xs text-nordic-subtle mt-1">All time submissions</span>
        </div>
      </div>

      {/* Filter + Search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center rounded-xl border border-nordic-border bg-nordic-surface p-1 gap-1 self-start">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono transition ${
                statusFilter === tab.key
                  ? "bg-nordic-ink text-nordic-canvas font-semibold shadow-xs"
                  : "text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-muted"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
                  statusFilter === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-nordic-muted text-nordic-faint"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nordic-faint pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, project type…"
            className="w-full rounded-xl border border-nordic-border bg-nordic-surface pl-9 pr-4 py-2.5 text-xs text-nordic-ink placeholder:text-nordic-faint focus:outline-none focus:ring-2 focus:ring-nordic-pine/30 focus:border-nordic-pine transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-nordic-faint hover:text-nordic-subtle transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center">
        <span className="text-[11px] font-mono text-nordic-faint">
          <Filter className="h-3 w-3 inline mr-1 opacity-60" />
          Showing {filtered.length} of {inquiries.length} inquiries
        </span>
      </div>

      {/* Inquiry cards */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-16 text-center">
          <Inbox className="h-10 w-10 text-nordic-faint mx-auto mb-4 opacity-50" />
          <p className="text-sm font-serif text-nordic-ink">No Inquiries Found</p>
          <p className="text-xs text-nordic-subtle mt-1 max-w-sm mx-auto">
            {search
              ? "No submissions match your search query. Try adjusting the filters."
              : "Client commission requests submitted via the public site will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((inq) => (
            <InquiryCard key={inq.id} inquiry={inq} />
          ))}
        </div>
      )}
    </div>
  );
}
