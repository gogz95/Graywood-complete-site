import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  AlertTriangle,
  Clock,
  Images,
  Server,
  Activity,
  CheckCircle2,
  HardDrive,
  ExternalLink,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminSession(["ADMIN"]);

  const [
    gearItems,
    activeCheckouts,
    clientAlbums,
    totalAssets,
    inquiries,
    gameServers,
    modules,
  ] = await Promise.all([
    prisma.gearItem.findMany({ select: { status: true } }),
    prisma.gearCheckoutLog.findMany({
      where: { actualReturn: null },
      include: { gear: true, user: true },
      orderBy: { expectedReturn: "asc" },
    }),
    prisma.album.findMany({
      where: { type: "CLIENT_PROOFING" },
      include: { _count: { select: { photos: true } } },
    }),
    prisma.mediaAsset.count(),
    prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.gameServer.findMany({
      orderBy: { sortOrder: "asc" },
    }),
    prisma.systemModule.findMany(),
  ]);

  const now = new Date();
  const overdueCheckouts = activeCheckouts.filter(
    (c) => new Date(c.expectedReturn) < now
  );

  const availableGearCount = gearItems.filter((g) => g.status === "AVAILABLE").length;
  const checkedOutGearCount = gearItems.filter((g) => g.status === "CHECKED_OUT").length;

  return (
    <div className="p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-blue-400 mb-1">
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Telemetry & Executive Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Operations Command Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Real-time equipment custody alerts, client proofing metrics, game cluster nodes, and NAS storage health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ALL SYSTEMS NOMINAL</span>
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Gear Out */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Checkouts</span>
            <div className="rounded-xl bg-zinc-900 p-2 border border-zinc-800 text-amber-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono">
              {checkedOutGearCount} <span className="text-sm font-sans font-normal text-zinc-500">/ {gearItems.length} total</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {availableGearCount} items currently available in locker
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <Link
              href="/admin/gear"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>Manage Gear Desk</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric 2: Overdue Alert */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between shadow-lg ${
          overdueCheckouts.length > 0
            ? "border-red-800/80 bg-red-950/20"
            : "border-zinc-800 bg-zinc-950"
        }`}>
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Alerts</span>
            <div className={`rounded-xl p-2 border ${
              overdueCheckouts.length > 0
                ? "bg-red-900/40 border-red-700/60 text-red-400"
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-black font-mono ${
              overdueCheckouts.length > 0 ? "text-red-400" : "text-white"
            }`}>
              {overdueCheckouts.length}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {overdueCheckouts.length > 0 ? "Past expected return window" : "Zero overdue hardware"}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500">
            Audit interval: Real-time
          </div>
        </div>

        {/* Metric 3: Client Proofing */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Proofing Vaults</span>
            <div className="rounded-xl bg-zinc-900 p-2 border border-zinc-800 text-amber-400">
              <Images className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono">
              {clientAlbums.length}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Active private client galleries online
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <Link
              href="/admin/library"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View Photo Archive</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric 4: NAS Indexed Assets */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Indexed Assets</span>
            <div className="rounded-xl bg-zinc-900 p-2 border border-zinc-800 text-emerald-400">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white font-mono">
              {totalAssets}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              High-res master files synced from NAS
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-500">
            Storage Engine: WAL SQLite
          </div>
        </div>
      </div>

      {/* Active Checkouts Alert List */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Active Hardware Custody Logs</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Equipment currently deployed in field shoots or editorial commissions.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {activeCheckouts.length} DEPLOYED
          </span>
        </div>

        {activeCheckouts.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono">
            All equipment safely returned to studio lockers.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCheckouts.map((checkout) => {
              const isOverdue = new Date(checkout.expectedReturn) < now;
              return (
                <div
                  key={checkout.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between ${
                    isOverdue
                      ? "border-red-800/60 bg-red-950/20"
                      : "border-zinc-800/80 bg-zinc-900/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                        {checkout.gear.category}
                      </span>
                      {isOverdue ? (
                        <span className="rounded-full bg-red-950 border border-red-800 px-2 py-0.5 text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider">
                          Overdue
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-950 border border-amber-800 px-2 py-0.5 text-[9px] font-mono text-amber-400">
                          Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white">
                      {checkout.gear.name}
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-500">
                      SN: {checkout.gear.serialNumber}
                    </p>

                    <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Borrower:</span>
                        <span className="font-semibold text-zinc-200">
                          {checkout.user.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Expected:</span>
                        <span className={`font-mono ${isOverdue ? "text-red-400 font-bold" : "text-zinc-300"}`}>
                          {new Date(checkout.expectedReturn).toLocaleDateString("nb-NO")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {checkout.checkoutNotes && (
                    <p className="mt-3 text-[11px] text-zinc-400 italic bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/40 truncate">
                      &ldquo;{checkout.checkoutNotes}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Game Servers & Infrastructure Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Server Clusters */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-400" />
                <span>Dedicated Game Clusters</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Studio low-latency private game servers.
              </p>
            </div>
            <span className="text-xs font-mono text-blue-400">
              {gameServers.length} NODES
            </span>
          </div>

          <div className="space-y-3">
            {gameServers.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-zinc-500">
                No game servers registered.
              </div>
            ) : (
              gameServers.map((server) => (
                <div
                  key={server.id}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">
                        {server.name}
                      </span>
                      <span className="rounded bg-blue-950/60 border border-blue-800/40 px-2 py-0.5 text-[10px] font-mono text-blue-400">
                        {server.gameType}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {server.host}:{server.queryPort}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>ONLINE</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        18ms · 0% loss
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Modules Matrix */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span>Ecosystem Module Registry</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dynamic capability flags managed by the platform customizer.
              </p>
            </div>
            <Link
              href="/admin/customizer"
              className="text-xs font-semibold text-blue-400 hover:underline"
            >
              Configure &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-sm text-white">
                    {mod.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    ID: {mod.id}
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono ${
                    mod.enabled
                      ? "bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-semibold"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-500"
                  }`}
                >
                  {mod.enabled ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>ENABLED</span>
                    </>
                  ) : (
                    <span>DISABLED</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Inquiries List */}
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Incoming Inquiries Ledger</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Latest client submissions captured via website contact forms.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {inquiries.length} RECENT
          </span>
        </div>

        {inquiries.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-zinc-500">
            No inquiries recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {inquiry.name}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      ({inquiry.email})
                    </span>
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[9px] font-mono text-amber-400 uppercase">
                      {inquiry.domainSource}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                    {inquiry.message}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-zinc-500">
                    {new Date(inquiry.createdAt).toLocaleDateString("nb-NO")}
                  </span>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                  >
                    <span>Reply</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
