"use client";

import React from "react";
import {
  Star,
  Tag,
  ArrowUpRight,
  Clock,
  Phone,
  Sparkles,
  MapPin,
} from "lucide-react";

interface RightResourcesProps {
  onTabChange?: (tab: string) => void;
}

export function RightResources({ onTabChange }: RightResourcesProps) {
  const recentInquiries = [
    {
      id: "1",
      client: "Sophia Montgomery",
      service: "Royal Bridal Package",
      time: "Oct 24 • 11:00 AM",
      status: "New",
      badgeColor: "bg-[#FF272A]/10 text-[#FF272A] border-[#FF272A]/20",
    },
    {
      id: "2",
      client: "Alexander Wright",
      service: "Gentlemen's Grooming",
      time: "Oct 22 • 4:30 PM",
      status: "Confirmed",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      id: "3",
      client: "Camila De Silva",
      service: "Balayage & Gloss",
      time: "Oct 25 • 1:00 PM",
      status: "Contacted",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      id: "4",
      client: "Isabella Fontaine",
      service: "Hydra-Radiance Facial",
      time: "Oct 26 • 10:00 AM",
      status: "New",
      badgeColor: "bg-[#FF272A]/10 text-[#FF272A] border-[#FF272A]/20",
    },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      {/* Top 2 Salon Action Blocks */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Reviews Screen Shortcut */}
        <button
          type="button"
          onClick={() => onTabChange?.("reviews")}
          className="bg-[#f3f5f3] hover:bg-[#eaecea] rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer group shadow-2xs"
        >
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-2xs group-hover:scale-105 transition-transform">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#111215] block">5.0 Rating</span>
            <span className="text-[10px] text-zinc-500 font-medium">18 Reviews</span>
          </div>
        </button>

        {/* Offers Screen Shortcut */}
        <button
          type="button"
          onClick={() => onTabChange?.("offers")}
          className="bg-[#f3f5f3] hover:bg-[#eaecea] rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer group shadow-2xs"
        >
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#FF272A] shadow-2xs group-hover:scale-105 transition-transform">
            <Tag className="w-4 h-4 text-[#FF272A]" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#111215] block">4 Active Deals</span>
            <span className="text-[10px] text-zinc-500 font-medium">Promotions</span>
          </div>
        </button>
      </div>

      {/* Recent Client Inquiries Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Inbound Inquiries
          </h4>
        </div>
        <button
          type="button"
          onClick={() => onTabChange?.("contacts")}
          className="text-xs font-bold text-zinc-500 hover:text-black flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {/* Inquiry Cards List */}
      <div className="flex flex-col gap-2.5">
        {recentInquiries.map((item) => (
          <div
            key={item.id}
            onClick={() => onTabChange?.("contacts")}
            className="bg-[#f3f5f3] hover:bg-[#eaecea] rounded-[20px] p-3.5 flex flex-col justify-between transition-all group shadow-2xs cursor-pointer border border-transparent hover:border-zinc-300/60"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-xs text-zinc-900 truncate">
                {item.client}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${item.badgeColor}`}
              >
                {item.status}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-600">
              <span className="font-medium text-zinc-700 truncate pr-2">
                {item.service}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium shrink-0">
                {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Studio Location & Concierge Quick Footer */}
      <div
        onClick={() => onTabChange?.("profile")}
        className="p-3.5 rounded-[20px] bg-[#161719] text-white flex items-center justify-between cursor-pointer hover:bg-black transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
            <MapPin className="w-3.5 h-3.5 text-[#FF272A]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-white leading-tight">
              HS Productions Concierge
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">
              Bahawalpur • +92 300 1234567
            </span>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-zinc-400" />
      </div>
    </div>
  );
}
