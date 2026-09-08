import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { queryGameServers } from "@/lib/gameServers";
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
  ExternalLink,
  ArrowRight,
  Sparkles,
  Inbox,
  BookOpen,
  PlusCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdminSession(["ADMIN"]);

  const now = new Date();

  const [
    checkedOutGearCount,
    availableGearCount,
    totalGearCount,
    overdueCheckoutsCount,
    activeCheckouts,
    proofingGalleriesCount,
    totalAssets,
    unprocessedInquiriesCount,
    inquiries,
    liveGameServers,
    modules,
    mangaReaderModule,
  ] = await Promise.all([
    prisma.gearItem.count({ where: { status: "CHECKED_OUT" } }),
    prisma.gearItem.count({ where: { status: "AVAILABLE" } }),
    prisma.gearItem.count(),
    prisma.gearItem.count({
      where: {
        status: "CHECKED_OUT",
        expectedReturn: { lt: now },
      },
    }),
    prisma.gearItem.findMany({
      where: { status: "CHECKED_OUT" },
      orderBy: { expectedReturn: "asc" },
      take: 12,
    }),
    prisma.album.count({ where: { type: "CLIENT_PROOFING" } }),
    prisma.mediaAsset.count(),
    prisma.contactInquiry.count({ where: { status: "NEW" } }),
    prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    queryGameServers(),
    prisma.systemModule.findMany({
      orderBy: { key: "asc" },
    }),
    prisma.systemModule.findUnique({
      where: { key: "MANGA_READER" },
    }),
  ]);

  return (
    <div className="w-full flex flex-col space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-nordic-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-1">
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Telemetry & Executive Overview</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-tight text-nordic-ink">
            Operations Command Center
          </h1>
          <p className="text-xs sm:text-sm text-nordic-subtle mt-1 max-w-xl">
            Real-time equipment custody alerts, client proofing metrics, game cluster nodes, and NAS storage health.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#C5DFD0] bg-[#EAF3EE] px-3.5 py-1.5 text-xs font-mono text-[#2D5A3D]">
            <span className="h-2 w-2 rounded-full bg-[#2D5A3D] animate-ping" />
            <span>ALL SYSTEMS NOMINAL</span>
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Gear Out */}
        <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
          <div className="flex items-center justify-between text-nordic-subtle">
            <span className="text-xs font-mono uppercase tracking-wider">Active Checkouts</span>
            <div className="rounded-xl bg-nordic-muted p-2 border border-nordic-border text-nordic-clay">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-nordic-ink font-mono">
              {checkedOutGearCount} <span className="text-sm font-sans font-normal text-nordic-faint">/ {totalGearCount} total</span>
            </div>
            <p className="text-xs text-nordic-subtle mt-1">
              {availableGearCount} items currently available in locker
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-nordic-border">
            <Link
              href="/admin/gear"
              className="text-xs font-medium text-nordic-pine hover:underline flex items-center gap-1"
            >
              <span>Manage Gear Desk</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric 2: Overdue Alert */}
        <div className={`rounded-2xl border p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(28,27,25,0.04)] ${
          overdueCheckoutsCount > 0
            ? "border-[#F4D7C8] bg-[#FDF3EE]"
            : "border-nordic-border bg-nordic-surface"
        }`}>
          <div className="flex items-center justify-between text-nordic-subtle">
            <span className="text-xs font-mono uppercase tracking-wider">Overdue Alerts</span>
            <div className={`rounded-xl p-2 border ${
              overdueCheckoutsCount > 0
                ? "bg-[#F4D7C8]/50 border-[#F4D7C8] text-[#9C4B33]"
                : "bg-nordic-muted border-nordic-border text-nordic-faint"
            }`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-3xl font-bold font-mono ${
              overdueCheckoutsCount > 0 ? "text-[#9C4B33]" : "text-nordic-ink"
            }`}>
              {overdueCheckoutsCount}
            </div>
            <p className="text-xs text-nordic-subtle mt-1">
              {overdueCheckoutsCount > 0
                ? "Equipment past scheduled return deadline"
                : "All deployed hardware within return windows"}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-nordic-border">
            <span className="text-xs font-mono text-nordic-faint">
              Strict 48-Hour Return Policy
            </span>
          </div>
        </div>

        {/* Metric 3: Client Proofing */}
        <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
          <div className="flex items-center justify-between text-nordic-subtle">
            <span className="text-xs font-mono uppercase tracking-wider">Client Proofing</span>
            <div className="rounded-xl bg-nordic-muted p-2 border border-nordic-border text-nordic-pine">
              <Images className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-nordic-ink font-mono">
              {proofingGalleriesCount}
            </div>
            <p className="text-xs text-nordic-subtle mt-1">
              Active PIN-protected vaults for clients
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-nordic-border">
            <Link
              href="/admin/proofing"
              className="text-xs font-medium text-nordic-pine hover:underline flex items-center gap-1"
            >
              <span>Manage Vaults</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric 4: Inquiries */}
        <div className="rounded-2xl border border-nordic-border bg-nordic-surface p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
          <div className="flex items-center justify-between text-nordic-subtle">
            <span className="text-xs font-mono uppercase tracking-wider">Client Inquiries</span>
            <div className="rounded-xl bg-nordic-muted p-2 border border-nordic-border text-nordic-clay">
              <Inbox className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-nordic-ink font-mono">
              {unprocessedInquiriesCount}
            </div>
            <p className="text-xs text-nordic-subtle mt-1">
              New client submissions awaiting response
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-nordic-border">
            <Link
              href="/admin/inquiries"
              className="text-xs font-medium text-nordic-pine hover:underline flex items-center gap-1"
            >
              <span>Open Inquiries Inbox</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Active Checkouts Alert List */}
      <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-nordic-border">
          <div>
            <h2 className="text-xl font-serif text-nordic-ink flex items-center gap-2">
              <Clock className="h-4 w-4 text-nordic-clay" />
              <span>Active Hardware Custody Logs</span>
            </h2>
            <p className="text-xs text-nordic-subtle mt-0.5">
              Equipment currently deployed in field shoots or editorial commissions.
            </p>
          </div>
          <span className="text-xs font-mono text-nordic-faint">
            {activeCheckouts.length} DEPLOYED
          </span>
        </div>

        {activeCheckouts.length === 0 ? (
          <div className="border border-nordic-border bg-nordic-surface rounded-2xl p-12 text-center">
            <Briefcase className="h-8 w-8 text-nordic-pine mx-auto mb-3 opacity-60" />
            <p className="text-sm font-serif text-nordic-ink">All Hardware In Studio Locker</p>
            <p className="text-xs text-nordic-subtle mt-1 max-w-sm mx-auto">
              Zero items are currently checked out. Deployed camera bodies, lenses, and lighting will appear here with custody timers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCheckouts.map((item) => {
              const isOverdue = item.expectedReturn && new Date(item.expectedReturn) < now;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between ${
                    isOverdue
                      ? "border-[#F4D7C8] bg-[#FDF3EE]"
                      : "border-nordic-border bg-nordic-muted/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="rounded-md bg-nordic-surface border border-nordic-border px-2 py-0.5 text-[10px] font-mono text-nordic-subtle">
                        {item.category}
                      </span>
                      {isOverdue ? (
                        <span className="rounded-full bg-[#FDF3EE] border border-[#F4D7C8] px-2 py-0.5 text-[9px] font-mono text-[#9C4B33] font-bold uppercase tracking-wider">
                          Overdue
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#FDF3EE] border border-[#F4D7C8] px-2 py-0.5 text-[9px] font-mono text-[#9C4B33]">
                          Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-nordic-ink">
                      {item.brand} {item.name}
                    </h3>
                    <p className="text-[11px] font-mono text-nordic-faint">
                      SN: {item.serialNumber || "N/A"}
                    </p>

                    <div className="mt-3 pt-3 border-t border-nordic-border/60 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-nordic-subtle">Custodian:</span>
                        <span className="font-medium text-nordic-ink">
                          {item.custodian || "Assigned"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-nordic-subtle">Expected:</span>
                        <span className={`font-mono ${isOverdue ? "text-[#9C4B33] font-bold" : "text-nordic-subtle"}`}>
                          {item.expectedReturn ? new Date(item.expectedReturn).toLocaleDateString("nb-NO") : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-3 text-[11px] text-nordic-subtle italic bg-nordic-surface p-2 rounded-lg border border-nordic-border/60 truncate">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* First-Party Sister Service Integration: Graywood-Reader Gateway Tile */}
      {mangaReaderModule?.enabled && (
        <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-nordic-pine/10 p-3.5 border border-nordic-pine/20 text-nordic-pine shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-nordic-pine mb-1">
                  <span>First-Party Subservice Gateway</span>
                </div>
                <h2 className="text-xl font-serif text-nordic-ink">
                  Graywood-Reader Archival Suite
                </h2>
                <p className="text-xs text-nordic-subtle mt-1 max-w-xl leading-relaxed">
                  Single-sign-on enabled gateway to native comic, manga, and offline visual literature infrastructure on <code className="text-nordic-ink font-mono text-[11px]">reader.graywood.no</code>.
                </p>
              </div>
            </div>

            <a
              href="https://reader.graywood.no"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-5 py-2.5 text-xs font-medium text-white transition hover:bg-nordic-pine/90 shadow-sm shrink-0 self-start sm:self-center"
            >
              <span>Launch Reader</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Game Servers & Infrastructure Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Server Clusters (Native Gamehosting-by-Graywood-2 Integration) */}
        <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-nordic-border">
              <div>
                <h2 className="text-xl font-serif text-nordic-ink flex items-center gap-2">
                  <Server className="h-4 w-4 text-nordic-pine" />
                  <span>Gamehosting-by-Graywood-2 Telemetry</span>
                </h2>
                <p className="text-xs text-nordic-subtle mt-0.5">
                  Live GameDig UDP probing against dedicated cluster server nodes.
                </p>
              </div>
              <span className="text-xs font-mono text-nordic-pine">
                {liveGameServers.length} NODES
              </span>
            </div>

            <div className="space-y-3">
              {liveGameServers.length === 0 ? (
                <div className="border border-nordic-border bg-nordic-surface rounded-2xl p-12 text-center">
                  <Server className="h-8 w-8 text-nordic-faint mx-auto mb-3 opacity-60" />
                  <p className="text-sm font-serif text-nordic-ink">No Game Server Nodes Registered</p>
                  <p className="text-xs text-nordic-subtle mt-1 max-w-sm mx-auto mb-4">
                    Register live dedicated game servers to probe UDP latency and active player counts directly.
                  </p>
                  <Link
                    href="/admin/customizer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-nordic-border bg-nordic-surface px-4 py-2 text-xs font-medium text-nordic-ink hover:bg-nordic-muted transition"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-nordic-pine" />
                    <span>Add Server Node</span>
                  </Link>
                </div>
              ) : (
                liveGameServers.map((server) => (
                  <div
                    key={server.id}
                    className="rounded-2xl border border-nordic-border bg-nordic-muted/40 p-4 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-nordic-ink">
                          {server.name}
                        </span>
                        <span className="rounded-md bg-nordic-surface border border-nordic-border px-2 py-0.5 text-[10px] font-mono text-nordic-subtle">
                          {server.gameType}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-nordic-faint">
                        {server.endpoint} ({server.protocolType})
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {server.online ? (
                          <>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-[#2D5A3D] font-semibold justify-end">
                              <span className="h-2 w-2 rounded-full bg-[#2D5A3D] animate-pulse" />
                              <span>{server.currentPlayers}/{server.maxPlayers} PLAYERS</span>
                            </div>
                            <div className="text-[10px] font-mono text-nordic-faint">
                              {server.ping}ms latency
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-nordic-subtle font-medium justify-end">
                              <span className="h-2 w-2 rounded-full bg-nordic-faint" />
                              <span>OFFLINE / UNREACHABLE</span>
                            </div>
                            <div className="text-[10px] font-mono text-nordic-faint">
                              Node probe timed out
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Modules Matrix */}
        <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-nordic-border">
            <div>
              <h2 className="text-xl font-serif text-nordic-ink flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#2D5A3D]" />
                <span>Ecosystem Module Registry</span>
              </h2>
              <p className="text-xs text-nordic-subtle mt-0.5">
                Dynamic capability flags managed by the platform customizer.
              </p>
            </div>
            <Link
              href="/admin/customizer"
              className="text-xs font-medium text-nordic-pine hover:underline"
            >
              Configure &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="rounded-2xl border border-nordic-border bg-nordic-muted/40 p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-sm text-nordic-ink">
                    {mod.label}
                  </div>
                  <div className="text-[10px] font-mono text-nordic-faint">
                    {mod.description}
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-mono ${
                    mod.enabled
                      ? "bg-[#EAF3EE] border border-[#C5DFD0] text-[#2D5A3D] font-medium"
                      : "bg-nordic-muted border border-nordic-border text-nordic-faint"
                  }`}
                >
                  {mod.enabled ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#2D5A3D]" />
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
      <div className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-[0_8px_30px_rgba(28,27,25,0.04)]">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-nordic-border">
          <div>
            <h2 className="text-xl font-serif text-nordic-ink flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-nordic-clay" />
              <span>Incoming Inquiries Ledger</span>
            </h2>
            <p className="text-xs text-nordic-subtle mt-0.5">
              Latest client submissions captured via website contact forms.
            </p>
          </div>
          <span className="text-xs font-mono text-nordic-faint">
            {inquiries.length} RECENT
          </span>
        </div>

        {inquiries.length === 0 ? (
          <div className="border border-nordic-border bg-nordic-surface rounded-2xl p-12 text-center">
            <Inbox className="h-8 w-8 text-nordic-faint mx-auto mb-3 opacity-60" />
            <p className="text-sm font-serif text-nordic-ink">No Unprocessed Inquiries</p>
            <p className="text-xs text-nordic-subtle mt-1 max-w-sm mx-auto">
              New client commission requests and communications from the public site will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-nordic-border/70">
            {inquiries.map((inq) => (
              <div key={inq.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-nordic-ink">{inq.name} ({inq.email})</div>
                  <div className="text-nordic-subtle truncate max-w-md">{inq.message}</div>
                </div>
                <span className="font-mono text-nordic-faint text-[10px]">
                  {new Date(inq.createdAt).toLocaleDateString("nb-NO")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
