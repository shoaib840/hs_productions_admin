"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Plus,
  Trash2,
  X,
  RefreshCw,
  Loader2,
  Check,
  ChevronDown,
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
  deleteDoc,
} from "firebase/firestore";

interface Review {
  id: string;
  client: string;
  rating: number;
  date: string;
  comment: string;
  createdAt: number;
}

function formatReviewDate(val: any): string {
  if (!val) return "Recent";
  let ms: number;
  if (typeof val === "number") {
    ms = val;
  } else if (val?.toMillis) {
    ms = val.toMillis();
  } else if (val?.seconds) {
    ms = val.seconds * 1000;
  } else if (typeof val === "string") {
    return val;
  } else {
    return "Recent";
  }
  const d = new Date(ms);
  if (isNaN(d.getTime())) return "Recent";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseCreatedAt(val: any): number {
  if (typeof val === "number") return val;
  if (val?.toMillis) return val.toMillis();
  if (val?.seconds) return val.seconds * 1000;
  return 0;
}

export function ReviewsScreen() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Form State
  const [newClient, setNewClient] = useState<string>("");
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<string>("");

  // Deletion State
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Real-time Firestore Listener
  useEffect(() => {
    setIsLoading(true);
    const reviewsRef = collection(db, "reviews");

    const unsubscribe = onSnapshot(
      reviewsRef,
      (snapshot) => {
        const items: Review[] = snapshot.docs.map((d) => {
          const data = d.data();
          const createdAt = parseCreatedAt(data.createdAt);
          return {
            id: d.id,
            client: data.name || data.client || "Client",
            rating: Number(data.rating) || 5,
            date: formatReviewDate(data.createdAt || data.date),
            comment: data.comment || "",
            createdAt,
          };
        });

        // Sort newest first
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setReviews(items);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore reviews fetch error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Manual re-sync from server
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const snapshot = await getDocs(collection(db, "reviews"));
      const items: Review[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAt = parseCreatedAt(data.createdAt);
        return {
          id: d.id,
          client: data.name || data.client || "Client",
          rating: Number(data.rating) || 5,
          date: formatReviewDate(data.createdAt || data.date),
          comment: data.comment || "",
          createdAt,
        };
      });

      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setReviews(items);
    } catch (err) {
      console.error("Failed to sync reviews:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newComment.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const now = Date.now();
      await addDoc(collection(db, "reviews"), {
        name: newClient.trim(),
        rating: Number(newRating),
        comment: newComment.trim(),
        createdAt: now,
        updatedAt: now,
      });

      setNewClient("");
      setNewComment("");
      setNewRating(5);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error("Failed to add review:", err);
      alert(err?.message || "Failed to add review. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "reviews", reviewToDelete.id));
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setIsDeleting(false);
      setReviewToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Client Feedback Desk
          </span>
        </div>

        {/* Main Title & Action Buttons Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            <span className="sm:hidden">Reviews</span>
            <span className="hidden sm:inline">Client Reviews & Ratings</span>
          </h1>

          {/* Action Buttons Aligned with Main Text */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync latest reviews from server"
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

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#161719] text-white hover:bg-black transition-all shadow-md font-medium sm:font-semibold text-[11px] sm:text-xs cursor-pointer group hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF272A] group-hover:rotate-90 transition-transform" />
              <span>
                <span className="sm:hidden">Add Review</span>
                <span className="hidden sm:inline">Add Client Review</span>
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Manage salon client testimonials, verified reviews, and customer satisfaction.
        </p>
      </div>

      {/* Reviews Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-zinc-900">
          Client Feedback Records ({reviews.length})
        </h3>
        <span className="text-xs text-zinc-400 font-medium">
          {reviews.length > 10
            ? `Showing 1–${Math.min(visibleCount, reviews.length)} of ${reviews.length}`
            : "Public & Verified Reviews"}
        </span>
      </div>

      {/* Reviews Grid or Skeletons or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl p-5 border border-zinc-200 shadow-2xs flex flex-col justify-between gap-4 animate-pulse min-h-[160px]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-zinc-200" />
                  <div className="flex flex-col gap-1.5">
                    <div className="w-24 h-3.5 bg-zinc-200 rounded" />
                    <div className="w-16 h-2.5 bg-zinc-100 rounded" />
                  </div>
                </div>
                <div className="w-20 h-3 bg-zinc-100 rounded" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-full h-3 bg-zinc-100 rounded" />
                <div className="w-4/5 h-3 bg-zinc-100 rounded" />
              </div>
              <div className="w-12 h-3 bg-zinc-100 rounded self-end mt-2" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          badge="No Reviews Yet"
          title="No client reviews recorded"
          description="Your verified client feedback, ratings, and testimonials will show up here. Add your first customer review."
          actionLabel="Add Client Review"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.slice(0, visibleCount).map((rev, index) => (
              <div
                key={rev.id}
                className="bg-white rounded-3xl p-5 border border-zinc-200/90 shadow-2xs flex flex-col justify-between gap-4 hover:border-zinc-300 transition-colors group"
              >
                <div className="flex flex-col gap-2.5">
                  {/* Header: Number, Client, Date & Stars */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 leading-tight">
                          {rev.client}
                        </h4>
                        <span className="text-[11px] text-zinc-400">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-zinc-600 leading-relaxed italic mt-1">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-end pt-3 border-t border-zinc-100 text-xs mt-auto">
                  <button
                    type="button"
                    onClick={() => setReviewToDelete(rev)}
                    className="text-zinc-400 hover:text-[#FF272A] cursor-pointer flex items-center gap-1 transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button: Only rendered if reviews count is greater than visibleCount */}
          {reviews.length > visibleCount && (
            <div className="flex flex-col items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/90 hover:border-zinc-300 font-semibold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95 group"
              >
                <span>Load More Reviews</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-y-0.5 transition-transform" />
                <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-600">
                  (+{Math.min(10, reviews.length - visibleCount)} more)
                </span>
              </button>
              <span className="text-[11px] text-zinc-400">
                Showing {Math.min(visibleCount, reviews.length)} of {reviews.length} client feedback records
              </span>
            </div>
          )}
        </div>
      )}

      {/* Add Review Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => !isSaving && setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-zinc-100 flex flex-col gap-4 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-zinc-900">Add Customer Review</h3>
                <p className="text-xs text-zinc-500">Record a new client review or feedback card</p>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Client Full Name <span className="text-[#FF272A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rimsha Maryam"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-800">
                    Rating <span className="text-[#FF272A]">*</span>
                  </label>
                  <span className="text-xs font-semibold text-amber-600 transition-colors">
                    {(hoverRating ?? newRating) === 5 && "5.0 Exceptional"}
                    {(hoverRating ?? newRating) === 4 && "4.0 Very Good"}
                    {(hoverRating ?? newRating) === 3 && "3.0 Good"}
                    {(hoverRating ?? newRating) === 2 && "2.0 Fair"}
                    {(hoverRating ?? newRating) === 1 && "1.0 Poor"}
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 py-1 select-none"
                  onMouseLeave={() => setHoverRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating ?? newRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 rounded-xl transition-all duration-150 hover:scale-125 active:scale-90 cursor-pointer group focus:outline-none"
                        title={`${star} star${star > 1 ? "s" : ""}`}
                      >
                        <Star
                          className={`w-6 h-6 transition-all duration-150 ${isFilled
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]"
                            : "text-zinc-300 fill-zinc-200/50 group-hover:text-amber-300"
                            }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Review Statement <span className="text-[#FF272A]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Client's thoughts and feedback on their salon experience..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-semibold text-xs cursor-pointer hover:bg-zinc-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#FF272A] animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-[#FF272A]" />
                  )}
                  <span>{isSaving ? "Saving..." : "Save Review"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before deleting review */}
      <ConfirmDeleteModal
        isOpen={reviewToDelete !== null}
        title="Delete Client Review?"
        message={`Are you sure you want to delete the review by "${reviewToDelete?.client || "this client"}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setReviewToDelete(null)}
      />
    </div>
  );
}
