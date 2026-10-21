"use client";

import React from "react";
import { Settings, Plus, Network } from "lucide-react";

interface HeaderProps {
  onTabChange?: (tab: string) => void;
}

export function Header({ onTabChange }: HeaderProps) {
  return (
    <header className="pt-1 pb-2 min-[511px]:pb-4">
      {/* 1. Mobile Upper Section (only on screens <= 510px) */}
      <div className="flex min-[511px]:hidden items-center justify-between gap-3">
        {/* Left: Title & Subtitle */}
        <div className="flex flex-col justify-center">
          <h1 className="text-[22px] font-extrabold text-[#111215] tracking-tight leading-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Managing your website &amp; workflows
          </p>
        </div>

        {/* Right: Plus (Go to Services) & Settings icons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange?.("services")}
            aria-label="Go to Services"
            className="w-10 h-10 rounded-2xl bg-[#161719] hover:bg-[#27282c] active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-white stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.("profile")}
            aria-label="Settings"
            className="w-10 h-10 rounded-2xl bg-[#f3f5f3] hover:bg-[#eaecea] active:scale-95 text-zinc-700 flex items-center justify-center transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-zinc-800" />
          </button>
        </div>
      </div>

      {/* 2. Desktop Upper Section (screens > 510px) */}
      <div className="hidden min-[511px]:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title with decorative badges */}
        <div>
          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            <span className="inline-flex items-center flex-wrap">
              Managing
              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f2f4f2] text-zinc-700 mx-1.5 sm:mx-2 shadow-xs border border-zinc-200/60 align-middle">
                <Network className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-600" />
              </span>
              Your Website
            </span>
            <br />
            <span className="inline-flex items-center mt-1">
              and Workflows
            </span>
          </h1>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange?.("profile")}
            aria-label="Settings"
            className="w-11 h-11 rounded-2xl bg-[#f3f5f3] hover:bg-[#eaecea] text-zinc-700 flex items-center justify-center transition-colors cursor-pointer border border-zinc-200/40"
          >
            <Settings className="w-5 h-5 text-zinc-700" />
          </button>

          <button
            type="button"
            onClick={() => onTabChange?.("services")}
            className="h-11 px-5 rounded-full bg-[#111215] hover:bg-zinc-800 text-white font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Service</span>
          </button>
        </div>
      </div>
    </header>
  );
}
