"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/Sidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="w-full h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-3 border-zinc-200 border-t-[#FF272A] rounded-full animate-spin" />
          <span className="text-xs font-semibold text-zinc-500 tracking-wider uppercase">Loading Portal...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // Derive current active tab from pathname: e.g. "/gallery" -> "gallery", "/profile" -> "profile"
  const currentTab = pathname?.split("/").filter(Boolean)[0] || "dashboard";

  const handleTabChange = (tab: string) => {
    router.push(`/${tab}`);
  };

  return (
    <main className="w-full h-screen bg-white flex flex-col md:flex-row overflow-hidden md:items-center">
      {/* Floating Left Navigation Sidebar Capsule */}
      <Sidebar currentTab={currentTab} onTabChange={handleTabChange} />

      {/* Main Full-width Independently Scrollable Workspace */}
      <div className="flex-1 pt-[72px] p-4 pb-8 md:p-8 lg:p-10 flex flex-col gap-6 overflow-y-auto h-full max-w-[1600px] w-full min-h-0">
        {children}
      </div>
    </main>
  );
}
