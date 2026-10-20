"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Check,
  Save,
  ImageIcon,
  Type,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "@/lib/imageUpload";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, getDoc, setDoc } from "firebase/firestore";

export function AboutUsScreen() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [image1, setImage1] = useState<string>("");
  const [image1PublicId, setImage1PublicId] = useState<string>("");
  const [image2, setImage2] = useState<string>("");
  const [image2PublicId, setImage2PublicId] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isUploading1, setIsUploading1] = useState<boolean>(false);
  const [isUploading2, setIsUploading2] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Real-time listener for Firestore "aboutUs/company_about"
  useEffect(() => {
    setIsLoading(true);
    const docRef = doc(db, "aboutUs", "company_about");

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.heading || data.title || "");
          setDescription(data.description || "");
          setImage1(data.image1 || "");
          setImage1PublicId(data.image1PublicId || "");
          setImage2(data.image2 || "");
          setImage2PublicId(data.image2PublicId || "");
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore aboutUs fetch error:", err);
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
      const docRef = doc(db, "aboutUs", "company_about");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.heading || data.title || "");
        setDescription(data.description || "");
        setImage1(data.image1 || "");
        setImage1PublicId(data.image1PublicId || "");
        setImage2(data.image2 || "");
        setImage2PublicId(data.image2PublicId || "");
      }
    } catch (err) {
      console.error("Failed to sync about section:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleImage1Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading1(true);
    try {
      const { url, publicId } = await uploadImageToCloudinary(file, "hs_about");
      if (image1PublicId) {
        await deleteImageFromCloudinary(image1PublicId);
      }
      setImage1(url);
      setImage1PublicId(publicId);
    } catch (err: any) {
      console.error("Failed to upload image 1:", err);
      alert(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading1(false);
      if (fileInputRef1.current) {
        fileInputRef1.current.value = "";
      }
    }
  };

  const handleImage2Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading2(true);
    try {
      const { url, publicId } = await uploadImageToCloudinary(file, "hs_about");
      if (image2PublicId) {
        await deleteImageFromCloudinary(image2PublicId);
      }
      setImage2(url);
      setImage2PublicId(publicId);
    } catch (err: any) {
      console.error("Failed to upload image 2:", err);
      alert(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading2(false);
      if (fileInputRef2.current) {
        fileInputRef2.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const docRef = doc(db, "aboutUs", "company_about");
      await setDoc(
        docRef,
        {
          id: "company_about",
          heading: title.trim(),
          title: title.trim(),
          description: description.trim(),
          image1: image1 || "",
          image1PublicId: image1PublicId || "",
          image2: image2 || "",
          image2PublicId: image2PublicId || "",
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to save about section:", err);
      alert(err?.message || "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fadeIn w-full pb-10">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5 pb-4 border-b border-zinc-200/80">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Brand Story & Atelier
          </span>
        </div>

        {/* Main Title & Action Buttons Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            <span className="sm:hidden">About Section</span>
            <span className="hidden sm:inline">About Section</span>
          </h1>

          {/* Action Buttons Aligned with Main Text */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || isSaving}
              title="Sync latest about info from server"
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
              onClick={handleSubmit}
              disabled={isSaving || isUploading1 || isUploading2}
              className="flex items-center justify-center gap-2 px-5 py-1.5 sm:px-6 sm:py-2.5 rounded-full bg-[#161719] text-white hover:bg-black transition-all shadow-md font-semibold text-xs cursor-pointer group hover:scale-[1.02] disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#FF272A] animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#FF272A]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Manage your brand story, editorial copy, and two showcase studio images.
        </p>
      </div>

      {/* Main Content Loading Skeleton or Form */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 flex flex-col gap-6 w-full animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="h-4 bg-zinc-200 rounded w-1/3" />
              <div className="h-11 bg-zinc-100 rounded-2xl w-full" />
              <div className="h-40 bg-zinc-100 rounded-2xl w-full" />
            </div>
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="h-4 bg-zinc-200 rounded w-1/2" />
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4] bg-zinc-100 rounded-2xl" />
                <div className="aspect-[3/4] bg-zinc-100 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          {/* Main Story & Two Showcase Images Card */}
          <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 flex flex-col gap-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (7 cols): Brand Story Content */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
                  <Type className="w-4 h-4 text-[#FF272A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                    Brand Story & Editorial Copy
                  </span>
                </div>

                {/* Title Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    About Section Title <span className="text-[#FF272A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REDEFINING BEAUTY & MEDIA"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-sm font-semibold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A] transition-all"
                  />
                </div>

                {/* Description Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    About Description <span className="text-[#FF272A]">*</span>
                  </label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Write your brand story, craftsmanship values, and luxury experience..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-800 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A] transition-all resize-none"
                  />
                </div>
              </div>

              {/* Right Column (5 cols): Two Showcase Images */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100">
                  <ImageIcon className="w-4 h-4 text-[#FF272A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                    Showcase Media (2 Photos)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Image 1 Box */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-zinc-600 truncate">
                      Image 1 (Main Studio)
                    </span>

                    <div
                      onClick={() => !isUploading1 && fileInputRef1.current?.click()}
                      className={`relative aspect-[3/4] w-full rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center p-3 transition-all cursor-pointer group ${
                        image1
                          ? "border-zinc-300 bg-zinc-100 hover:border-[#FF272A]"
                          : "border-zinc-200 hover:border-[#FF272A] bg-zinc-50 hover:bg-red-50/20"
                      }`}
                    >
                      {isUploading1 ? (
                        <div className="flex flex-col items-center gap-2 text-[#FF272A]">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-[10px] font-bold">Uploading WebP...</span>
                        </div>
                      ) : image1 ? (
                        <>
                          <Image
                            src={image1}
                            alt="Showcase 1"
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <span className="px-3 py-1.5 rounded-full bg-white text-zinc-900 font-bold text-[11px] shadow-md flex items-center gap-1 backdrop-blur-xs">
                              <Upload className="w-3 h-3 text-[#FF272A]" /> Change
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-1.5 p-2">
                          <div className="w-9 h-9 rounded-xl bg-zinc-200/60 text-zinc-400 flex items-center justify-center group-hover:text-[#FF272A] transition-colors">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-zinc-800 group-hover:text-[#FF272A] transition-colors">
                            Upload 1
                          </span>
                          <span className="text-[10px] text-zinc-400">WebP ≤100 KB</span>
                        </div>
                      )}

                      <input
                        ref={fileInputRef1}
                        type="file"
                        accept="image/*"
                        disabled={isUploading1}
                        className="hidden"
                        onChange={handleImage1Upload}
                      />
                    </div>
                  </div>

                  {/* Image 2 Box */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-zinc-600 truncate">
                      Image 2 (Styling)
                    </span>

                    <div
                      onClick={() => !isUploading2 && fileInputRef2.current?.click()}
                      className={`relative aspect-[3/4] w-full rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center p-3 transition-all cursor-pointer group ${
                        image2
                          ? "border-zinc-300 bg-zinc-100 hover:border-[#FF272A]"
                          : "border-zinc-200 hover:border-[#FF272A] bg-zinc-50 hover:bg-red-50/20"
                      }`}
                    >
                      {isUploading2 ? (
                        <div className="flex flex-col items-center gap-2 text-[#FF272A]">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-[10px] font-bold">Uploading WebP...</span>
                        </div>
                      ) : image2 ? (
                        <>
                          <Image
                            src={image2}
                            alt="Showcase 2"
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                            <span className="px-3 py-1.5 rounded-full bg-white text-zinc-900 font-bold text-[11px] shadow-md flex items-center gap-1 backdrop-blur-xs">
                              <Upload className="w-3 h-3 text-[#FF272A]" /> Change
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center gap-1.5 p-2">
                          <div className="w-9 h-9 rounded-xl bg-zinc-200/60 text-zinc-400 flex items-center justify-center group-hover:text-[#FF272A] transition-colors">
                            <Upload className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-zinc-800 group-hover:text-[#FF272A] transition-colors">
                            Upload 2
                          </span>
                          <span className="text-[10px] text-zinc-400">WebP ≤100 KB</span>
                        </div>
                      )}

                      <input
                        ref={fileInputRef2}
                        type="file"
                        accept="image/*"
                        disabled={isUploading2}
                        className="hidden"
                        onChange={handleImage2Upload}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Feedback Toast */}
          {isSaved && (
            <div className="pt-2 flex items-center">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shadow-xs">
                <Check className="w-4 h-4" /> About section saved and updated live to Firebase!
              </span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
