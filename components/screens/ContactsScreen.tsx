"use client";

import React, { useState } from "react";
import { MessageCircle } from "lucide-react";

interface Inquiry {
  id: string;
  client: string;
  phone: string;
  email: string;
  serviceRequested: string;
  date: string;
  status: "New" | "Contacted" | "Confirmed";
  notes: string;
}

export function ContactsScreen() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: "1",
      client: "Sophia Montgomery",
      phone: "+1 (555) 389-4920",
      email: "sophia.m@luxurymail.com",
      serviceRequested: "Royal Bridal Package & VIP Suite",
      date: "Oct 24, 2026 - 11:00 AM",
      status: "New",
      notes: "Looking for full bridal entourage styling (5 bridesmaids).",
    },
    {
      id: "2",
      client: "Alexander Wright",
      phone: "+1 (555) 782-9011",
      email: "a.wright@corpcapital.com",
      serviceRequested: "Gentlemen's Executive Grooming & Color Melt",
      date: "Oct 22, 2026 - 4:30 PM",
      status: "Confirmed",
      notes: "Regular client with Master Barber Marcus.",
    },
    {
      id: "3",
      client: "Camila De Silva",
      phone: "+1 (555) 674-8822",
      email: "camila.desilva@fashionstudio.io",
      serviceRequested: "Custom Balayage & Gloss Therapy",
      date: "Oct 25, 2026 - 1:00 PM",
      status: "Contacted",
      notes: "Requested face-frame highlights trial before photoshoot.",
    },
    {
      id: "4",
      client: "Isabella Fontaine",
      phone: "+1 (555) 431-2990",
      email: "isabella.f@artcurator.org",
      serviceRequested: "Hydra-Radiance Facial & Collagen Spa",
      date: "Oct 26, 2026 - 10:00 AM",
      status: "New",
      notes: "Sensitive skin consultation requested.",
    },
  ]);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Communications Desk
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight mt-1">
          Contacts & Client Inquiries
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Manage inbound client bookings, direct studio communications, and contact channels.
        </p>
      </div>



      {/* Inquiries Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-zinc-900">Recent Inbound Inquiries</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Direct contact requests submitted via website and concierge phone.</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 self-start sm:self-auto">
            {inquiries.length} Active Tickets
          </span>
        </div>

        <div className="divide-y divide-zinc-100">
          {inquiries.map((inq, index) => (
            <div
              key={inq.id}
              className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors"
            >
              <div className="flex items-start gap-3.5 max-w-lg">
                <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-1">
                  <h4 className="font-bold text-sm text-zinc-900">{inq.client}</h4>
                  <p className="text-xs text-zinc-500 italic mt-0.5">&quot;{inq.notes}&quot;</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-zinc-500">
                <div>
                  <p className="font-medium text-zinc-700">{inq.phone}</p>
                  <p className="text-[11px] text-zinc-400">{inq.email}</p>
                </div>
                <div className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  {inq.date}
                </div>
                <a
                  href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
