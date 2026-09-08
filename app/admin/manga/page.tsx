import { requireAdminSession } from "@/lib/admin-session";
import { BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMangaPage() {
  await requireAdminSession(["ADMIN"]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] lg:h-screen w-full bg-nordic-canvas">
      {/* Top Embedded Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-nordic-border bg-nordic-surface/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-nordic-muted border border-nordic-border text-nordic-pine">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-nordic-ink tracking-tight">
              Manga Suite Reader Dock
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono text-nordic-faint ml-2">
              https://reader.graywood.no
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-nordic-subtle">
          <div className="hidden md:flex items-center gap-1.5 text-nordic-pine text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>CSP Frame Policy Active</span>
          </div>
          <a
            href="https://reader.graywood.no"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-nordic-border bg-nordic-muted px-3 py-1.5 text-nordic-ink hover:bg-nordic-border transition shadow-sm"
          >
            <span>Open Direct</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Embedded Iframe */}
      <div className="flex-1 w-full h-full relative bg-nordic-canvas">
        <iframe
          src="https://reader.graywood.no"
          title="Graywood Manga Reader"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="lazy"
        />
      </div>
    </div>
  );
}
