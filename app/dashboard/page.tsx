"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/AdminLayout";
import { Header } from "@/components/Header";
import { StatCards } from "@/components/StatCards";
import { StatisticsChart } from "@/components/StatisticsChart";
import { RightResources } from "@/components/RightResources";

export default function DashboardPage() {
  const router = useRouter();

  const handleTabChange = (tab: string) => {
    router.push(`/${tab}`);
  };

  return (
    <AdminLayout>
      {/* Top Title & Primary Actions */}
      <Header onTabChange={handleTabChange} />

      {/* Grid Layout: Main Stats + Right Resources */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-9 flex flex-col gap-6">
          <StatCards onTabChange={handleTabChange} />
          <StatisticsChart />
        </div>
        <div className="xl:col-span-3">
          <RightResources onTabChange={handleTabChange} />
        </div>
      </div>
    </AdminLayout>
  );
}
