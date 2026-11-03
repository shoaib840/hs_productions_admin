"use client";

import React, { useState, useEffect } from "react";
import {
  Link2,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X,
  Loader2,
  Globe,
  Share2,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

interface QuickLinkItem {
  id: string;
  title: string;
  url: string;
  createdAt?: number;
}

// Helper to auto-format URL with https:// if omitted
function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function QuickLinksScreen() {
  const [links, setLinks] = useState<QuickLinkItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Deletion Modal State
  const [linkToDelete, setLinkToDelete] = useState<QuickLinkItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Real-time Firestore Listener for "quicklinks" collection
  useEffect(() => {
    setIsLoading(true);
    const linksRef = collection(db, "quicklinks");

    const unsubscribe = onSnapshot(
      linksRef,
      (snapshot) => {
        const items: QuickLinkItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toMillis
            ? data.createdAt.toMillis()
            : typeof data.createdAt === "number"
              ? data.createdAt
              : 0;

          return {
            id: d.id,
            title: data.title || data.name || "Untitled Link",
            url: data.url || data.link || "",
            createdAt,
          };
        });

        items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setLinks(items);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore quicklinks fetch error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Manual Refresh / Sync
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const snap = await getDocs(collection(db, "quicklinks"));
      const items: QuickLinkItem[] = snap.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt?.toMillis
          ? data.createdAt.toMillis()
          : typeof data.createdAt === "number"
            ? data.createdAt
            : 0;

        return {
          id: d.id,
          title: data.title || data.name || "Untitled Link",
          url: data.url || data.link || "",
          createdAt,
        };
      });

      items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setLinks(items);
    } catch (err) {
      console.error("Failed to sync quicklinks:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Open Modal to Create New Link
  const handleOpenAdd = () => {
    setEditingId(null);
    setTitleInput("");
    setUrlInput("");
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Link
  const handleOpenEdit = (item: QuickLinkItem) => {
    setEditingId(item.id);
    setTitleInput(item.title);
    setUrlInput(item.url);
    setIsModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !urlInput.trim() || isSaving) return;

    setIsSaving(true);
    const finalUrl = normalizeUrl(urlInput);

    try {
      if (editingId) {
        await updateDoc(doc(db, "quicklinks", editingId), {
          title: titleInput.trim(),
          url: finalUrl,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "quicklinks"), {
          title: titleInput.trim(),
          url: finalUrl,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save quick link:", err);
      alert(err?.message || "Failed to save link. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!linkToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "quicklinks", linkToDelete.id));
      setLinkToDelete(null);
    } catch (err) {
      console.error("Failed to delete link:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy URL to Clipboard
  const handleCopyLink = async (item: QuickLinkItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback
      setCopiedId(null);
    }
  };

  // Filter links by search query
  const filteredLinks = links.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Shortcuts & Portals
          </span>
        </div>

        {/* Main Title & Action Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            Quick Links
          </h1>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync latest links from server"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60 group"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${
                  isSyncing ? "animate-spin text-[#FF272A]" : "group-hover:rotate-45"
                }`}
              />
              <span className="hidden xs:inline">
                {isSyncing ? "Syncing..." : "Sync"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#161719] text-white hover:bg-black transition-all shadow-md font-medium sm:font-semibold text-[11px] sm:text-xs cursor-pointer group hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF272A] group-hover:rotate-90 transition-transform" />
              <span>
                <span className="sm:hidden">Add Link</span>
                <span className="hidden sm:inline">Add Quick Link</span>
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Save, manage, and share essential salon links, social media profiles, and booking portals.
        </p>
      </div>

      {/* Search Bar when links exist */}
      {links.length > 0 && (
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search links by name or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF272A]/20 focus:border-[#FF272A] shadow-xs"
          />
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-col gap-3 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-200/70" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-4 bg-zinc-200/80 rounded w-1/2" />
                  <div className="h-3 bg-zinc-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={Link2}
          badge="Shortcuts Empty"
          title="No Quick Links Added Yet"
          description="Save and manage direct URLs for your social handles, client booking forms, and studio portals."
          actionLabel="Add New Link"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group hover:border-[#FF272A]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-50 border border-zinc-200 text-[#FF272A] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <Globe className="w-5 h-5 text-[#FF272A]" />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <h3 className="font-bold text-sm text-zinc-900 group-hover:text-[#FF272A] transition-colors truncate">
                      {item.title}
                    </h3>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-zinc-700 truncate inline-flex items-center gap-1 mt-0.5"
                    >
                      <span className="truncate">{item.url.replace(/^https?:\/\//i, "")}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Link"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLinkToDelete(item)}
                    title="Delete Link"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF272A] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 text-xs">
                <button
                  type="button"
                  onClick={() => handleCopyLink(item)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    copiedId === item.id
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border border-zinc-200"
                  }`}
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-zinc-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#161719] hover:bg-black text-white font-semibold transition-all shadow-xs cursor-pointer group-hover:scale-[1.02]"
                >
                  <span>Open Link</span>
                  <ExternalLink className="w-3 h-3 text-[#FF272A]" />
                </a>
              </div>
            </div>
          ))}

          {filteredLinks.length === 0 && searchQuery && (
            <div className="col-span-full py-12 text-center text-xs text-zinc-400">
              No links matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Quick Link Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF272A]">
                  Portal Shortcut
                </span>
                <h2 className="text-xl font-extrabold text-zinc-900 mt-0.5">
                  {editingId ? "Update Quick Link" : "Add New Quick Link"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
              {/* Link Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800">
                  Link Name <span className="text-[#FF272A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Instagram or WhatsApp Concierge"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              {/* URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800">
                  Link URL <span className="text-[#FF272A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://instagram.com/hs_productions"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-[#FF272A] animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#FF272A]" />
                      <span>{editingId ? "Update Link" : "Save Quick Link"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Deleting */}
      <ConfirmDeleteModal
        isOpen={linkToDelete !== null}
        title="Delete Quick Link?"
        message={`Are you sure you want to delete "${linkToDelete?.title || "this link"}"?`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setLinkToDelete(null)}
      />
    </div>
  );
}

