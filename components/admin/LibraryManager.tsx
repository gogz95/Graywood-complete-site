"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { assignAssetToAlbum } from "@/app/actions/library";
import {
  createAlbum,
  deleteAlbum,
  assignAssetsToAlbum,
  removeAssetFromAlbum,
} from "@/app/actions/albums";
import {
  Images,
  Search,
  FolderPlus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Camera,
  Plus,
  Lock,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  KeyRound,
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
  albumIds?: string[];
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
  clientName?: string | null;
  createdAt?: string;
  itemCount?: number;
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

  // Active view tab
  const [activeTab, setActiveTab] = useState<"assets" | "albums">("assets");

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [albumFilter, setAlbumFilter] = useState<string>("ALL");

  // Multi-select for batch assignment
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [batchTargetAlbumId, setBatchTargetAlbumId] = useState<string>(albums[0]?.id ?? "");

  // Single asset modal
  const [selectedAsset, setSelectedAsset] = useState<SerializedAsset | null>(null);
  const [singleAlbumModalOpen, setSingleAlbumModalOpen] = useState(false);
  const [singleAlbumId, setSingleAlbumId] = useState(albums[0]?.id ?? "");

  // Create Album Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<"PORTFOLIO" | "CLIENT_PROOFING">("PORTFOLIO");
  const [createTitle, setCreateTitle] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createClientName, setCreateClientName] = useState("");
  const [createPin, setCreatePin] = useState("");

  // Feedback & Copy status
  const [copiedAlbumId, setCopiedAlbumId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return assets.filter((a) => {
      const matchesSearch =
        !q ||
        a.fileName.toLowerCase().includes(q) ||
        (a.cameraModel && a.cameraModel.toLowerCase().includes(q)) ||
        (a.lensModel && a.lensModel.toLowerCase().includes(q));

      const matchesAlbum =
        albumFilter === "ALL" ||
        (albumFilter === "UNASSIGNED"
          ? !a.albumIds || a.albumIds.length === 0
          : a.albumIds && a.albumIds.includes(albumFilter));

      return matchesSearch && matchesAlbum;
    });
  }, [assets, searchQuery, albumFilter]);

  // Filtered Albums
  const filteredAlbums = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return albums;
    return albums.filter(
      (alb) =>
        alb.title.toLowerCase().includes(q) ||
        alb.slug.toLowerCase().includes(q) ||
        (alb.clientName && alb.clientName.toLowerCase().includes(q))
    );
  }, [albums, searchQuery]);

  // Toggle single asset selection
  const toggleSelectAsset = (assetId: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });
  };

  // Select all filtered assets
  const handleSelectAllFiltered = () => {
    const allFilteredIds = new Set(filteredAssets.map((a) => a.id));
    setSelectedAssetIds(allFilteredIds);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedAssetIds(new Set());
  };

  // Batch Assign
  const handleBatchAssign = async () => {
    if (selectedAssetIds.size === 0 || !batchTargetAlbumId) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await assignAssetsToAlbum({
      albumId: batchTargetAlbumId,
      assetIds: Array.from(selectedAssetIds),
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setSelectedAssetIds(new Set());
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  // Single Asset Assign
  const handleSingleAssignAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !singleAlbumId) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await assignAssetToAlbum({
      assetId: selectedAsset.id,
      albumId: singleAlbumId,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setSingleAlbumModalOpen(false);
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  // Create Album
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await createAlbum({
      title: createTitle.trim(),
      slug: createSlug.trim() || undefined,
      type: createType,
      clientName: createClientName.trim() || undefined,
      pin: createPin.trim() || undefined,
    });

    setIsSubmitting(false);
    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      setCreateModalOpen(false);
      setCreateTitle("");
      setCreateSlug("");
      setCreateClientName("");
      setCreatePin("");
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  // Delete Album
  const handleDeleteAlbum = async (albumId: string, albumTitle: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the album "${albumTitle}"?\n\nThis will unlink assigned assets, but will NOT delete any photos or NAS masters.`
    );
    if (!confirmDelete) return;

    setIsSubmitting(true);
    setFeedback(null);

    const res = await deleteAlbum(albumId);
    setIsSubmitting(false);

    if (res.success) {
      setFeedback({ type: "success", text: res.message });
      router.refresh();
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  // Copy Client Portal URL
  const handleCopyLink = (slug: string, albumId: string) => {
    const host = typeof window !== "undefined" ? window.location.origin : "";
    const fullUrl = `${host}/portal/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedAlbumId(albumId);
    setTimeout(() => {
      setCopiedAlbumId(null);
    }, 2500);
  };

  // NAS Sync Trigger
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus("Scanning NAS storage pipeline...");

    try {
      const response = await fetch("/api/nas/scan", {
        method: "POST",
      });

      if (!response.ok) {
        setSyncStatus("Failed to scan NAS storage.");
        setIsSyncing(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSyncStatus(`Sync finished: ${data.totalUpserted} assets indexed from ${data.totalScanned} files.`);
        router.refresh();
      } else {
        setSyncStatus(data.error || "Scan failed.");
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
            Audit indexed NAS masters, curate public portfolios, and provision zero-discovery client proofing vaults with direct links.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-nordic-clay px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-nordic-clay/90 cursor-pointer transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Album</span>
          </button>

          <button
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl border border-nordic-border bg-nordic-surface px-4 py-2.5 text-xs font-medium text-nordic-ink shadow-sm hover:bg-nordic-muted disabled:opacity-50 cursor-pointer transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-nordic-pine" : ""}`} />
            <span>{isSyncing ? "Scanning NAS..." : "Scan & Resync NAS"}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div className="rounded-xl border border-nordic-border bg-nordic-muted p-3.5 text-xs font-mono text-nordic-pine flex items-center justify-between animate-fade-in">
          <span>{syncStatus}</span>
          {isSyncing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs border animate-fade-in ${
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

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-nordic-border gap-8">
        <button
          onClick={() => setActiveTab("assets")}
          className={`pb-3.5 text-sm font-medium transition cursor-pointer flex items-center gap-2 relative ${
            activeTab === "assets"
              ? "text-nordic-ink border-b-2 border-nordic-pine font-semibold"
              : "text-nordic-subtle hover:text-nordic-ink"
          }`}
        >
          <Images className="h-4 w-4" />
          <span>All Media Assets</span>
          <span className="rounded-full bg-nordic-muted px-2 py-0.5 text-[10px] font-mono text-nordic-subtle">
            {assets.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("albums")}
          className={`pb-3.5 text-sm font-medium transition cursor-pointer flex items-center gap-2 relative ${
            activeTab === "albums"
              ? "text-nordic-ink border-b-2 border-nordic-pine font-semibold"
              : "text-nordic-subtle hover:text-nordic-ink"
          }`}
        >
          <FolderPlus className="h-4 w-4" />
          <span>Albums & Client Vaults</span>
          <span className="rounded-full bg-nordic-muted px-2 py-0.5 text-[10px] font-mono text-nordic-subtle">
            {albums.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ALL MEDIA ASSETS VIEW
          ========================================================================= */}
      {activeTab === "assets" && (
        <div className="space-y-6">
          {/* Filter & Batch Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-nordic-ink/30 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search file name, camera, lens..."
                  className="w-full rounded-xl border border-nordic-border bg-nordic-muted pl-10 pr-4 py-2.5 text-xs text-nordic-ink placeholder:text-nordic-faint focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
                />
              </div>

              {/* Album Membership Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-nordic-faint" />
                <select
                  value={albumFilter}
                  onChange={(e) => setAlbumFilter(e.target.value)}
                  className="rounded-xl border border-nordic-border bg-nordic-muted px-3 py-2 text-xs text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                >
                  <option value="ALL">All Albums & Vaults</option>
                  <option value="UNASSIGNED">Unassigned Only</option>
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title} ({alb.itemCount ?? 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex items-center gap-3 self-end md:self-center">
              <button
                onClick={handleSelectAllFiltered}
                className="text-xs text-nordic-subtle hover:text-nordic-ink transition flex items-center gap-1.5"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Select All ({filteredAssets.length})</span>
              </button>

              {selectedAssetIds.size > 0 && (
                <button
                  onClick={handleClearSelection}
                  className="text-xs text-nordic-clay hover:underline"
                >
                  Clear ({selectedAssetIds.size})
                </button>
              )}
            </div>
          </div>

          {/* Floating / Sticky Batch Action Bar */}
          {selectedAssetIds.size > 0 && (
            <div className="sticky top-20 z-30 rounded-2xl border border-nordic-border bg-nordic-surface p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-nordic-pine text-white text-xs font-mono font-bold">
                  {selectedAssetIds.size}
                </span>
                <span className="text-xs font-semibold text-nordic-ink">
                  {selectedAssetIds.size} asset{selectedAssetIds.size === 1 ? "" : "s"} selected
                </span>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={batchTargetAlbumId}
                  onChange={(e) => setBatchTargetAlbumId(e.target.value)}
                  className="rounded-xl border border-nordic-border bg-nordic-muted px-3 py-2 text-xs text-nordic-ink focus:border-nordic-pine focus:outline-none"
                >
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title} [{alb.type === "CLIENT_PROOFING" ? "Vault" : "Portfolio"}]
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleBatchAssign}
                  disabled={isSubmitting || albums.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-nordic-pine/90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />}
                  <span>Assign to Album</span>
                </button>
              </div>
            </div>
          )}

          {/* Assets Grid */}
          {assets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-nordic-border bg-nordic-surface/50 p-16 text-center text-nordic-subtle">
              <Camera className="h-10 w-10 mx-auto mb-3 text-nordic-faint" />
              <h3 className="text-base font-serif text-nordic-ink">Archive Vault Empty</h3>
              <p className="text-xs mt-1 text-nordic-subtle max-w-sm mx-auto">
                No assets indexed from NAS storage. Trigger &apos;Scan & Resync NAS&apos; to index media.
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
              <p className="text-xs mt-1 text-nordic-subtle">Refine your search query or reset album filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssetIds.has(asset.id);
                const assignedAlbums = albums.filter((alb) => asset.albumIds?.includes(alb.id));

                return (
                  <div
                    key={asset.id}
                    className={`group rounded-2xl border bg-nordic-surface overflow-hidden transition-all flex flex-col justify-between ${
                      isSelected
                        ? "border-nordic-pine ring-2 ring-nordic-pine/30 shadow-md"
                        : "border-nordic-border shadow-[0_4px_20px_rgba(28,27,25,0.04)] hover:shadow-md hover:border-nordic-divider"
                    }`}
                  >
                    <div>
                      {/* Thumbnail Container */}
                      <div className="relative aspect-[4/3] bg-nordic-muted overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/media/${asset.id}?size=thumb`}
                          alt={asset.fileName}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Select Checkbox Button */}
                        <button
                          onClick={() => toggleSelectAsset(asset.id)}
                          aria-label={isSelected ? "Deselect asset" : "Select asset"}
                          className={`absolute top-2.5 left-2.5 p-1 rounded-lg transition backdrop-blur-md shadow-xs cursor-pointer ${
                            isSelected
                              ? "bg-nordic-pine text-white"
                              : "bg-nordic-surface/80 text-nordic-subtle hover:text-nordic-ink hover:bg-nordic-surface"
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>

                        <span className="absolute bottom-2 right-2 rounded bg-nordic-surface/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-mono text-nordic-ink shadow-sm">
                          {asset.width && asset.height ? `${asset.width}×${asset.height}` : "MASTER"}
                        </span>
                      </div>

                      {/* Metadata */}
                      <div className="p-4 space-y-2">
                        <div>
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
                        </div>

                        {/* Assigned Albums Chips */}
                        {assignedAlbums.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {assignedAlbums.map((alb) => (
                              <span
                                key={alb.id}
                                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono ${
                                  alb.type === "CLIENT_PROOFING"
                                    ? "bg-nordic-clay/10 text-nordic-clay border border-nordic-clay/20"
                                    : "bg-nordic-pine/10 text-nordic-pine border border-nordic-pine/20"
                                }`}
                              >
                                {alb.type === "CLIENT_PROOFING" ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                                <span className="truncate max-w-[90px]">{alb.title}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-nordic-faint italic block pt-1">
                            No album assigned
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Single Action */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => {
                          setSelectedAsset(asset);
                          setSingleAlbumModalOpen(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-nordic-border bg-nordic-muted px-2.5 py-2 text-[11px] font-medium text-nordic-ink hover:bg-nordic-border transition cursor-pointer"
                      >
                        <FolderPlus className="h-3 w-3 text-nordic-clay" />
                        <span>Assign Album</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: ALBUMS & CLIENT PROOFING VAULTS VIEW
          ========================================================================= */}
      {activeTab === "albums" && (
        <div className="space-y-6">
          {/* Albums Top Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-nordic-ink/30 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search albums, client names, slugs..."
                className="w-full rounded-xl border border-nordic-border bg-nordic-muted pl-10 pr-4 py-2.5 text-xs text-nordic-ink placeholder:text-nordic-faint focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none transition"
              />
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-4 py-2.5 text-xs font-medium text-white shadow-sm hover:bg-nordic-pine/90 cursor-pointer transition self-end sm:self-center"
            >
              <Plus className="h-4 w-4" />
              <span>New Album / Proofing Vault</span>
            </button>
          </div>

          {/* Albums Grid */}
          {filteredAlbums.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-nordic-border bg-nordic-surface/50 p-16 text-center text-nordic-subtle">
              <FolderPlus className="h-10 w-10 mx-auto mb-3 text-nordic-faint" />
              <h3 className="text-base font-serif text-nordic-ink">No Albums Found</h3>
              <p className="text-xs mt-1 text-nordic-subtle max-w-sm mx-auto">
                Create a public portfolio or provision an unlisted client proofing vault to get started.
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-nordic-clay px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-nordic-clay/90 cursor-pointer transition"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Album</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAlbums.map((alb) => {
                const isProofing = alb.type === "CLIENT_PROOFING";
                const isCopied = copiedAlbumId === alb.id;

                return (
                  <div
                    key={alb.id}
                    className="rounded-3xl border border-nordic-border bg-nordic-surface p-6 shadow-[0_4px_20px_rgba(28,27,25,0.03)] flex flex-col justify-between hover:border-nordic-divider transition space-y-6"
                  >
                    <div className="space-y-4">
                      {/* Header Badge */}
                      <div className="flex items-center justify-between">
                        {isProofing ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-nordic-clay/30 bg-nordic-clay/10 px-3 py-1 text-[10px] font-mono font-medium text-nordic-clay">
                            <Lock className="h-3 w-3" />
                            <span>Client Proofing Vault</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-nordic-pine/30 bg-nordic-pine/10 px-3 py-1 text-[10px] font-mono font-medium text-nordic-pine">
                            <Globe className="h-3 w-3" />
                            <span>Public Portfolio</span>
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-nordic-faint">
                          {alb.itemCount ?? 0} {alb.itemCount === 1 ? "Plate" : "Plates"}
                        </span>
                      </div>

                      {/* Title & Details */}
                      <div>
                        <h3 className="font-serif text-lg text-nordic-ink font-medium tracking-tight">
                          {alb.title}
                        </h3>
                        <p className="font-mono text-xs text-nordic-subtle mt-0.5">
                          slug: <span className="text-nordic-ink">/{alb.slug}</span>
                        </p>
                        {isProofing && (
                          <p className="text-xs text-nordic-subtle mt-2 flex items-center gap-1.5">
                            <span className="text-nordic-faint">Client:</span>
                            <span className="font-medium text-nordic-ink">
                              {alb.clientName || "Private Commission"}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-nordic-border/70 space-y-2.5">
                      {isProofing && (
                        <button
                          onClick={() => handleCopyLink(alb.slug, alb.id)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl border border-nordic-border bg-nordic-muted px-3 py-2 text-xs font-medium text-nordic-ink hover:bg-nordic-border transition cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-nordic-pine" />
                              <span className="text-nordic-pine font-semibold">Vault Link Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-nordic-subtle" />
                              <span>Copy Client Direct Link</span>
                            </>
                          )}
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {isProofing ? (
                          <Link
                            href={`/portal/${alb.slug}`}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-nordic-border bg-nordic-surface px-3 py-2 text-xs font-medium text-nordic-ink hover:bg-nordic-muted transition"
                          >
                            <span>Open Vault</span>
                            <ExternalLink className="h-3 w-3 text-nordic-faint" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              setAlbumFilter(alb.id);
                              setActiveTab("assets");
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-nordic-border bg-nordic-surface px-3 py-2 text-xs font-medium text-nordic-ink hover:bg-nordic-muted transition cursor-pointer"
                          >
                            <span>Filter Assets</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteAlbum(alb.id, alb.title)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100/70 transition cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: CREATE NEW ALBUM MODAL
          ========================================================================= */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-ink/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-6 right-6 text-nordic-faint hover:text-nordic-ink transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-xl font-serif text-nordic-ink font-medium">
                Create New Album
              </h3>
              <p className="text-xs text-nordic-subtle mt-1">
                Choose between a public portfolio for web showcases, or an unlisted, password-protected client proofing vault.
              </p>
            </div>

            {/* Type Selector Buttons */}
            <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-nordic-muted border border-nordic-border">
              <button
                type="button"
                onClick={() => setCreateType("PORTFOLIO")}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 ${
                  createType === "PORTFOLIO"
                    ? "bg-nordic-surface text-nordic-ink shadow-xs font-semibold"
                    : "text-nordic-subtle hover:text-nordic-ink"
                }`}
              >
                <Globe className="h-3.5 w-3.5 text-nordic-pine" />
                <span>Public Portfolio</span>
              </button>

              <button
                type="button"
                onClick={() => setCreateType("CLIENT_PROOFING")}
                className={`py-2.5 px-3 rounded-xl text-xs font-medium transition flex items-center justify-center gap-2 ${
                  createType === "CLIENT_PROOFING"
                    ? "bg-nordic-surface text-nordic-ink shadow-xs font-semibold"
                    : "text-nordic-subtle hover:text-nordic-ink"
                }`}
              >
                <Lock className="h-3.5 w-3.5 text-nordic-clay" />
                <span>Private Client Vault</span>
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Album Title *
                </label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Nordic Architectural Campaign 2026"
                  className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-xs text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                  Custom Slug (Optional)
                </label>
                <input
                  type="text"
                  value={createSlug}
                  onChange={(e) => setCreateSlug(e.target.value)}
                  placeholder="Leave blank to auto-generate from title"
                  className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-xs font-mono text-nordic-ink focus:border-nordic-pine focus:bg-nordic-surface focus:outline-none"
                />
              </div>

              {createType === "CLIENT_PROOFING" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5">
                      Client / Organization Name
                    </label>
                    <input
                      type="text"
                      value={createClientName}
                      onChange={(e) => setCreateClientName(e.target.value)}
                      placeholder="e.g. Snøhetta Architects"
                      className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-xs text-nordic-ink focus:border-nordic-clay focus:bg-nordic-surface focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-1.5 flex items-center justify-between">
                      <span>Access Security PIN *</span>
                      <span className="text-[10px] font-mono text-nordic-clay">Min 4 digits</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nordic-faint" />
                      <input
                        type="text"
                        required
                        value={createPin}
                        onChange={(e) => setCreatePin(e.target.value)}
                        placeholder="e.g. 2026"
                        className="w-full rounded-xl border border-nordic-border bg-nordic-muted pl-10 pr-4 py-2.5 text-xs font-mono text-nordic-ink focus:border-nordic-clay focus:bg-nordic-surface focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-nordic-border/60">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createTitle.trim()}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-medium text-white shadow disabled:opacity-50 cursor-pointer ${
                    createType === "CLIENT_PROOFING"
                      ? "bg-nordic-clay hover:bg-nordic-clay/90"
                      : "bg-nordic-pine hover:bg-nordic-pine/90"
                  }`}
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{createType === "CLIENT_PROOFING" ? "Provision Client Vault" : "Create Portfolio"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ASSIGN SINGLE ASSET MODAL
          ========================================================================= */}
      {singleAlbumModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nordic-ink/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-nordic-border bg-nordic-surface p-6 sm:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSingleAlbumModalOpen(false)}
              className="absolute top-6 right-6 text-nordic-faint hover:text-nordic-ink transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-serif text-nordic-ink">
              Assign Plate to Album
            </h3>
            <p className="text-xs text-nordic-subtle truncate">
              File: <span className="font-mono text-nordic-ink">{selectedAsset.fileName}</span>
            </p>

            <form onSubmit={handleSingleAssignAlbum} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-nordic-subtle mb-2">
                  Target Album or Vault
                </label>
                <select
                  value={singleAlbumId}
                  onChange={(e) => setSingleAlbumId(e.target.value)}
                  className="w-full rounded-xl border border-nordic-border bg-nordic-muted px-4 py-3 text-sm text-nordic-ink focus:border-nordic-pine focus:outline-none"
                >
                  {albums.map((alb) => (
                    <option key={alb.id} value={alb.id}>
                      {alb.title} [{alb.type === "CLIENT_PROOFING" ? "Vault" : "Portfolio"}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSingleAlbumModalOpen(false)}
                  className="rounded-xl border border-nordic-border bg-nordic-muted px-4 py-2.5 text-xs font-medium text-nordic-subtle hover:text-nordic-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || albums.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-nordic-pine px-5 py-2.5 text-xs font-medium text-white hover:bg-nordic-pine/90 shadow disabled:opacity-50 cursor-pointer"
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
