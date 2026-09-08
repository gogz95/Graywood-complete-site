import Link from "next/link";
import { Camera, Video, Layers, ArrowUpRight, ShieldCheck, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-nordic-border bg-nordic-surface text-nordic-subtle text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-nordic-border">
          {/* Col 1: Brand & Identity */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2 text-nordic-ink font-serif font-bold text-base tracking-tight">
              <span>GRAYWOOD</span>
            </div>
            <p className="text-nordic-subtle leading-relaxed text-xs">
              Unified Norwegian visual production monolith serving high-end still photography, cinematic motion, and client galleries.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-nordic-pine pt-1">
              <span className="h-2 w-2 rounded-full bg-nordic-pine animate-pulse" />
              <span>OSLO STUDIO · ACTIVE OPERATIONS</span>
            </div>
          </div>

          {/* Col 2: Studio Pillars */}
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-nordic-ink font-semibold">
              Portals
            </p>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/photography"
                  className="flex items-center gap-2 text-nordic-subtle hover:text-nordic-pine transition"
                >
                  <Camera className="h-3.5 w-3.5 text-nordic-pine" />
                  <span>Graywood Photography</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/media"
                  className="flex items-center gap-2 text-nordic-subtle hover:text-nordic-clay transition"
                >
                  <Video className="h-3.5 w-3.5 text-nordic-clay" />
                  <span>Graywood Media</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/hub"
                  className="flex items-center gap-2 text-nordic-subtle hover:text-nordic-pine transition"
                >
                  <Layers className="h-3.5 w-3.5 text-nordic-pine" />
                  <span>Digital Ecosystem Hub</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Studio Coordinates */}
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-nordic-ink font-semibold">
              Presence
            </p>
            <div className="space-y-2 text-nordic-subtle">
              <p className="flex items-start gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-nordic-faint shrink-0 mt-0.5" />
                <span>Dronning Eufemias gate 16, 0191 Oslo, Norway</span>
              </p>
              <p>Organization NO: 934 102 481 MVA</p>
              <p>Inquiries: contact@graywood.no</p>
            </div>
          </div>

          {/* Col 4: Platform Security & Standards */}
          <div className="space-y-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-nordic-ink font-semibold">
              Architecture
            </p>
            <div className="rounded-xl border border-nordic-border bg-nordic-muted/60 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-nordic-ink font-mono text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-nordic-pine" />
                <span>Hardened SQLite WAL</span>
              </div>
              <p className="text-[10px] text-nordic-subtle leading-normal">
                Autonomous multi-domain container with memory-safe edge streaming & AES-256 encrypted proofing.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-nordic-faint text-[11px]">
          <p>© {new Date().getFullYear()} Graywood Digital Ecosystem. All photographic and cinematic assets protected by international copyright law.</p>
          <div className="flex items-center gap-6">
            <Link href="/hub" className="text-nordic-subtle hover:text-nordic-ink transition">
              Overview
            </Link>
            <Link href="/photography#contact" className="text-nordic-subtle hover:text-nordic-ink transition flex items-center gap-1">
              <span>Book Project</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
