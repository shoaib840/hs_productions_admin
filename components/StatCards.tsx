"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Layers,
  PhoneCall,
  ArrowUpRight,
  CheckCircle2,
  Images,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { getCachedGallery } from "@/lib/galleryCache";

interface StatCardsProps {
  onTabChange?: (tab: string) => void;
}

export function StatCards({ onTabChange }: StatCardsProps) {
  // 1. Services Stats State
  const [servicesCount, setServicesCount] = useState<number>(6);
  const [totalServicesPrice, setTotalServicesPrice] = useState<number>(0);

  // 2. Inquiries Stats State
  const [inquiriesCount, setInquiriesCount] = useState<number>(4);
  const [confirmedCount, setConfirmedCount] = useState<number>(3);
  const [pendingCount, setPendingCount] = useState<number>(1);

  // 3. Gallery Lookbook State
  const [galleryCount, setGalleryCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const c = getCachedGallery();
      return c?.items?.length || 0;
    }
    return 0;
  });
  const [heroImage, setHeroImage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const c = getCachedGallery();
      return c?.items?.[0]?.imageUrl || "/salon-hero.jpg";
    }
    return "/salon-hero.jpg";
  });

  useEffect(() => {
    // 1. Live listener for Services collection
    const unsubServices = onSnapshot(
      collection(db, "services"),
      (snap) => {
        if (!snap.empty) {
          const total = snap.docs.length;
          setServicesCount(total);
          const prices = snap.docs
            .map((d) => Number(d.data().price) || 0)
            .filter((p) => p > 0);
          if (prices.length > 0) {
            const sum = prices.reduce((acc, curr) => acc + curr, 0);
            setTotalServicesPrice(sum);
          }
        }
      },
      (err) => console.error("Firestore services stat error:", err)
    );

    // 2. Live listener for Inquiries collection
    const unsubInquiries = onSnapshot(
      collection(db, "inquiries"),
      (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map((d) => d.data());
          setInquiriesCount(docs.length);
          const confirmed = docs.filter(
            (d) => String(d.status).toLowerCase() === "confirmed"
          ).length;
          const pending = docs.filter(
            (d) => String(d.status).toLowerCase() === "new"
          ).length;
          setConfirmedCount(confirmed);
          setPendingCount(pending);
        }
      },
      (err) => console.error("Firestore inquiries stat error:", err)
    );

    // 3. Live listener for Gallery collection
    const unsubGallery = onSnapshot(
      doc(db, "gallery", "gallery"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const rawImages: any[] = data.images || data.items || [];
          const validUrls = rawImages
            .map((item: any) =>
              typeof item === "string"
                ? item
                : typeof item?.imageUrl === "string"
                  ? item.imageUrl.trim()
                  : ""
            )
            .filter((url: string) => Boolean(url && url.length > 0));

          if (validUrls.length > 0) {
            setGalleryCount(validUrls.length);
            setHeroImage(validUrls[0]);
          } else {
            setGalleryCount(0);
          }
        }
      },
      (err) => console.error("Firestore gallery stat error:", err)
    );

    return () => {
      unsubServices();
      unsubInquiries();
      unsubGallery();
    };
  }, []);

  // Determine pill count for services
  const pillsToRender = Math.min(Math.max(servicesCount, 1), 6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Services Portfolio Card */}
      <div
        onClick={() => onTabChange?.("services")}
        className="bg-[#f3f5f3] rounded-[30px] p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs border border-zinc-200/50 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 text-zinc-800" />
            </div>
            <span className="font-bold text-sm text-[#111215]">Services</span>
          </div>
          <span className="text-zinc-400 group-hover:text-black transition-colors p-1">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        {/* Metric Value */}
        <div className="my-5">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-[44px] font-bold text-[#111215] tracking-tight leading-none">
              {String(servicesCount).padStart(2, "0")}
            </span>
            <span className="text-zinc-500 text-xs font-semibold">
              Total Rs. {totalServicesPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Capsule Progress Bars + 100% Live Badge */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: pillsToRender }).map((_, index) => (
              <div
                key={index}
                title={`Active service tier ${index + 1}`}
                className="w-3.5 h-8 rounded-full bg-[#111215] transition-all hover:scale-105"
              />
            ))}
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-semibold shadow-2xs">
            <CheckCircle2 className="w-3 h-3" />
            100% Live
          </span>
        </div>
      </div>

      {/* 2. Client Inquiries Card (Red #FF272A Theme) */}
      <div
        onClick={() => onTabChange?.("contacts")}
        className="bg-[#FF272A] text-white rounded-[30px] p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <PhoneCall className="w-4 h-4 text-[#FF272A]" />
            </div>
            <span className="font-bold text-sm text-white">Client Inquiries</span>
          </div>
          <span className="text-white/80 group-hover:text-white transition-colors p-1">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        {/* Metric Value */}
        <div className="my-5">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-[44px] font-bold text-white tracking-tight leading-none">
              {String(inquiriesCount).padStart(2, "0")}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-zinc-950 text-xs font-bold shadow-2xs">
              Active Desk
            </span>
            <span className="text-white/90 text-xs font-semibold">
              {confirmedCount} Confirmed
            </span>
          </div>
        </div>

        {/* Capsule Progress Bars */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(Math.max(inquiriesCount, 1), 6) }).map(
              (_, index) => {
                const isConfirmed = index < confirmedCount;
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-8 rounded-full transition-all ${isConfirmed
                      ? "bg-white"
                      : "border-2 border-dashed border-white/50 bg-white/20"
                      }`}
                  />
                );
              }
            )}
          </div>
          <span className="text-[11px] font-semibold text-white/90">
            {pendingCount > 0 ? `${pendingCount} New Ticket Pending` : "All Up to Date"}
          </span>
        </div>
      </div>

      {/* 3. Studio Gallery Box (Obsidian #111214 Theme) */}
      <div
        onClick={() => onTabChange?.("gallery")}
        className="bg-[#111214] text-white rounded-[30px] p-6 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group min-h-[170px] cursor-pointer active:scale-[0.99]"
      >
        {/* Background photo overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none opacity-80 group-hover:scale-105 transition-transform duration-500">
          <Image
            src={heroImage}
            alt="Studio Lookbook"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111214] via-[#111214]/80 to-transparent" />
        </div>

        {/* Card Header & Title */}
        <div className="relative z-10 max-w-[65%]">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#FF272A] mb-1">
            <Images className="w-3.5 h-3.5" /> Studio Gallery
          </span>
          <h2 className="text-base sm:text-lg font-extrabold leading-tight text-white mt-0.5">
            Visual Lookbook
          </h2>
          <span className="text-xs text-zinc-400 font-semibold block mt-0.5">
            {galleryCount > 0 ? `${galleryCount} Showcase Photos` : "Curated Visuals"}
          </span>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTabChange?.("gallery");
            }}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <span>Open Gallery</span>
            <ArrowUpRight className="w-3 h-3 text-zinc-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
