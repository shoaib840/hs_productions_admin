"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  X,
  Check,
  Images,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  getDocs,
  setDoc,
  collection,
  writeBatch,
} from "firebase/firestore";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "@/lib/imageUpload";
import {
  GalleryItem,
  getCachedGallery,
  setCachedGallery,
  clearGalleryCache,
  computeGalleryHash,
} from "@/lib/galleryCache";

export function GalleryScreen() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(() => {
    const cached = getCachedGallery();
    return cached ? cached.items : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const cached = getCachedGallery();
    return !cached || cached.items.length === 0;
  });
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedPreviews, setUploadedPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "single" | "all";
    item?: GalleryItem;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Manual re-sync from server to force refresh stale cache
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const singleDocRef = doc(db, "gallery", "gallery");
      const docSnap = await getDoc(singleDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const rawImages: any[] = data.images || data.items || [];
        const items: GalleryItem[] = rawImages
          .map((img: any, idx: number) => ({
            id: img.id || `${Date.now()}-${idx}`,
            imageUrl:
              typeof img.imageUrl === "string"
                ? img.imageUrl.trim()
                : typeof img === "string"
                  ? img
                  : "",
            cloudinaryPublicId: img.cloudinaryPublicId || "",
            createdAt: img.createdAt || 0,
          }))
          .filter((item) => Boolean(item.imageUrl && item.imageUrl.length > 0));

        items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setCachedGallery(items);
        setGalleryItems(items);
      } else {
        clearGalleryCache();
        setGalleryItems([]);
      }
    } catch (err) {
      console.error("Manual sync failed:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Real-time listener for the single "gallery" document in "gallery" collection
  useEffect(() => {
    const cached = getCachedGallery();
    if (!cached || cached.items.length === 0) {
      setIsLoading(true);
    }

    const singleDocRef = doc(db, "gallery", "gallery");

    const unsubscribe = onSnapshot(
      singleDocRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const rawImages: any[] = data.images || data.items || [];
          const items: GalleryItem[] = rawImages
            .map((img: any, idx: number) => ({
              id: img.id || `${Date.now()}-${idx}`,
              imageUrl:
                typeof img.imageUrl === "string"
                  ? img.imageUrl.trim()
                  : typeof img === "string"
                    ? img
                    : "",
              cloudinaryPublicId: img.cloudinaryPublicId || "",
              createdAt: img.createdAt || 0,
            }))
            .filter((item) => Boolean(item.imageUrl && item.imageUrl.length > 0));

          items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

          // Only update state if Firebase data has actually changed compared to cache
          const newHash = computeGalleryHash(items);
          const currentCached = getCachedGallery();

          if (!currentCached || currentCached.hash !== newHash) {
            setCachedGallery(items);
            setGalleryItems(items);
          }
          setIsLoading(false);
        } else {
          // If single document does not exist yet, check for legacy separate documents in "gallery" and auto-migrate
          try {
            const legacySnapshot = await getDocs(collection(db, "gallery"));
            const legacyDocs = legacySnapshot.docs.filter((d) => d.id !== "gallery");

            if (legacyDocs.length > 0) {
              const migratedList: GalleryItem[] = legacyDocs
                .map((d) => {
                  const data = d.data();
                  const url =
                    data.imageUrl ||
                    data.url ||
                    data.image ||
                    data.photoUrl ||
                    data.downloadUrl ||
                    "";
                  return {
                    id: d.id,
                    imageUrl: typeof url === "string" ? url.trim() : "",
                    cloudinaryPublicId: data.cloudinaryPublicId || "",
                    createdAt: data.createdAt || 0,
                  };
                })
                .filter((item) => Boolean(item.imageUrl && item.imageUrl.length > 0));

              migratedList.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

              // Store into single document "gallery/gallery"
              await setDoc(singleDocRef, { images: migratedList });

              // Delete old individual legacy docs
              const batch = writeBatch(db);
              legacyDocs.forEach((d) => batch.delete(d.ref));
              await batch.commit();

              setCachedGallery(migratedList);
              setGalleryItems(migratedList);
            } else {
              clearGalleryCache();
              setGalleryItems([]);
            }
          } catch (migrateErr) {
            console.error("Migration error:", migrateErr);
            setGalleryItems([]);
          } finally {
            setIsLoading(false);
          }
        }
      },
      (error) => {
        console.error("Firebase Firestore single document fetch error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Keyboard navigation for fullscreen lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewIndex === null) return;
      if (e.key === "Escape") {
        setPreviewIndex(null);
      } else if (e.key === "ArrowRight") {
        setPreviewIndex((prev) =>
          prev === null ? null : (prev + 1) % galleryItems.length
        );
      } else if (e.key === "ArrowLeft") {
        setPreviewIndex((prev) =>
          prev === null ? null : (prev - 1 + galleryItems.length) % galleryItems.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewIndex, galleryItems.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 20 - uploadedPreviews.length;
    if (availableSlots <= 0) return;

    const filesToRead = Array.from(files).slice(0, availableSlots);
    setSelectedFiles((prev) => [...prev, ...filesToRead].slice(0, 20));

    const promises = filesToRead.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((results) => {
      setUploadedPreviews((prev) => [...prev, ...results].slice(0, 20));
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveUploaded = (index: number) => {
    setUploadedPreviews((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    try {
      const newItems: GalleryItem[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        // Uploads image to Cloudinary in WebP format compressed to <= 100 KB
        const { url, publicId } = await uploadImageToCloudinary(file, "hs_lookbook");

        newItems.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          imageUrl: url,
          cloudinaryPublicId: publicId,
          createdAt: Date.now() + i,
        });
      }

      // Read current single doc and prepend new items into map list
      const singleDocRef = doc(db, "gallery", "gallery");
      const docSnap = await getDoc(singleDocRef);
      const currentList: GalleryItem[] = docSnap.exists()
        ? docSnap.data().images || []
        : galleryItems;

      const updatedList = [...newItems, ...currentList];
      await setDoc(singleDocRef, { images: updatedList }, { merge: true });

      setCachedGallery(updatedList);
      setGalleryItems(updatedList);

      setUploadedPreviews([]);
      setSelectedFiles([]);
      setIsUploadOpen(false);
    } catch (err: any) {
      console.error("Failed to upload photos:", err);
      alert(err?.message || "Failed to upload photos. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    try {
      const singleDocRef = doc(db, "gallery", "gallery");

      if (deleteTarget.type === "single" && deleteTarget.item) {
        const item = deleteTarget.item;
        const docSnap = await getDoc(singleDocRef);
        const currentList: GalleryItem[] = docSnap.exists()
          ? docSnap.data().images || []
          : galleryItems;
        const updatedList = currentList.filter((i) => i.id !== item.id);
        await setDoc(singleDocRef, { images: updatedList });
        setCachedGallery(updatedList);
        setGalleryItems(updatedList);

        if (item.cloudinaryPublicId) {
          await deleteImageFromCloudinary(item.cloudinaryPublicId);
        }
        if (previewIndex !== null) setPreviewIndex(null);
      } else if (deleteTarget.type === "all") {
        for (const item of galleryItems) {
          if (item.cloudinaryPublicId) {
            await deleteImageFromCloudinary(item.cloudinaryPublicId);
          }
        }
        await setDoc(singleDocRef, { images: [] });
        clearGalleryCache();
        setGalleryItems([]);

        // Clean up any loose legacy documents in collection
        const legacySnapshot = await getDocs(collection(db, "gallery"));
        const batch = writeBatch(db);
        legacySnapshot.docs.forEach((d) => {
          if (d.id !== "gallery") batch.delete(d.ref);
        });
        await batch.commit();

        if (previewIndex !== null) setPreviewIndex(null);
      }
    } catch (err) {
      console.error("Error deleting photos:", err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Studio Showcase & Portfolio
          </span>
        </div>

        {/* Main Title & Action Buttons Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            <span className="sm:hidden">Studio Gallery</span>
            <span className="hidden sm:inline">Studio Gallery & Lookbook</span>
          </h1>

          {/* Action Buttons Aligned with Main Text */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync latest photos from server"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60 group"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isSyncing ? "animate-spin text-[#FF272A]" : "group-hover:rotate-45"
                  }`}
              />
              <span className="hidden xs:inline">
                {isSyncing ? "Syncing..." : "Sync"}
              </span>
            </button>
            {galleryItems.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteTarget({ type: "all" })}
                title="Delete all photos"
                className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full border border-red-200 bg-red-50/70 hover:bg-red-100 text-[#FF272A] font-semibold text-xs transition-all shadow-xs cursor-pointer group"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Delete All</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setUploadedPreviews([]);
                setSelectedFiles([]);
                setIsUploadOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#161719] text-white hover:bg-black transition-all shadow-md font-medium sm:font-semibold text-[11px] sm:text-xs cursor-pointer group hover:scale-[1.02]"
            >
              <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF272A] group-hover:-translate-y-0.5 transition-transform" />
              <span>
                <span className="sm:hidden">Upload New</span>
                <span className="hidden sm:inline">Upload New Look</span>
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Curated high-fashion cuts, color transformations, and bridal portfolio highlights.
        </p>
      </div>

      {/* Grid or Empty State or Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="aspect-square w-full rounded-2xl bg-zinc-100 animate-pulse border border-zinc-200/60"
            />
          ))}
        </div>
      ) : galleryItems.length === 0 ? (
        <EmptyState
          icon={Images}
          badge="Gallery Empty"
          title="No Photos in Gallery Yet"
          description="Your studio lookbook is currently empty. Upload photos from your laptop or mobile to showcase your salon portfolio."
          actionLabel="Upload New Look"
          onAction={() => {
            setUploadedPreviews([]);
            setSelectedFiles([]);
            setIsUploadOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {galleryItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setPreviewIndex(idx)}
              title="Click to view full screen"
              className="group relative aspect-square w-full rounded-2xl overflow-hidden border border-zinc-200/80 bg-zinc-100 shadow-xs hover:shadow-xl transition-all duration-300 cursor-zoom-in"
            >
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt="Studio Look"
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : null}

              {/* Individual Delete Icon: Always visible on mobile, hover on desktop */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({ type: "single", item });
                }}
                title="Delete photo"
                className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/65 hover:bg-[#FF272A] text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-md backdrop-blur-xs cursor-pointer z-10 active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {previewIndex !== null && galleryItems[previewIndex]?.imageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn select-none"
          onClick={() => setPreviewIndex(null)}
        >
          {/* Top Bar: Counter & Close */}
          <div className="absolute top-5 left-6 right-6 flex items-center justify-between text-white z-50">
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
              {previewIndex + 1} / {galleryItems.length}
            </span>
            <button
              type="button"
              onClick={() => setPreviewIndex(null)}
              title="Close fullscreen view (Esc)"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#FF272A] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Previous Button */}
          {galleryItems.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewIndex((prev) =>
                  prev === null ? null : (prev - 1 + galleryItems.length) % galleryItems.length
                );
              }}
              title="Previous photo (←)"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-[#FF272A] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 shadow-xl z-50 backdrop-blur-xs"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Large Fullscreen Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-[78vh] flex items-center justify-center animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryItems[previewIndex].imageUrl}
              alt="Fullscreen Studio Look"
              fill
              unoptimized
              className="object-contain drop-shadow-2xl rounded-2xl"
              priority
            />
          </div>

          {/* Next Button */}
          {galleryItems.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewIndex((prev) =>
                  prev === null ? null : (prev + 1) % galleryItems.length
                );
              }}
              title="Next photo (→)"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-[#FF272A] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10 shadow-xl z-50 backdrop-blur-xs"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Multi-Photo Upload Dialog Modal (Up to 20 Photos) */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => !isUploading && setIsUploadOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-zinc-200 relative animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF272A]">
                  Cloudinary WebP Lookbook
                </span>
                <h2 className="text-xl font-extrabold text-zinc-900 mt-0.5">
                  Upload New Looks
                </h2>
              </div>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsUploadOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddLook} className="flex flex-col gap-4 mt-5">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-800">
                    Select Photos from Device
                  </label>
                  <span className="text-[11px] font-bold text-zinc-500">
                    {uploadedPreviews.length} / 20 selected
                  </span>
                </div>

                {/* Dropzone / File Picker */}
                {uploadedPreviews.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-200 hover:border-[#FF272A] rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2.5 bg-zinc-50 hover:bg-red-50/20 transition-all cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-zinc-200/60 text-zinc-400 flex items-center justify-center group-hover:text-[#FF272A] transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-zinc-800 group-hover:text-[#FF272A] transition-colors flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#FF272A]" />
                        Browse Laptop / Mobile Gallery
                      </span>
                      <span className="text-[11px] text-zinc-400 mt-0.5">
                        Auto-compressed to WebP (≤100 KB) for blazing speed
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Thumbnails Grid Preview */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto p-2.5 bg-zinc-50 rounded-2xl border border-zinc-200">
                      {uploadedPreviews.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-white group shadow-xs"
                        >
                          {img ? (
                            <Image
                              src={img}
                              alt={`Upload ${idx + 1}`}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : null}
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => handleRemoveUploaded(idx)}
                            title="Remove photo"
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-[#FF272A] text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add more button if less than 20 */}
                      {uploadedPreviews.length < 20 && !isUploading && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          title="Add more photos"
                          className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 hover:border-[#FF272A] flex flex-col items-center justify-center text-zinc-400 hover:text-[#FF272A] bg-white transition-all cursor-pointer group"
                        >
                          <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-semibold mt-0.5">More</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] text-emerald-600 font-semibold px-1">
                      ✓ {uploadedPreviews.length} photo{uploadedPreviews.length > 1 ? "s" : ""} ready for WebP Cloudinary upload
                    </span>
                  </div>
                )}

                {/* Hidden File Input with multiple attribute */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isUploading}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF272A]" />
                      <span>Optimizing & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#FF272A]" />
                      <span>
                        Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}to Cloudinary
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before deleting photos */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        title={deleteTarget?.type === "all" ? "Delete All Lookbook Photos?" : "Delete Lookbook Photo?"}
        message={
          deleteTarget?.type === "all"
            ? "Are you sure you want to delete all photos? They will be permanently removed from Cloudinary and your gallery."
            : "Are you sure you want to delete this photo? It will be permanently removed from Cloudinary and your gallery."
        }
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
