"use client";

import React from "react";
import Image from "next/image";
import { Layers, PhoneCall, Tag, ArrowUpRight, Sparkles, CheckCircle2 } from "lucide-react";

interface StatCardsProps {
  onTabChange?: (tab: string) => void;
}

export function StatCards({ onTabChange }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Services Portfolio Card */}
      <div
        onClick={() => onTabChange?.("services")}
        className="bg-[#f3f5f3] rounded-[30px] p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs border border-zinc-200/50 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4 text-zinc-800" />
            </div>
            <span className="font-bold text-sm text-[#111215]">Salon Services</span>
          </div>
          <span className="text-zinc-400 group-hover:text-black transition-colors p-1">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>

        {/* Metric Value */}
        <div className="my-5">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-[44px] font-bold text-[#111215] tracking-tight leading-none">
              06
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="w-3 h-3" />
              100% Live
            </span>
            <span className="text-zinc-500 text-xs font-semibold">Avg. $185 ticket</span>
          </div>
        </div>

        {/* Capsule Progress Bars: 6 active service categories */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <div
                key={index}
                title="Service category active"
                className="w-3.5 h-8 rounded-full bg-[#111215] transition-all"
              />
            ))}
          </div>
          <span className="text-[11px] font-semibold text-zinc-500">
            Hair • Spa • Bridal
          </span>
        </div>
      </div>

      {/* 2. Client Inquiries Card (Red #FF272A Theme) */}
      <div
        onClick={() => onTabChange?.("contacts")}
        className="bg-[#FF272A] text-white rounded-[30px] p-6 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
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
              04
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-zinc-950 text-xs font-bold shadow-2xs">
              +28% this wk
            </span>
            <span className="text-white/90 text-xs font-semibold">3 Confirmed</span>
          </div>
        </div>

        {/* Capsule Progress Bars: Inquiries resolution status */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((index) => {
              const isConfirmed = index <= 3;
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
            })}
          </div>
          <span className="text-[11px] font-semibold text-white/90">
            1 New Ticket Pending
          </span>
        </div>
      </div>

      {/* 3. Promo Banner Card (Obsidian #111214 Theme) */}
      <div className="bg-[#111214] text-white rounded-[30px] p-6 relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group min-h-[170px]">
        {/* Background salon photo overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-[52%] pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300">
          <Image
            src="/salon-hero.jpg"
            alt="Autumn Balayage Promo"
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
          <h2 className="text-base sm:text-lg font-extrabold leading-tight">
            Autumn Balayage Glamour Special
          </h2>
          <span className="text-xs text-zinc-400 font-semibold block mt-1">
            25% OFF • Code BALAYAGE25
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
