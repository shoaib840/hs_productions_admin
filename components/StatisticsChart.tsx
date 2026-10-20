"use client";

import React, { useState } from "react";
import { BarChart3, ChevronDown, Calendar, DollarSign } from "lucide-react";

interface SalonDataPoint {
  date: string;
  dayLabel: string;
  revenuePercent: number; // 0 to 1
  bookingPercent: number; // 0 to 1
  bookingsCount: number;
  revenueAmount: number;
  isPeakWeekend?: boolean;
  activeLabel?: string;
  revenueLabel?: string;
  highlightDate?: boolean;
}

const SALON_CHART_DATA: SalonDataPoint[] = [
  {
    date: "19 Oct",
    dayLabel: "Mon",
    revenuePercent: 0.58,
    bookingPercent: 0.35,
    bookingsCount: 8,
    revenueAmount: 1840,
  },
  {
    date: "20 Oct",
    dayLabel: "Tue",
    revenuePercent: 0.65,
    bookingPercent: 0.38,
    bookingsCount: 10,
    revenueAmount: 2150,
  },
  {
    date: "21 Oct",
    dayLabel: "Wed",
    revenuePercent: 0.76,
    bookingPercent: 0.42,
    bookingsCount: 12,
    revenueAmount: 2680,
  },
  {
    date: "22 Oct",
    dayLabel: "Thu",
    revenuePercent: 0.82,
    bookingPercent: 0.48,
    bookingsCount: 14,
    revenueAmount: 3120,
  },
  {
    date: "23 Oct",
    dayLabel: "Fri",
    revenuePercent: 0.94,
    bookingPercent: 0.62,
    bookingsCount: 19,
    revenueAmount: 4350,
    activeLabel: "19 Bookings",
    revenueLabel: "$4.3k",
    highlightDate: true,
  },
  {
    date: "24 Oct",
    dayLabel: "Sat",
    revenuePercent: 1.0,
    bookingPercent: 0.75,
    bookingsCount: 24,
    revenueAmount: 5120,
    isPeakWeekend: true,
    activeLabel: "Bridal Peak",
    revenueLabel: "$5.1k",
    highlightDate: true,
  },
  {
    date: "25 Oct",
    dayLabel: "Sun",
    revenuePercent: 0.88,
    bookingPercent: 0.55,
    bookingsCount: 16,
    revenueAmount: 3890,
  },
  {
    date: "26 Oct",
    dayLabel: "Mon",
    revenuePercent: 0.62,
    bookingPercent: 0.36,
    bookingsCount: 9,
    revenueAmount: 1950,
  },
];

const Y_TICKS = ["$5.0k", "$4.5k", "$4.0k", "$3.5k", "$3.0k", "$2.5k", "$2.0k", "$1.5k", "$1.0k", "$0.5k"];

export function StatisticsChart() {
  const [selectedPeriod, setSelectedPeriod] = useState("This Week (Oct 2026)");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-[#f7f8f7] rounded-[30px] p-6 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs border border-zinc-200/50">
              <BarChart3 className="w-4 h-4 text-zinc-800" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#111215]">
                Salon Bookings & Revenue
              </h3>
              <span className="text-[11px] text-zinc-500 font-medium">
                Peak performance during bridal couture weekends
              </span>
            </div>
          </div>

          {/* Legends */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-zinc-800">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111215]" />
              <span>Service Bookings</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-700">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF272A]" />
              <span>Revenue Generated</span>
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200/80 text-xs font-bold text-zinc-800 shadow-2xs hover:bg-zinc-50 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#FF272A]" />
            <span>{selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="relative flex gap-3 h-[240px] pt-4">
        {/* Y Axis Labels */}
        <div className="flex flex-col justify-between text-[11px] text-zinc-400 font-mono w-10 shrink-0 select-none pb-6">
          {Y_TICKS.map((tick) => (
            <span key={tick} className="leading-none text-right pr-1">
              {tick}
            </span>
          ))}
        </div>

        {/* Plot Area with Grid Lines */}
        <div className="relative flex-1 flex flex-col justify-between pb-6">
          {/* Background Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
            {Y_TICKS.map((tick) => (
              <div key={tick} className="w-full border-b border-zinc-200/50" />
            ))}
          </div>

          {/* Bars Container */}
          <div className="relative z-10 flex-1 grid grid-cols-8 items-end gap-1 sm:gap-4 h-full">
            {SALON_CHART_DATA.map((item, index) => {
              const isHovered = hoveredIndex === index;
              const totalHeightPercent = item.revenuePercent * 100;
              const bookingHeightPercent = (item.bookingPercent / item.revenuePercent) * 100;

              return (
                <div
                  key={item.date}
                  className="flex flex-col items-center h-full justify-end relative group cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Floating Tooltip On Hover */}
                  {isHovered && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 bg-[#161719] text-white px-3 py-1.5 rounded-xl shadow-xl text-center whitespace-nowrap pointer-events-none border border-zinc-800">
                      <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        {item.dayLabel}, {item.date}
                      </div>
                      <div className="text-xs font-black text-white">
                        ${item.revenueAmount.toLocaleString()} • {item.bookingsCount} Appts
                      </div>
                    </div>
                  )}

                  {/* Static highlight badge (e.g., Friday & Saturday) */}
                  {!isHovered && item.activeLabel && (
                    <div className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="px-2 py-0.5 rounded-full bg-[#111215] text-white text-[9px] sm:text-[10px] font-bold shadow-md whitespace-nowrap">
                        {item.activeLabel}
                      </span>
                    </div>
                  )}

                  {/* Main Pill Bar Container */}
                  <div
                    className={`w-6 sm:w-8 rounded-full overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-xs ${
                      isHovered ? "scale-105 shadow-md" : ""
                    }`}
                    style={{ height: `${totalHeightPercent}%` }}
                  >
                    {/* Top Segment: Total Bookings (Black) */}
                    <div className="bg-[#111215] w-full flex-1 flex items-start justify-center pt-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white shadow-2xs" />
                    </div>

                    {/* Bottom Segment: Revenue Generated (Brand Red #FF272A) */}
                    <div
                      className="bg-[#FF272A] w-full flex items-start justify-center pt-2 transition-all"
                      style={{ height: `${bookingHeightPercent}%` }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* X Axis Labels */}
          <div className="grid grid-cols-8 gap-1 sm:gap-4 text-center mt-3 pt-2">
            {SALON_CHART_DATA.map((item) => (
              <div key={item.date} className="flex flex-col items-center">
                <span
                  className={`text-[11px] sm:text-xs truncate ${
                    item.highlightDate ? "font-bold text-zinc-900" : "font-medium text-zinc-500"
                  }`}
                >
                  {item.date}
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold">{item.dayLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
