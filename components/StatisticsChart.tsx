"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface ChartBarPoint {
  id: string;
  topLabel: string;
  subLabel: string;
  fullDateLabel: string;
  count: number;
}

export function StatisticsChart() {
  const [timeframe, setTimeframe] = useState<"7days" | "6months">("7days");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Raw data from Firestore
  const [dailyDataMap, setDailyDataMap] = useState<Record<string, number>>({});
  const [monthlyDataMap, setMonthlyDataMap] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Live listener for daily_lead_records
    const unsubDaily = onSnapshot(
      collection(db, "daily_lead_records"),
      (snap) => {
        const map: Record<string, number> = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const count = Number(data.count) || 0;
          // Document ID is "YYYY-MM-DD"
          map[docSnap.id] = count;
        });
        setDailyDataMap(map);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore daily_lead_records error:", err);
        setLoading(false);
      }
    );

    // 2. Live listener for monthly_lead_records
    const unsubMonthly = onSnapshot(
      collection(db, "monthly_lead_records"),
      (snap) => {
        const map: Record<string, number> = {};
        snap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const count = Number(data.count) || 0;
          // Document ID is "YYYY-MM"
          map[docSnap.id] = count;
        });
        setMonthlyDataMap(map);
      },
      (err) => console.error("Firestore monthly_lead_records error:", err)
    );

    return () => {
      unsubDaily();
      unsubMonthly();
    };
  }, []);

  // Compute 7 Days Data
  const last7DaysData: ChartBarPoint[] = React.useMemo(() => {
    const list: ChartBarPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;

      const topLabel = d.toLocaleDateString("en-US", { day: "numeric", month: "short" }); // e.g. "21 Oct"
      const subLabel = d.toLocaleDateString("en-US", { weekday: "short" }); // e.g. "Wed"
      const fullDateLabel = d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      list.push({
        id: key,
        topLabel,
        subLabel,
        fullDateLabel,
        count: dailyDataMap[key] || 0,
      });
    }
    return list;
  }, [dailyDataMap]);

  // Compute 6 Months Data
  const last6MonthsData: ChartBarPoint[] = React.useMemo(() => {
    const list: ChartBarPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const key = `${year}-${month}`;

      const topLabel = d.toLocaleDateString("en-US", { month: "short" }); // e.g. "Oct"
      const subLabel = String(year); // e.g. "2026"
      const fullDateLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      list.push({
        id: key,
        topLabel,
        subLabel,
        fullDateLabel,
        count: monthlyDataMap[key] || 0,
      });
    }
    return list;
  }, [monthlyDataMap]);

  const activeData = timeframe === "7days" ? last7DaysData : last6MonthsData;

  // Calculate dynamic Y-axis ticks
  const maxCount = Math.max(...activeData.map((d) => d.count), 0);
  const highestPeak = Math.max(maxCount, 10);
  const roundCeiling = Math.ceil(highestPeak / 5) * 5;
  const tickSteps = 5;
  const yTicks = Array.from({ length: tickSteps + 1 }, (_, i) => {
    return Math.round(roundCeiling - (i * roundCeiling) / tickSteps);
  });

  const peakItem = activeData.reduce(
    (max, cur) => (cur.count > max.count ? cur : max),
    activeData[0] || { count: 0 }
  );

  return (
    <div className="bg-[#f7f8f7] rounded-[30px] p-4 sm:p-6 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-xs border border-zinc-200/50">
              <BarChart3 className="w-4 h-4 text-zinc-800" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-[#111215]">
                Leads &amp; Inquiries Activity
              </h3>
              <span className="text-[11px] text-zinc-500 font-medium">
                {timeframe === "7days"
                  ? "Daily records across the last 7 days"
                  : "Monthly volume trends across the last 6 months"}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF272A]" />
            <span>Lead Inquiries</span>
          </div>
        </div>

        {/* Timeframe Toggle Buttons in a Row */}
        <div className="inline-flex items-center p-1 bg-white rounded-full border border-zinc-200/80 shadow-2xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTimeframe("7days")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              timeframe === "7days"
                ? "bg-[#111215] text-white shadow-xs"
                : "text-zinc-600 hover:text-black hover:bg-zinc-100/60"
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("6months")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              timeframe === "6months"
                ? "bg-[#111215] text-white shadow-xs"
                : "text-zinc-600 hover:text-black hover:bg-zinc-100/60"
            }`}
          >
            Last 6 Months
          </button>
        </div>
      </div>

      {/* Chart Body */}
      {loading ? (
        <div className="h-[240px] flex flex-col items-center justify-center text-zinc-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF272A]" />
          <span className="text-xs font-medium">Loading graph metrics...</span>
        </div>
      ) : (
        <div className="relative flex gap-2 sm:gap-3 h-[240px] pt-4">
          {/* Y Axis Labels */}
          <div className="flex flex-col justify-between text-[11px] text-zinc-400 font-mono w-7 sm:w-8 shrink-0 select-none pb-6">
            {yTicks.map((tick) => (
              <span key={tick} className="leading-none text-right pr-1">
                {tick}
              </span>
            ))}
          </div>

          {/* Plot Area with Grid Lines */}
          <div className="relative flex-1 flex flex-col justify-between pb-6">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
              {yTicks.map((tick) => (
                <div key={tick} className="w-full border-b border-zinc-200/50" />
              ))}
            </div>

            {/* Bars Container */}
            <div
              className={`relative z-10 flex-1 grid ${
                timeframe === "7days" ? "grid-cols-7" : "grid-cols-6"
              } items-end gap-1 sm:gap-4 h-full`}
            >
              {activeData.map((item, index) => {
                const isHovered = hoveredIndex === index;
                const isPeak =
                  peakItem &&
                  peakItem.count > 0 &&
                  peakItem.id === item.id;

                // Scale bar height from 6% to 100%
                const heightPercent =
                  roundCeiling > 0
                    ? Math.max((item.count / roundCeiling) * 100, item.count > 0 ? 14 : 5)
                    : 5;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-center h-full justify-end relative group cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Floating Tooltip On Hover */}
                    {isHovered && (
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 bg-[#161719] text-white px-3 py-1.5 rounded-xl shadow-xl text-center whitespace-nowrap pointer-events-none border border-zinc-800">
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                          {item.fullDateLabel}
                        </div>
                        <div className="text-xs font-black text-white">
                          {item.count} Inbound {item.count === 1 ? "Lead" : "Leads"}
                        </div>
                      </div>
                    )}

                    {/* Static highlight badge on the peak record */}
                    {!isHovered && isPeak && (
                      <div className="absolute -top-3.5 sm:-top-4 left-1/2 -translate-x-1/2 z-20">
                        <span className="px-2 py-0.5 rounded-full bg-[#111215] text-white text-[9px] sm:text-[10px] font-bold shadow-md whitespace-nowrap">
                          {item.count} Leads
                        </span>
                      </div>
                    )}

                    {/* Main Capsule Pill Bar (Pure Red) */}
                    {item.count === 0 ? (
                      <div className="w-5 sm:w-8 h-2.5 rounded-full bg-zinc-300/80 transition-all" />
                    ) : (
                      <div
                        className={`w-5 sm:w-8 rounded-full overflow-hidden flex flex-col items-center justify-start pt-2 bg-[#FF272A] transition-all duration-300 shadow-sm ${
                          isHovered ? "scale-105 shadow-md brightness-110" : ""
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      >
                        <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-white shadow-xs" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* X Axis Labels */}
            <div
              className={`grid ${
                timeframe === "7days" ? "grid-cols-7" : "grid-cols-6"
              } gap-1 sm:gap-4 text-center mt-3 pt-2`}
            >
              {activeData.map((item) => (
                <div key={item.id} className="flex flex-col items-center">
                  <span
                    className={`text-[10px] sm:text-xs truncate ${
                      item.count > 0 ? "font-bold text-zinc-900" : "font-medium text-zinc-500"
                    }`}
                  >
                    {item.topLabel}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 font-semibold truncate">
                    {item.subLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
