"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Tag,
  ArrowUpRight,
  MapPin,
  Loader2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

interface InquiryItem {
  id: string;
  client: string;
  service: string;
  time: string;
  status: "New" | "Confirmed" | "Contacted" | string;
  phone?: string;
}

interface RightResourcesProps {
  onTabChange?: (tab: string) => void;
}

const DEFAULT_INQUIRIES: InquiryItem[] = [
  {
    id: "inq_1",
    client: "Sophia Montgomery",
    service: "Royal Bridal Package",
    time: "Oct 24 • 11:00 AM",
    status: "New",
    phone: "03041539548",
  },
  {
    id: "inq_2",
    client: "Alexander Wright",
    service: "Gentlemen's Grooming",
    time: "Oct 22 • 4:30 PM",
    status: "Confirmed",
    phone: "03001234567",
  },
  {
    id: "inq_3",
    client: "Camila De Silva",
    service: "Balayage & Gloss",
    time: "Oct 25 • 1:00 PM",
    status: "Contacted",
    phone: "03029876543",
  },
  {
    id: "inq_4",
    client: "Isabella Fontaine",
    service: "Hydra-Radiance Facial",
    time: "Oct 26 • 10:00 AM",
    status: "New",
    phone: "03015554321",
  },
];

function getBadgeStyle(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (s === "contacted") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  return "bg-[#FF272A]/10 text-[#FF272A] border-[#FF272A]/20";
}

export function RightResources({ onTabChange }: RightResourcesProps) {
  // 1. Reviews State
  const [reviewCount, setReviewCount] = useState<number>(18);
  const [avgRating, setAvgRating] = useState<string>("5.0");

  // 2. Active Deals State
  const [activeDealsCount, setActiveDealsCount] = useState<number>(4);

  // 3. Inquiries State
  const [inquiries, setInquiries] = useState<InquiryItem[]>(DEFAULT_INQUIRIES);
  const [inquiriesLoading, setInquiriesLoading] = useState<boolean>(true);

  // 4. Studio Concierge Info
  const [studioCity, setStudioCity] = useState<string>("Bahawalpur");
  const [studioContact, setStudioContact] = useState<string>("+92 300 1234567");

  useEffect(() => {
    // 1. Listen to Reviews collection
    const unsubReviews = onSnapshot(
      collection(db, "reviews"),
      (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map((d) => d.data());
          const total = docs.length;
          const sum = docs.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0);
          const avg = total > 0 ? (sum / total).toFixed(1) : "5.0";
          setReviewCount(total);
          setAvgRating(avg);
        }
      },
      (err) => console.error("Firestore reviews error:", err)
    );

    // 2. Listen to Offers collection
    const unsubOffers = onSnapshot(
      collection(db, "offers"),
      (snap) => {
        if (!snap.empty) {
          const active = snap.docs.filter((d) => {
            const data = d.data();
            return data.status === "Active" || !data.status;
          }).length;
          setActiveDealsCount(active);
        }
      },
      (err) => console.error("Firestore offers error:", err)
    );

    // 3. Listen to Inquiries collection
    const inqQuery = query(collection(db, "inquiries"), orderBy("createdAt", "desc"), limit(4));
    const unsubInquiries = onSnapshot(
      inqQuery,
      async (snap) => {
        if (!snap.empty) {
          const loaded: InquiryItem[] = snap.docs.map((d) => {
            const data = d.data();
            let timeStr = data.time || "";
            if (!timeStr && data.createdAt) {
              const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
              timeStr = dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }) + " • " + dateObj.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });
            }
            return {
              id: d.id,
              client: data.client || data.name || "Client",
              service: data.service || data.serviceRequested || "Consultation",
              time: timeStr || "Recent",
              status: data.status || "New",
              phone: data.phone || "",
            };
          });
          setInquiries(loaded);
          setInquiriesLoading(false);
        } else {
          // If Firestore inquiries collection is empty, auto-seed with defaults
          try {
            const checkSnap = await getDocs(collection(db, "inquiries"));
            if (checkSnap.empty) {
              for (const item of DEFAULT_INQUIRIES) {
                await setDoc(doc(db, "inquiries", item.id), {
                  client: item.client,
                  service: item.service,
                  time: item.time,
                  status: item.status,
                  phone: item.phone,
                  createdAt: serverTimestamp(),
                });
              }
            }
          } catch (e) {
            console.error("Error seeding initial inquiries:", e);
          }
          setInquiriesLoading(false);
        }
      },
      (err) => {
        console.error("Firestore inquiries listen error:", err);
        setInquiriesLoading(false);
      }
    );

    // 4. Listen to Studio details
    const unsubStudio = onSnapshot(
      doc(db, "settings", "studio"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const addr = data.studioAddress || "";
          const firstAddrPart = addr.split(",")[0]?.trim() || addr.trim() || "Bahawalpur";
          setStudioCity(firstAddrPart || "Bahawalpur");
          setStudioContact(data.studioPhone || data.studioWhatsapp || "+92 300 1234567");
        }
      },
      (err) => console.error("Firestore studio listen error:", err)
    );

    return () => {
      unsubReviews();
      unsubOffers();
      unsubInquiries();
      unsubStudio();
    };
  }, []);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Top 2 Salon Action Blocks */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Reviews Screen Shortcut */}
        <button
          type="button"
          onClick={() => onTabChange?.("reviews")}
          className="bg-[#f3f5f3] hover:bg-[#eaecea] rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer group shadow-2xs active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-2xs group-hover:scale-105 transition-transform">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#111215] block">
              {avgRating} Rating
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              {reviewCount} Reviews
            </span>
          </div>
        </button>

        {/* Offers Screen Shortcut */}
        <button
          type="button"
          onClick={() => onTabChange?.("offers")}
          className="bg-[#f3f5f3] hover:bg-[#eaecea] rounded-[24px] p-4 flex flex-col items-center justify-center gap-2 transition-all text-center cursor-pointer group shadow-2xs active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#FF272A] shadow-2xs group-hover:scale-105 transition-transform">
            <Tag className="w-4 h-4 text-[#FF272A]" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#111215] block">
              {activeDealsCount} Active Deals
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">
              Promotions
            </span>
          </div>
        </button>
      </div>

      {/* Recent Client Inquiries Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A] animate-pulse" />
          <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
            Inbound Inquiries
          </h4>
        </div>
        <button
          type="button"
          onClick={() => onTabChange?.("contacts")}
          className="text-xs font-bold text-zinc-500 hover:text-black flex items-center gap-0.5 cursor-pointer transition-colors"
        >
          <span>View All</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {/* Inquiry Cards List */}
      <div className="flex flex-col gap-2.5">
        {inquiriesLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF272A]" />
            <span className="text-[11px] font-medium">Loading inquiries...</span>
          </div>
        ) : (
          inquiries.map((item) => (
            <div
              key={item.id}
              onClick={() => onTabChange?.("contacts")}
              className="bg-[#f3f5f3] hover:bg-[#eaecea] rounded-[20px] p-3.5 flex flex-col justify-between transition-all group shadow-2xs cursor-pointer border border-transparent hover:border-zinc-300/60 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-xs text-zinc-900 truncate">
                  {item.client}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${getBadgeStyle(
                    item.status
                  )}`}
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
          ))
        )}
      </div>

      {/* Studio Location & Concierge Quick Footer */}
      <div
        onClick={() => onTabChange?.("profile")}
        className="p-3.5 rounded-[20px] bg-[#161719] text-white flex items-center justify-between cursor-pointer hover:bg-black transition-colors shadow-sm group active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 group-hover:bg-zinc-700 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-[#FF272A]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-white leading-tight truncate">
              HS Productions Concierge
            </span>
            <span className="text-[10px] text-zinc-400 font-medium truncate">
              {studioCity} • {studioContact}
            </span>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
      </div>
    </div>
  );
}
