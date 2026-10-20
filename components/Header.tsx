"use client";

import React from "react";
import { Settings, Plus, Sparkles, Network } from "lucide-react";

interface HeaderProps {
  onTabChange?: (tab: string) => void;
}

export function Header({ onTabChange }: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 pb-4">
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
      <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
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
    </header>
  );
}
