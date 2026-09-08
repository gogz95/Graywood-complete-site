"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { assignAssetToArtist, assignAssetToAlbum } from "@/app/actions/library";
import {
  Images,
  Search,
  UserPlus,
  FolderPlus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Camera,
} from "lucide-react";

export interface SerializedAsset {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: string | null;
  aperture: string | null;
  iso: number | null;
}

export interface SerializedArtist {
  id: string;
  name: string;
  slug: string;
}

export interface SerializedAlbum {
  id: string;
  title: string;
  slug: string;
  type: string;
}

interface LibraryManagerProps {
  assets: SerializedAsset[];
  artists: SerializedArtist[];
  albums: SerializedAlbum[];
}

export function LibraryManager({
  assets,
  artists,
  albums,
}: LibraryManagerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<SerializedAsset | null>(null);

  // Modal actions
  const [artistModalOpen, setArtistModalOpen] = useState(false);
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState(artists[0]?.id ?? "");
  const [selectedAlbumId, setSelectedAlbumId] = useState(albums[0]?.id ?? "");

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return assets;
    return assets.filter(
      (a) =>
        a.fileName.toLowerCase().includes(q) ||
        (a.cameraModel && a.cameraModel.toLowerCase().includes(q)) ||
        (a.lensModel && a.lensModel.toLowerCase().includes(q))
    );
  }, [assets, searchQuery]);

  const handleAssignArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !selectedArtistId) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await assignAssetToArtist({
      assetId: selectedAsset.id,
      artistId: selectedArtistId,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setArtistModalOpen(false);
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleAssignAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !selectedAlbumId) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await assignAssetToAlbum({
      assetId: selectedAsset.id,
      albumId: selectedAlbumId,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setAlbumModalOpen(false);
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Connecting to NAS media pipeline...");

    try {
      const response = await fetch("/api/admin/library/sync", {
        method: "POST",
      });

      if (!response.body) {
        setSyncStatus("Failed to open SSE stream.");
        setIsSyncing(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "start") setSyncStatus(data.message);
              if (data.type === "progress") {
                setSyncStatus(`Scanned: ${data.scanned} | Indexed: ${data.indexed}`);
              }
              if (data.type === "complete") {
                setSyncStatus(`Sync finished: ${data.indexed} new assets indexed.`);
                router.refresh();
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch {
      setSyncStatus("Network error during sync.");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-nordic-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-nordic-pine mb-1">
            <Images className="h-3.5 w-3.5" />
            <span>Digital Asset Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-nordic-ink tracking-tight">
            Virtual Library Manager
          </h1>
          <p className="text-xs sm:text-sm text-nordic-subtle mt-1 max-w-xl">
            Audit indexed NAS master files, curate artist portfolios, and allocate photographs into private client proofing vaults.
          </p>
        </div>

        {/* Sync Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-nordic-pine/90 disabled:opacity-50 cursor-pointer transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Scanning NAS..." : "Scan & Resync NAS"}</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="rounded-xl border border-nordic-border bg-nordic-muted p-3.5 text-xs font-mono text-nordic-pine flex items-center justify-between">
          <span>{syncStatus}</span>
          {isSyncing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </div>
      )}

      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs border ${
            feedback.type === "success"
              ? "bg-nordic-pine/10 text-nordic-pine border-nordic-pine/20"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-nordic-pine mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Search Bar & Total */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-nordic-ink/30 pointer-events-none transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by file name, camera model, lens..."
            className="w-full rounded-xl border border-nordic-border bg-nordic-muted pl-10 pr-4 py-2.5 text-xs text-nordic-ink placeholder:text-nordic-faint focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
          />
        </div>

        <span className="text-xs font-mono text-nordic-subtle self-end sm:self-center">
          {filteredAssets.length} of {assets.length} ASSETS
        </span>
      </div>

      {/* Asset Grid */}
      {assets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-nordic-border bg-nordic-surface/50 p-16 text-center text-nordic-subtle">
          <Camera className="h-10 w-10 mx-auto mb-3 text-nordic-faint" />
          <h3 className="text-base font-serif text-nordic-ink">Archive Vault Empty</h3>
          <p className="text-xs mt-1 text-nordic-subtle max-w-sm mx-auto">
            No assets indexed from NAS storage. Trigger &apos;Scan New Files&apos; to index media.
          </p>
          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-nordic-pine/90 disabled:opacity-50 cursor-pointer transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Scan New Files</span>
          </button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-nordic-border bg-nordic-surface/50 p-16 text-center text-nordic-subtle">
          <Camera className="h-10 w-10 mx-auto mb-3 text-nordic-faint" />
          <p className="text-sm font-semibold text-nordic-ink">No matching media assets found</p>
          <p className="text-xs mt-1 text-nordic-subtle">Refine your search query or reset filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="group rounded-2xl border border-nordic-border bg-nordic-surface overflow-hidden shadow-[0_4px_20px_rgba(28,27,25,0.04)] hover:shadow-md hover:border-nordic-divider transition flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-nordic-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/media/${asset.id}?size=thumb`}
                    alt={asset.fileName}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-nordic-surface/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-mono text-nordic-ink shadow-sm">
                    {asset.width && asset.height ? `${asset.width}×${asset.height}` : "JPEG"}
                  </span>
                </div>

                {/* Metadata */}
                <div className="p-4 space-y-1">
                  <p className="text-xs font-medium text-nordic-ink truncate" title={asset.fileName}>
                    {asset.fileName}
                  </p>
                  {asset.cameraModel && (
                    <p className="text-[10px] font-mono text-nordic-pine truncate">
                      {asset.cameraModel}
                    </p>
                  )}
                  {asset.lensModel && (
                    <p className="text-[10px] font-mono text-nordic-faint truncate">
                      {asset.lensModel}
                    </p>
                  )}
                  {!asset.cameraModel && !asset.lensModel && (
                    <p className="text-[10px] font-mono text-nordic-faint truncate">
                      {asset.fileSize ? `${Math.round(asset.fileSize / 1024)} KB` : "Indexed Asset"}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedAsset(asset);
                    setArtistModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-nordic-border bg-nordic-muted px-2.5 py-2 text-[11px] font-medium text-nordic-ink hover:bg-nordic-border transition cursor-pointer"
                >
                  <UserPlus className="h-3 w-3 text-nordic-pine" />
                  <span>Artist</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedAsset(asset);
                    setAlbumModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-nordic-border bg-nordic-muted px-2.5 py-2 text-[11px] font-medium text-nordic-ink hover:bg-nordic-border transition cursor-pointer"
                >
                  <FolderPlus className="h-3 w-3 text-nordic-clay" />
                  <span>Album</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ASSIGN ARTIST MODAL */}
      {artistModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-ink/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setArtistModalOpen(false)}
              className="absolute top-6 right-6 text-nordic-faint hover:text-nordic-ink transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-serif text-nordic-ink mb-1">
              Assign to Artist Profile
            </h3>
            <p className="text-xs text-nordic-subtle mb-6 truncate">
              Photo: <span className="font-mono text-nordic-ink">{selectedAsset.fileName}</span>
            </p>

            <form onSubmit={handleAssignArtist} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                  Select Collective Artist
                </label>
                <select
                  value={selectedArtistId}
                  onChange={(e) => setSelectedArtistId(e.target.value)}
                  className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-3 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none"
                >
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (@{a.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setArtistModalOpen(false)}
                  className="rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-5 py-2.5 text-xs font-medium text-white hover:bg-nordic-pine/90 shadow disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Attribution</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ALBUM MODAL */}
      {albumModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-ink/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setAlbumModalOpen(false)}
              className="absolute top-6 right-6 text-nordic-faint hover:text-nordic-ink transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-serif text-nordic-ink mb-1">
              Add Asset to Album
            </h3>
            <p className="text-xs text-nordic-subtle mb-6 truncate">
              Photo: <span className="font-mono text-nordic-ink">{selectedAsset.fileName}</span>
            </p>

            <form onSubmit={handleAssignAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                  Target Album / Client Vault
                </label>
                <select
                  value={selectedAlbumId}
                  onChange={(e) => setSelectedAlbumId(e.target.value)}
                  className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-3 text-sm text-nordic-ink focus:border-nordic-clay focus:outline-none"
                >
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title} [{alb.type}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAlbumModalOpen(false)}
                  className="rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-clay px-5 py-2.5 text-xs font-medium text-white hover:bg-nordic-clay/90 shadow disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Attach to Album</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
