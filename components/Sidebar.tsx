"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  Layers,
  Images,
  Info,
  Phone,
  Star,
  Tag,
  LogOut,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface SidebarProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [internalActiveTab, setInternalActiveTab] = useState<string>("dashboard");
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Dynamic Profile Data streamed from Firestore
  const [profileName, setProfileName] = useState<string>("");
  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const [profileRole, setProfileRole] = useState<string>("Master Admin");

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "profile"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.name) setProfileName(data.name);
        if (data.avatarUrl) setProfileAvatar(data.avatarUrl);
        if (data.role) setProfileRole(data.role);
      }
    });
    return () => unsub();
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsMobileDrawerOpen(false);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
      router.push("/");
    }
  };

  const activeTab = currentTab ?? internalActiveTab;
  const isExpanded = isHovered;

  const handleSelectTab = (id: string) => {
    setInternalActiveTab(id);
    onTabChange?.(id);
    setIsMobileDrawerOpen(false);
  };

  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "services", icon: Layers, label: "Services" },
    { id: "offers", icon: Tag, label: "Offers" },
    { id: "reviews", icon: Star, label: "Reviews" },
    { id: "gallery", icon: Images, label: "Gallery" },
    { id: "about", icon: Info, label: "About Us" },
    { id: "contacts", icon: Phone, label: "Inquiries" },
  ];

  return (
    <>
      {/* 1. Mobile Top Bar Header (Fixed on mobile screens < md) */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-[#161719] border-b border-white/[0.08] px-4 flex items-center justify-between z-30 select-none shadow-md">
        <div className="flex items-center gap-3">
          {/* Menu Icon Button (Replaces Logo) */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            aria-label="Open Sidebar Menu"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 shadow-xs"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <span className="font-bold text-sm sm:text-base text-white leading-tight tracking-tight">
            <span className="text-[#FF272A]">H</span>S Productions
          </span>
        </div>

        {/* Profile Avatar trigger */}
        <button
          type="button"
          onClick={() => handleSelectTab("profile")}
          className={`flex items-center gap-2 p-1 rounded-xl transition-all ${activeTab === "profile" ? "ring-2 ring-[#FF272A]" : ""
            }`}
          title="Open Profile"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-white/20 relative bg-zinc-800 flex items-center justify-center">
            {profileAvatar ? (
              <Image
                src={profileAvatar}
                alt={profileName || "Profile"}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <Image
                src="/user-avatar.jpg"
                alt="Profile avatar"
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#FF272A] border border-[#161719] rounded-full" />
          </div>
        </button>
      </header>

      {/* 2. Mobile Sidebar Slide-in Drawer with Bidirectional Animation */}
      <div
        className={`fixed inset-0 z-[150] bg-black/75 backdrop-blur-xs flex md:hidden transition-opacity duration-300 ease-in-out ${isMobileDrawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setIsMobileDrawerOpen(false)}
      >
        <div
          className={`w-[285px] max-w-[85vw] h-full bg-[#161719] flex flex-col justify-between p-5 pb-28 overflow-y-auto shadow-2xl border-r border-white/10 select-none transition-transform duration-300 ease-in-out transform ${isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header & Navigation */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center p-1 border border-white/10 relative overflow-hidden shrink-0">
                  <Image
                    src="/assets/icons/logo.png"
                    alt="HS Productions Logo"
                    fill
                    sizes="40px"
                    className="object-contain p-0.5"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white leading-tight">
                    <span className="text-[#FF272A]">H</span>S Productions
                  </span>
                  <span className="text-[9px] font-bold text-[#FF272A] uppercase tracking-wider">
                    STUDIO & SALON
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`h-11 px-3.5 rounded-2xl flex items-center gap-3 w-full transition-all cursor-pointer ${isActive
                        ? "bg-[#2b2d33] text-white shadow-inner font-semibold border border-white/10"
                        : "text-zinc-400 hover:text-white hover:bg-[#202126]"
                      }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${isActive ? "text-[#FF272A]" : "text-zinc-400"
                        }`}
                    />
                    <span className="text-sm font-semibold">{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#FF272A] ml-auto" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Drawer Bottom Profile & Logout */}
          <div className="flex flex-col gap-2 pt-4 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTab("profile")}
              className={`h-12 px-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer ${activeTab === "profile"
                  ? "bg-[#2b2d33] text-white border border-white/10"
                  : "hover:bg-[#202126] text-zinc-300"
                }`}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-zinc-700/60 shadow-md bg-zinc-800 flex items-center justify-center">
                  {profileAvatar ? (
                    <Image
                      src={profileAvatar}
                      alt={profileName || "Profile"}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/user-avatar.jpg"
                      alt="Profile avatar"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#FF272A] border-2 border-[#161719] rounded-full" />
              </div>
              <div className="flex flex-col text-left truncate min-w-0">
                <span className="text-xs font-bold text-white truncate max-w-[160px]">
                  {profileName || "Master Admin"}
                </span>
                <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                  {profileRole || "Profile"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogoutClick}
              className="h-10 px-3 rounded-xl flex items-center gap-3 text-zinc-400 hover:text-[#FF272A] hover:bg-[#FF272A]/10 transition-colors w-full cursor-pointer"
            >
              <LogOut className="w-5 h-5 stroke-[1.8]" />
              <span className="text-xs font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Desktop Floating Sidebar (Visible only on md and larger) */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden md:flex h-[calc(100vh-2rem)] my-4 ml-4 bg-[#161719] rounded-[28px] flex-col justify-between select-none shrink-0 shadow-2xl border border-white/[0.08] z-30 transition-[width,padding] duration-300 ease-in-out relative ${isExpanded ? "w-[250px] px-3.5 py-5" : "w-[74px] items-center px-2 py-5"
          }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col gap-6 w-full">
          {/* Top Logo / Brand Header */}
          <Link
            href="/dashboard"
            title="HS Productions Luxury Salon & Studio"
            className={`flex items-center w-full group ${isExpanded ? "px-2 gap-3" : "justify-center"
              }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center p-1 border border-white/10 shadow-sm relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/assets/icons/logo.png"
                alt="HS Productions Logo"
                fill
                sizes="48px"
                className="object-contain p-1"
                priority
              />
            </div>
            <div
              className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded
                  ? "opacity-100 max-w-[160px] pointer-events-auto"
                  : "opacity-0 max-w-0 pointer-events-none"
                }`}
            >
              <span className="font-bold text-sm tracking-tight text-white leading-tight whitespace-nowrap">
                <span className="text-[#FF272A]">H</span>S Productions
              </span>
              <span className="text-[10px] font-bold text-[#FF272A] uppercase tracking-wider whitespace-nowrap">
                STUDIO & SALON
              </span>
            </div>
          </Link>

          {/* Primary Navigation Items */}
          <nav className="flex flex-col gap-2 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  title={item.label}
                  className={`h-11 rounded-2xl flex items-center transition-all duration-200 cursor-pointer ${isExpanded
                      ? "px-3 w-full justify-start"
                      : "w-11 mx-auto justify-center"
                    } ${isActive
                      ? "bg-[#2b2d33] text-white shadow-inner font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-[#202126]"
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform ${isActive ? "text-[#FF272A] scale-110" : "group-hover:scale-110"
                      }`}
                  />
                  <div
                    className={`flex items-center overflow-hidden transition-all duration-300 text-left ${isExpanded
                        ? "opacity-100 max-w-[160px] ml-3.5"
                        : "opacity-0 max-w-0 ml-0 pointer-events-none"
                      }`}
                  >
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Logout */}
        <div className="flex flex-col gap-2 w-full pt-4 border-t border-white/[0.08]">
          {/* Profile Item */}
          <button
            type="button"
            onClick={() => handleSelectTab("profile")}
            title="Profile"
            className={`h-12 rounded-2xl flex items-center transition-all duration-200 cursor-pointer group ${isExpanded ? "px-2.5 w-full justify-start" : "w-11 mx-auto justify-center"
              } ${activeTab === "profile"
                ? "bg-[#2b2d33] text-white"
                : "hover:bg-[#202126] text-zinc-300"
              }`}
          >
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-zinc-700/60 group-hover:ring-[#FF272A] transition-all shadow-md bg-zinc-800 flex items-center justify-center">
                {profileAvatar ? (
                  <Image
                    src={profileAvatar}
                    alt={profileName || "Profile"}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <Image
                    src="/user-avatar.jpg"
                    alt="Profile avatar"
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#FF272A] border-2 border-[#161719] rounded-full" />
            </div>
            <div
              className={`flex flex-col overflow-hidden text-left transition-all duration-300 ${isExpanded
                  ? "opacity-100 max-w-[150px] ml-3"
                  : "opacity-0 max-w-0 ml-0 pointer-events-none"
                }`}
            >
              <span className="text-xs font-bold text-white group-hover:text-[#FF272A] transition-colors whitespace-nowrap truncate max-w-[130px]">
                {profileName || "Profile"}
              </span>
              <span className="text-[10px] text-zinc-400 whitespace-nowrap truncate max-w-[130px]">
                {profileRole || "Admin"}
              </span>
            </div>
          </button>

          {/* Logout Item */}
          <button
            type="button"
            onClick={handleLogoutClick}
            title="Logout"
            className={`h-10 rounded-xl flex items-center transition-colors cursor-pointer text-zinc-400 hover:text-[#FF272A] hover:bg-[#FF272A]/10 ${isExpanded ? "px-3 w-full justify-start" : "w-10 mx-auto justify-center"
              }`}
          >
            <LogOut className="w-5 h-5 shrink-0 stroke-[1.8]" />
            <div
              className={`flex items-center overflow-hidden transition-all duration-300 text-left ${isExpanded
                  ? "opacity-100 max-w-[150px] ml-3"
                  : "opacity-0 max-w-0 ml-0 pointer-events-none"
                }`}
            >
              <span className="text-xs font-medium whitespace-nowrap">
                Logout
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog (Yes / No) */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-100 flex flex-col items-center text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#FF272A] border border-red-100 flex items-center justify-center mb-4 shadow-xs">
              <LogOut className="w-7 h-7 stroke-[1.8]" />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 mb-1">
              Confirm Logout
            </h3>
            <p className="text-xs text-zinc-500 mb-6 max-w-[260px] leading-relaxed">
              Are you sure you want to log out? You will need to sign back in to access the dashboard.
            </p>

            {/* Actions: Yes or No */}
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                No, Stay
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#FF272A] hover:bg-red-600 active:scale-95 transition-all cursor-pointer shadow-md shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <span>Yes, Logout</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
