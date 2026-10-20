"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Layers,
  PhoneCall,
  Tag,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface StatCardsProps {
  onTabChange?: (tab: string) => void;
}

export function StatCards({ onTabChange }: StatCardsProps) {
  // 1. Services Stats State
  const [servicesCount, setServicesCount] = useState<number>(6);
  const [avgTicket, setAvgTicket] = useState<number>(185);

  // 2. Inquiries Stats State
  const [inquiriesCount, setInquiriesCount] = useState<number>(4);
  const [confirmedCount, setConfirmedCount] = useState<number>(3);
  const [pendingCount, setPendingCount] = useState<number>(1);

  // 3. Featured Offer State
  const [featuredOffer, setFeaturedOffer] = useState<{
    title: string;
    code: string;
    discountText: string;
  }>({
    title: "Autumn Balayage Glamour Special",
    code: "BALAYAGE25",
    discountText: "25% OFF",
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
            setAvgTicket(Math.round(sum / prices.length));
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

    // 3. Live listener for Offers collection
    const unsubOffers = onSnapshot(
      collection(db, "offers"),
      (snap) => {
        if (!snap.empty) {
          const activeDocs = snap.docs
            .map((d) => d.data())
            .filter((d) => d.status === "Active" || !d.status);
          if (activeDocs.length > 0) {
            const first = activeDocs[0];
            const discount =
              first.discountType === "percentage"
                ? `${first.discountValue}% OFF`
                : `$${first.discountValue} OFF`;
            const code =
              first.code ||
              (first.title ? first.title.replace(/[^A-Z0-9]/gi, "").slice(0, 8).toUpperCase() : "PROMO");
            setFeaturedOffer({
              title: first.title || "Salon Exclusive Promotion",
              code: code,
              discountText: discount,
            });
          }
        }
      },
      (err) => console.error("Firestore offers stat error:", err)
    );

    return () => {
      unsubServices();
      unsubInquiries();
      unsubOffers();
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
              Avg. ${avgTicket} ticket
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
                    className={`w-3.5 h-8 rounded-full transition-all ${
                      isConfirmed
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

      {/* 3. Promo Banner Card (Obsidian #111214 Theme) */}
      <div className="bg-[#111214] text-white rounded-[30px] p-6 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group min-h-[170px]">
        {/* Background salon photo overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-[52%] pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300">
          <Image
            src="/salon-hero.jpg"
            alt="Promotion Banner"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111214] via-[#111214]/70 to-transparent" />
        </div>

        {/* Banner Title */}
        <div className="relative z-10 max-w-[60%]">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-[#FF272A] mb-1">
            <Sparkles className="w-3 h-3" /> Featured Offer
          </span>
          <h2 className="text-base sm:text-lg font-extrabold leading-tight line-clamp-2">
            {featuredOffer.title}
          </h2>
          <span className="text-xs text-zinc-400 font-semibold block mt-1">
            {featuredOffer.discountText} • Code {featuredOffer.code}
          </span>
        </div>

        {/* Action Button */}
        <div className="relative z-10 pt-3">
          <button
            type="button"
            onClick={() => onTabChange?.("offers")}
            className="px-4 py-2 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <Tag className="w-3 h-3 text-[#FF272A]" />
            <span>Manage Offers</span>
          </button>
        </div>
      </div>
    </div>
  );
}
