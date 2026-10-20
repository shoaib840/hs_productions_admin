"use client";

import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Plus,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

interface Inquiry {
  id: string;
  client: string;
  phone: string;
  email: string;
  serviceRequested: string;
  date: string;
  status: "New" | "Contacted" | "Confirmed" | string;
  notes: string;
}

export function ContactsScreen() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Inquiry Form State
  const [newClient, setNewClient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newService, setNewService] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Inquiry[] = snap.docs.map((d) => {
          const data = d.data();
          let dateStr = data.time || data.date || "";
          if (!dateStr && data.createdAt) {
            const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            dateStr = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }) + " - " + dateObj.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            });
          }
          return {
            id: d.id,
            client: data.client || data.name || "Client",
            phone: data.phone || "",
            email: data.email || "",
            serviceRequested: data.serviceRequested || data.service || "Salon Service",
            date: dateStr || "Recent",
            status: data.status || "New",
            notes: data.notes || "Inbound booking request.",
          };
        });
        setInquiries(items);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore contacts listen error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "inquiries", id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error updating inquiry status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;
    try {
      await deleteDoc(doc(db, "inquiries", id));
    } catch (err) {
      console.error("Error deleting inquiry:", err);
    }
  };

  const handleAddInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }) + " • " + now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      await addDoc(collection(db, "inquiries"), {
        client: newClient.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
        serviceRequested: newService.trim() || "Consultation",
        service: newService.trim() || "Consultation",
        time: dateFormatted,
        date: dateFormatted,
        status: "New",
        notes: newNotes.trim() || "Direct inquiry received.",
        createdAt: serverTimestamp(),
      });

      setShowAddModal(false);
      setNewClient("");
      setNewPhone("");
      setNewEmail("");
      setNewService("");
      setNewNotes("");
    } catch (err) {
      console.error("Error creating inquiry:", err);
      alert("Failed to add inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FF272A] hover:bg-[#e02023] text-white font-bold text-xs shadow-md transition-all cursor-pointer self-start sm:self-auto hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Inquiry</span>
        </button>
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-zinc-900">Recent Inbound Inquiries</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Live inquiries synchronized with dashboard and mobile concierge.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 self-start sm:self-auto">
            {inquiries.length} Active Tickets
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#FF272A]" />
            <span className="text-xs font-medium">Loading inquiries from Firebase...</span>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 text-xs">
            No inquiries recorded yet. Click &quot;New Inquiry&quot; to create one.
          </div>
        ) : (
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
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-zinc-900">{inq.client}</h4>
                      <span className="text-xs font-medium text-zinc-400">•</span>
                      <span className="text-xs font-semibold text-zinc-700">
                        {inq.serviceRequested}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 italic mt-0.5">&quot;{inq.notes}&quot;</p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 text-xs text-zinc-500">
                  <div className="min-w-[120px]">
                    <p className="font-medium text-zinc-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-zinc-400" />
                      <span>{inq.phone || "No Phone"}</span>
                    </p>
                    {inq.email && (
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-zinc-400" />
                        <span>{inq.email}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-3 py-1.5 rounded-xl self-start sm:self-auto shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{inq.date}</span>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={inq.status}
                    onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                    className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-xl border cursor-pointer outline-none transition-all ${
                      inq.status === "Confirmed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : inq.status === "Contacted"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-[#FF272A]/10 text-[#FF272A] border-[#FF272A]/20"
                    }`}
                  >
                    <option value="New">NEW</option>
                    <option value="Contacted">CONTACTED</option>
                    <option value="Confirmed">CONFIRMED</option>
                  </select>

                  {/* WhatsApp Chat Button */}
                  {inq.phone && (
                    <a
                      href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </a>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(inq.id)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF272A] hover:bg-[#FF272A]/10 transition-colors cursor-pointer"
                    title="Delete Inquiry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Inquiry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-zinc-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="font-bold text-base text-zinc-900">Add Inbound Inquiry</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddInquiry} className="flex flex-col gap-3.5 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-700">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ayesha Khan"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-700">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="03001234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-700">Email</label>
                  <input
                    type="email"
                    placeholder="client@mail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-700">Service Requested</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Bridal Package"
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-700">Client Notes / Request</label>
                <textarea
                  rows={2}
                  placeholder="Looking for bridal entourage styling..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full border border-zinc-200 text-zinc-600 font-semibold text-xs hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#161719] hover:bg-black text-white font-semibold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Inquiry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
