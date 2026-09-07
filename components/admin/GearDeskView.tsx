"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { checkoutGearItem, checkinGearItem } from "@/app/actions/gear";
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

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-blue-400 mb-1">
            <Briefcase className="h-3.5 w-3.5" />
            <span>Hardware Management Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gated Gear Desk
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Custody tracking for cinema bodies, anamorphic lenses, lighting packs, and field audio. All checkouts require co-owner attribution.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center rounded-xl bg-zinc-900 p-1 border border-zinc-800">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "inventory"
                ? "bg-blue-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Active Inventory ({initialItems.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              activeTab === "audit"
                ? "bg-blue-600 text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Audit History ({logs.length})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs border ${
            feedback.type === "success"
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
              : "bg-red-950/40 text-red-300 border-red-800/60"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {activeTab === "inventory" ? (
        <div className="space-y-6">
          {/* Filters and Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative min-w-[280px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gear name, serial number, locker..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>

            {/* Status & Category Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center rounded-xl bg-zinc-900 p-0.5 border border-zinc-800">
                {["ALL", "AVAILABLE", "CHECKED_OUT", "MAINTENANCE"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-2.5 py-1 text-[10px] font-mono transition ${
                      statusFilter === st
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-zinc-400 hover:text-white"
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
                        ? "bg-zinc-700 text-white font-semibold"
                        : "bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="border-b border-zinc-800 bg-zinc-900/60 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-6 py-4">Item & Serial</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Condition</th>
                    <th className="px-4 py-4">Location / Custody</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
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
                          className="hover:bg-zinc-900/40 transition"
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-white">
                              {item.name}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-500">
                              SN: {item.serialNumber}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[10px] font-mono text-zinc-400">
                              {item.category}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {isAvailable && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 text-[10px] font-mono text-emerald-400 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                AVAILABLE
                              </span>
                            )}
                            {isCheckedOut && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 text-[10px] font-mono text-amber-300 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                CHECKED OUT
                              </span>
                            )}
                            {!isAvailable && !isCheckedOut && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/60 border border-red-800/60 px-2.5 py-1 text-[10px] font-mono text-red-400 font-semibold">
                                <Wrench className="h-3 w-3" />
                                MAINTENANCE
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-zinc-300">
                            {item.condition}
                          </td>

                          <td className="px-4 py-4">
                            {isCheckedOut && item.activeCheckout ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-amber-300 flex items-center gap-1">
                                  <span>{item.activeCheckout.userName}</span>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  Due: {new Date(item.activeCheckout.expectedReturn).toLocaleDateString("nb-NO")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-zinc-400 font-mono text-[11px]">
                                {item.storageLocation}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            {isAvailable && (
                              <button
                                onClick={() => setCheckoutItem(item)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-500 transition cursor-pointer"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                <span>Check Out</span>
                              </button>
                            )}

                            {isCheckedOut && (
                              <button
                                onClick={() => setCheckinItem(item)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-black shadow hover:bg-amber-400 transition cursor-pointer"
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
      ) : (
        /* Audit History Tab */
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800 bg-zinc-900/60 font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-6 py-4">Equipment</th>
                  <th className="px-4 py-4">Assignee</th>
                  <th className="px-4 py-4">Checkout Date</th>
                  <th className="px-4 py-4">Expected Return</th>
                  <th className="px-4 py-4">Status / Actual Return</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      No checkout history recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isReturned = !!log.actualReturn;
                    return (
                      <tr key={log.id} className="hover:bg-zinc-900/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">
                            {log.gearName}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">
                            SN: {log.serialNumber}
                          </div>
                        </td>

                        <td className="px-4 py-4 font-medium text-zinc-200">
                          {log.userName}
                        </td>

                        <td className="px-4 py-4 font-mono text-zinc-400">
                          {new Date(log.checkoutDate).toLocaleDateString("nb-NO")}
                        </td>

                        <td className="px-4 py-4 font-mono text-zinc-400">
                          {new Date(log.expectedReturn).toLocaleDateString("nb-NO")}
                        </td>

                        <td className="px-4 py-4">
                          {isReturned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                              Returned {new Date(log.actualReturn!).toLocaleDateString("nb-NO")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/60 border border-amber-800/50 px-2.5 py-0.5 text-[10px] font-mono text-amber-300">
                              <Clock className="h-3 w-3" />
                              Active Checkout
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-xs text-zinc-400 max-w-xs truncate">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setCheckoutItem(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-blue-400 mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Assign Equipment Custody</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Check Out {checkoutItem.name}
              </h2>
              <p className="text-xs font-mono text-zinc-500 mt-0.5">
                Serial: {checkoutItem.serialNumber} · Current: {checkoutItem.storageLocation}
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Assignee (Co-Owner / Producer)
                </label>
                <select
                  value={checkoutUserId}
                  onChange={(e) => setCheckoutUserId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role} — {u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Expected Return Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="date"
                    required
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Production Notes & Location
                </label>
                <textarea
                  rows={3}
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="e.g. Commercial shoot in Lofoten; paired with Teradek transmitter..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCheckoutItem(null)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setCheckinItem(null)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-amber-400 mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Return Equipment to Vault</span>
              </div>
              <h2 className="text-xl font-bold text-white">
                Check In {checkinItem.name}
              </h2>
              {checkinItem.activeCheckout && (
                <p className="text-xs text-zinc-400 mt-1">
                  Borrowed by <strong className="text-white">{checkinItem.activeCheckout.userName}</strong> on {new Date(checkinItem.activeCheckout.checkoutDate).toLocaleDateString("nb-NO")}
                </p>
              )}
            </div>

            <form onSubmit={handleCheckinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Inspected Return Condition
                </label>
                <select
                  value={checkinCondition}
                  onChange={(e) => setCheckinCondition(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Good">Good (Ready for production)</option>
                  <option value="Mint">Mint (Flawless condition)</option>
                  <option value="Needs Cleaning">Needs Sensor / Lens Cleaning</option>
                  <option value="Maintenance Required">Maintenance Required / Damaged</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Return & Maintenance Notes
                </label>
                <textarea
                  rows={3}
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  placeholder="e.g. Returned clean, battery charged, placed in Studio Locker A..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCheckinItem(null)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Confirm Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
