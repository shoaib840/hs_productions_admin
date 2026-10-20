"use client";

import React from "react";
import { Plus, Sparkles, Layers, RefreshCcw } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  badge?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon = Layers,
  badge = "Empty State",
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="w-full py-16 px-6 sm:px-12 rounded-3xl border-2 border-dashed border-zinc-200/90 bg-gradient-to-b from-zinc-50/60 to-white flex flex-col items-center justify-center text-center animate-fadeIn shadow-xs">
      {/* Decorative Icon Container */}
      <div className="mb-5">
        <div className="w-20 h-20 rounded-3xl bg-[#161719] text-white flex items-center justify-center shadow-xl border border-white/10 group">
          <Icon className="w-9 h-9 text-zinc-300 group-hover:text-[#FF272A] transition-colors stroke-[1.7]" />
        </div>
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[11px] font-bold uppercase tracking-wider mb-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF272A]" />
        <span>{badge}</span>
      </div>

      {/* Title & Description */}
      <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight max-w-md">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-md leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <div className="mt-7">
          <button
            type="button"
            onClick={onAction}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] group"
          >
            <Plus className="w-4 h-4 text-[#FF272A] group-hover:rotate-90 transition-transform" />
            <span>{actionLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
