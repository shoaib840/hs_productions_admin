"use client";

import React, { useState } from "react";

const TABS = [
  "Organization",
  "Teams",
  "Users",
  "Subscription",
  "Payment",
  "Installed Apps",
  "Variables",
  "Scenario Properties",
];

export function TabsNav() {
  const [activeTab, setActiveTab] = useState<string>("Organization");

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none no-scrollbar">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${isActive
              ? "bg-[#111215] text-white shadow-xs"
              : "text-zinc-600 hover:text-zinc-900 hover:bg-[#f3f5f3]"
              }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
