"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { checkoutGearItem, checkinGearItem, createGearItem } from "@/app/actions/gear";
import {
  Briefcase,
  Search,
  CheckCircle2,
  Clock,
  Wrench,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  History,
  Calendar,
  AlertCircle,
  Loader2,
  Sparkles,
  Plus,
} from "lucide-react";

export interface SerializedGearItem {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  condition: string;
  status: string;
  storageLocation: string;
  notes: string | null;
  activeCheckout?: {
    id: string;
    userId: string;
    userName: string;
    checkoutDate: string;
    expectedReturn: string;
    checkoutNotes: string | null;
  } | null;
}

export interface SerializedCheckoutLog {
  id: string;
  gearId: string;
  gearName: string;
  serialNumber: string;
  userId: string;
  userName: string;
  checkoutDate: string;
  expectedReturn: string;
  actualReturn: string | null;
  checkoutNotes: string | null;
  returnNotes: string | null;
}

export interface SerializedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface GearDeskViewProps {
  initialItems: SerializedGearItem[];
  users: SerializedUser[];
  logs: SerializedCheckoutLog[];
}

export function GearDeskView({
  initialItems,
  users,
  logs,
}: GearDeskViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inventory" | "audit">("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [checkoutItem, setCheckoutItem] = useState<SerializedGearItem | null>(null);
  const [checkinItem, setCheckinItem] = useState<SerializedGearItem | null>(null);

  // Form states for checkout
  const [checkoutUserId, setCheckoutUserId] = useState(users[0]?.id ?? "");
  const [expectedReturn, setExpectedReturn] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [checkoutNotes, setCheckoutNotes] = useState("");

  // Form states for checkin
  const [checkinCondition, setCheckinCondition] = useState("Good");
  const [checkinNotes, setCheckinNotes] = useState("");

  // Add Equipment modal state
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newItemData, setNewItemData] = useState({
    name: "",
    category: "BODY",
    serialNumber: "",
    storageLocation: "Studio Locker",
    condition: "Good",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const categories = ["ALL", "BODY", "LENS", "LIGHTING", "AUDIO", "SUPPORT", "ACCESSORY"];

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        item.storageLocation.toLowerCase().includes(q);

      const matchesCat =
        categoryFilter === "ALL" || item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [initialItems, searchQuery, categoryFilter, statusFilter]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItem) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await checkoutGearItem({
      gearId: checkoutItem.id,
      userId: checkoutUserId,
      expectedReturn,
      notes: checkoutNotes,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setCheckoutItem(null);
      setCheckoutNotes("");
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinItem) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await checkinGearItem({
      gearId: checkinItem.id,
      logId: checkinItem.activeCheckout?.id,
      condition: checkinCondition,
      returnNotes: checkinNotes,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setCheckinItem(null);
      setCheckinNotes("");
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleAddEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const res = await createGearItem({
      name: newItemData.name,
      category: newItemData.category,
      serialNumber: newItemData.serialNumber,
      storageLocation: newItemData.storageLocation,
      condition: newItemData.condition,
      notes: newItemData.notes,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setAddItemOpen(false);
      setNewItemData({
        name: "",
        category: "BODY",
        serialNumber: "",
        storageLocation: "Studio Locker",
        condition: "Good",
        notes: "",
      });
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-nordic-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Hardware Management Desk</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-nordic-ink">
            Gated Gear Desk
          </h1>
          <p className="text-xs sm:text-sm text-nordic-subtle mt-1.5 max-w-xl leading-relaxed">
            Custody tracking for cinema bodies, anamorphic lenses, lighting packs, and field audio. All checkouts require co-owner attribution.
          </p>
        </div>

        {/* Header Actions & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAddItemOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-nordic-pine/90 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Equipment</span>
          </button>

          <div className="flex items-center rounded-xl bg-nordic-muted p-1 border border-nordic-border">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                activeTab === "inventory"
                  ? "bg-nordic-pine text-white shadow-xs"
                  : "text-nordic-subtle hover:text-nordic-ink"
              }`}
            >
              Active Inventory ({initialItems.length})
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition ${
                activeTab === "audit"
                  ? "bg-nordic-pine text-white shadow-xs"
                  : "text-nordic-subtle hover:text-nordic-ink"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Audit History ({logs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs border ${
            feedback.type === "success"
              ? "bg-[#EAF3EE] text-[#2D5A3D] border-[#C5DFD0]"
              : "bg-[#FDF3EE] text-[#9C4B33] border-[#F4D7C8]"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D5A3D] mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-[#9C4B33] mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {activeTab === "inventory" ? (
        initialItems.length === 0 ? (
          /* Empty Locker State */
          <div className="rounded-3xl border border-dashed border-nordic-border p-16 text-center bg-nordic-surface/50 shadow-[0_8px_30px_rgba(28,27,25,0.02)]">
            <Briefcase className="h-10 w-10 text-nordic-faint mx-auto mb-3" />
            <h3 className="text-base font-serif text-nordic-ink">Gear Locker Empty</h3>
            <p className="text-xs text-nordic-subtle mt-1 max-w-md mx-auto leading-relaxed">
              No hardware currently cataloged in the gear locker. Use &apos;Add Equipment&apos; above.
            </p>
            <button
              onClick={() => setAddItemOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-5 py-2.5 text-xs font-medium text-white shadow-xs hover:bg-nordic-pine/90 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Equipment</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Filters and Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative min-w-[280px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-nordic-faint pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gear name, serial number, locker..."
                className="w-full rounded-xl border border-nordic-border bg-nordic-surface pl-10 pr-4 py-2.5 text-xs text-nordic-ink placeholder:text-nordic-faint focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine transition shadow-xs"
              />
            </div>

            {/* Status & Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center rounded-xl bg-nordic-muted p-0.5 border border-nordic-border">
                {["ALL", "AVAILABLE", "CHECKED_OUT", "MAINTENANCE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-mono transition ${
                      statusFilter === st
                        ? "bg-nordic-pine text-white font-medium shadow-xs"
                        : "text-nordic-subtle hover:text-nordic-ink"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-mono transition ${
                      categoryFilter === cat
                        ? "bg-nordic-surface text-nordic-ink font-semibold border border-nordic-border shadow-xs"
                        : "bg-nordic-muted/60 text-nordic-subtle hover:text-nordic-ink border border-nordic-border/60"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl border border-nordic-border bg-nordic-surface overflow-hidden shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-nordic-ink">
                <thead className="border-b border-nordic-border bg-nordic-muted/50 font-mono text-[11px] uppercase tracking-wider text-nordic-subtle">
                  <tr>
                    <th className="px-6 py-4">Item & Serial</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Condition</th>
                    <th className="px-4 py-4">Location / Custody</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nordic-border/70">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-nordic-faint">
                        No equipment records found matching the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isAvailable = item.status === "AVAILABLE";
                      const isCheckedOut = item.status === "CHECKED_OUT";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-nordic-canvas/60 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-nordic-ink">
                              {item.name}
                            </div>
                            <div className="text-[11px] font-mono text-nordic-faint">
                              SN: {item.serialNumber}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-md bg-nordic-muted border border-nordic-border px-2.5 py-1 text-[10px] font-mono text-nordic-subtle">
                              {item.category}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {isAvailable && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3EE] border border-[#C5DFD0] px-2.5 py-1 text-[10px] font-mono text-[#2D5A3D] font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#2D5A3D]" />
                                AVAILABLE
                              </span>
                            )}
                            {isCheckedOut && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF3EE] border border-[#F4D7C8] px-2.5 py-1 text-[10px] font-mono text-[#9C4B33] font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#C86D51] animate-pulse" />
                                CHECKED OUT
                              </span>
                            )}
                            {!isAvailable && !isCheckedOut && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8EFEA] border border-[#E9D5C8] px-2.5 py-1 text-[10px] font-mono text-[#8C4E3A] font-medium">
                                <Wrench className="h-3 w-3" />
                                MAINTENANCE
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-nordic-subtle">
                            {item.condition}
                          </td>

                          <td className="px-4 py-4">
                            {isCheckedOut && item.activeCheckout ? (
                              <div className="space-y-0.5">
                                <div className="font-medium text-nordic-clay flex items-center gap-1">
                                  <span>{item.activeCheckout.userName}</span>
                                </div>
                                <div className="text-[10px] text-nordic-faint font-mono">
                                  Due: {new Date(item.activeCheckout.expectedReturn).toLocaleDateString("nb-NO")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-nordic-subtle font-mono text-[11px]">
                                {item.storageLocation}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            {isAvailable && (
                              <button
                                onClick={() => setCheckoutItem(item)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-nordic-pine px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-nordic-pine/90 transition cursor-pointer"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                <span>Check Out</span>
                              </button>
                            )}

                            {isCheckedOut && (
                              <button
                                onClick={() => setCheckinItem(item)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-nordic-clay px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-nordic-clay/90 transition cursor-pointer"
                              >
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                                <span>Check In</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    ) : (
        /* Audit History Tab */
        <div className="rounded-2xl border border-nordic-border bg-nordic-surface overflow-hidden shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-nordic-ink">
              <thead className="border-b border-nordic-border bg-nordic-muted/50 font-mono text-[11px] uppercase tracking-wider text-nordic-subtle">
                <tr>
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-4 py-4">Assignee</th>
                  <th className="px-4 py-4">Checkout Date</th>
                  <th className="px-4 py-4">Expected Return</th>
                  <th className="px-4 py-4">Status / Actual Return</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nordic-border/70">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-nordic-faint">
                      No checkout history recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isReturned = !!log.actualReturn;
                    return (
                      <tr key={log.id} className="hover:bg-nordic-canvas/60 transition">
                        <td className="px-6 py-4">
                          <div className="font-medium text-nordic-ink">
                            {log.gearName}
                          </div>
                          <div className="text-[10px] font-mono text-nordic-faint">
                            SN: {log.serialNumber}
                          </div>
                        </td>

                        <td className="px-4 py-4 font-medium text-nordic-ink">
                          {log.userName}
                        </td>

                        <td className="px-4 py-4 font-mono text-nordic-subtle">
                          {new Date(log.checkoutDate).toLocaleDateString("nb-NO")}
                        </td>

                        <td className="px-4 py-4 font-mono text-nordic-subtle">
                          {new Date(log.expectedReturn).toLocaleDateString("nb-NO")}
                        </td>

                        <td className="px-4 py-4">
                          {isReturned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF3EE] border border-[#C5DFD0] px-2.5 py-0.5 text-[10px] font-mono text-[#2D5A3D]">
                              Returned {new Date(log.actualReturn!).toLocaleDateString("nb-NO")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF3EE] border border-[#F4D7C8] px-2.5 py-0.5 text-[10px] font-mono text-[#9C4B33]">
                              <Clock className="h-3 w-3" />
                              Active Checkout
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-nordic-subtle max-w-xs truncate">
                          {log.checkoutNotes || log.returnNotes || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHECK OUT MODAL */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-ink/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_20px_60px_rgba(28,27,25,0.12)] relative">
            <button
              onClick={() => setCheckoutItem(null)}
              className="absolute top-6 right-6 text-nordic-faint hover:text-nordic-ink transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Assign Equipment Custody</span>
              </div>
              <h2 className="text-2xl font-serif text-nordic-ink tracking-tight">
                Check Out {checkoutItem.name}
              </h2>
              <p className="text-xs font-mono text-nordic-faint mt-0.5">
                Serial: {checkoutItem.serialNumber} · Current: {checkoutItem.storageLocation}
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2">
                  Assignee (Co-Owner / Producer)
                </label>
                <select
                  value={checkoutUserId}
                  onChange={(e) => setCheckoutUserId(e.target.value)}
                  className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-3 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role} — {u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2">
                  Expected Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-nordic-faint pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    className="w-full rounded-xl border border-nordic-border bg-nordic-canvas pl-10 pr-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2">
                  Production Notes & Location
                </label>
                <textarea
                  rows={3}
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="e.g. Commercial shoot in Lofoten; paired with Teradek transmitter..."
                  className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-sm text-nordic-ink placeholder:text-nordic-faint focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutItem(null)}
                  className="rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-6 py-2.5 text-xs font-medium text-white hover:bg-nordic-pine/90 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Confirm Checkout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECK IN MODAL */}
      {checkinItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-ink/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_20px_60px_rgba(28,27,25,0.12)] relative">
            <button
              onClick={() => setCheckinItem(null)}
              className="absolute top-6 right-6 text-nordic-faint hover:text-nordic-ink transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-nordic-clay mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Return Equipment to Vault</span>
              </div>
              <h2 className="text-2xl font-serif text-nordic-ink tracking-tight">
                Check In {checkinItem.name}
              </h2>
              {checkinItem.activeCheckout && (
                <p className="text-xs text-nordic-subtle mt-1">
                  Borrowed by <strong className="text-nordic-ink">{checkinItem.activeCheckout.userName}</strong> on {new Date(checkinItem.activeCheckout.checkoutDate).toLocaleDateString("nb-NO")}
                </p>
              )}
            </div>

            <form onSubmit={handleCheckinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2">
                  Inspected Return Condition
                </label>
                <select
                  value={checkinCondition}
                  onChange={(e) => setCheckinCondition(e.target.value)}
                  className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-3 text-sm text-nordic-ink focus:border-nordic-clay focus:outline-none focus:ring-1 focus:ring-nordic-clay"
                >
                  <option value="Good">Good (Ready for production)</option>
                  <option value="Mint">Mint (Flawless condition)</option>
                  <option value="Needs Cleaning">Needs Sensor / Lens Cleaning</option>
                  <option value="Maintenance Required">Maintenance Required / Damaged</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-2">
                  Return & Maintenance Notes
                </label>
                <textarea
                  rows={3}
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  placeholder="e.g. Returned clean, battery charged, placed in Studio Locker A..."
                  className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-sm text-nordic-ink placeholder:text-nordic-faint focus:border-nordic-clay focus:outline-none focus:ring-1 focus:ring-nordic-clay"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCheckinItem(null)}
                  className="rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-clay px-6 py-2.5 text-xs font-medium text-white hover:bg-nordic-clay/90 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Confirm Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EQUIPMENT MODAL */}
      {addItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-ink/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_20px_60px_rgba(28,27,25,0.12)] relative">
            <button
              onClick={() => setAddItemOpen(false)}
              className="absolute top-6 right-6 text-nordic-faint hover:text-nordic-ink transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Locker Ingestion</span>
              </div>
              <h2 className="text-2xl font-serif text-nordic-ink tracking-tight">
                Add Hardware Equipment
              </h2>
              <p className="text-xs text-nordic-subtle mt-0.5">
                Catalog a new camera body, lens, lighting, or audio kit into the tracking system.
              </p>
            </div>

            <form onSubmit={handleAddEquipmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hasselblad H6D-100c Medium Format Body"
                  value={newItemData.name}
                  onChange={(e) =>
                    setNewItemData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-1.5">
                    Category *
                  </label>
                  <select
                    value={newItemData.category}
                    onChange={(e) =>
                      setNewItemData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none font-mono text-xs"
                  >
                    <option value="BODY">BODY (Camera)</option>
                    <option value="LENS">LENS (Optics)</option>
                    <option value="LIGHTING">LIGHTING</option>
                    <option value="AUDIO">AUDIO</option>
                    <option value="SUPPORT">SUPPORT (Tripods, Rigs)</option>
                    <option value="ACCESSORY">ACCESSORY</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-1.5">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. H6D-100C-98421"
                    value={newItemData.serialNumber}
                    onChange={(e) =>
                      setNewItemData((prev) => ({ ...prev, serialNumber: e.target.value }))
                    }
                    className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-1.5">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Studio Locker A1"
                    value={newItemData.storageLocation}
                    onChange={(e) =>
                      setNewItemData((prev) => ({ ...prev, storageLocation: e.target.value }))
                    }
                    className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-1.5">
                    Condition
                  </label>
                  <select
                    value={newItemData.condition}
                    onChange={(e) =>
                      setNewItemData((prev) => ({ ...prev, condition: e.target.value }))
                    }
                    className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none text-xs"
                  >
                    <option value="Mint">Mint</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Technical Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes dual CFast cards and high-capacity battery packs..."
                  value={newItemData.notes}
                  onChange={(e) =>
                    setNewItemData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className="w-full rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-sm text-nordic-ink placeholder:text-nordic-faint focus:border-nordic-pine focus:outline-none focus:ring-1 focus:ring-nordic-pine"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddItemOpen(false)}
                  className="rounded-xl border border-nordic-border bg-nordic-canvas px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-6 py-2.5 text-xs font-medium text-white hover:bg-nordic-pine/90 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Catalog Hardware</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
