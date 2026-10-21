"use client";

import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Trash2,
  X,
  Loader2,
  Clock,
  Phone,
  RefreshCw,
  Eye,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { EmptyState } from "@/components/EmptyState";

interface Lead {
  id: string;
  name: string;
  phone: string;
  message: string;
  isRead: boolean;
  date: string;
}

export function ContactsScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Inquiry Form State
  const [newClient, setNewClient] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newService, setNewService] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const formatLead = (d: any): Lead => {
    const data = d.data();
    let dateStr = "";
    if (data.createdAt) {
      const dateObj = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      dateStr =
        dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        " • " +
        dateObj.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });
    }
    return {
      id: d.id,
      name: data.name || data.client || "Client",
      phone: data.phone || "",
      message: data.message || data.notes || "",
      isRead: data.isRead ?? false,
      date: dateStr || "Recent",
    };
  };

  useEffect(() => {
    const q = query(
      collection(db, "leads"),
      orderBy("createdAt", "desc"),
      limit(displayLimit + 1)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs;
        if (docs.length > displayLimit) {
          setHasMore(true);
          setLeads(docs.slice(0, displayLimit).map(formatLead));
        } else {
          setHasMore(false);
          setLeads(docs.map(formatLead));
        }
        setLoading(false);
        setIsLoadingMore(false);
      },
      (err) => {
        console.error("Firestore leads listen error:", err);
        setLoading(false);
        setIsLoadingMore(false);
      }
    );

    return () => unsub();
  }, [displayLimit]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const q = query(
        collection(db, "leads"),
        orderBy("createdAt", "desc"),
        limit(displayLimit + 1)
      );
      const snap = await getDocs(q);
      const docs = snap.docs;
      if (docs.length > displayLimit) {
        setHasMore(true);
        setLeads(docs.slice(0, displayLimit).map(formatLead));
      } else {
        setHasMore(false);
        setLeads(docs.map(formatLead));
      }
    } catch (err) {
      console.error("Failed to sync leads:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleToggleRead = async (lead: Lead) => {
    try {
      const newStatus = !lead.isRead;
      await updateDoc(doc(db, "leads", lead.id), {
        isRead: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error toggling lead read status:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "leads", leadToDelete.id));
    } catch (err) {
      console.error("Failed to delete lead:", err);
    } finally {
      setIsDeleting(false);
      setLeadToDelete(null);
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

      await addDoc(collection(db, "leads"), {
        name: newClient.trim(),
        phone: newPhone.trim(),
        message: newNotes.trim() || newService.trim() || "Inbound booking request.",
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setShowAddModal(false);
      setNewClient("");
      setNewPhone("");
      setNewEmail("");
      setNewService("");
      setNewNotes("");
    } catch (err) {
      console.error("Error creating lead:", err);
      alert("Failed to add inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5 pb-2">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Communications Desk
          </span>
        </div>

        {/* Main Title & Action Buttons Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            <span className="sm:hidden">Inquiries</span>
            <span className="hidden sm:inline">Client Inquiries</span>
          </h1>

          {/* Action Buttons Aligned with Main Text */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync latest inquiries from server"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60 group"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isSyncing ? "animate-spin text-[#FF272A]" : "group-hover:rotate-45"
                  }`}
              />
              <span className="hidden xs:inline">
                {isSyncing ? "Syncing..." : "Sync"}
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Manage inbound client bookings, direct studio communications, and contact channels.
        </p>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-12 flex flex-col items-center justify-center gap-2 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF272A]" />
          <span className="text-xs font-medium">Loading inquiries from Firebase...</span>
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          badge="No Inquiries"
          title="No Inbound Inquiries Yet"
          description="Inbound client messages, booking inquiries, and concierge requests submitted from your public site will appear here in real-time."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-zinc-100">
            <h3 className="font-bold text-base text-zinc-900">Recent Inbound Inquiries</h3>
          </div>

          <div className="divide-y divide-zinc-100">
            {leads.map((lead, index) => (
              <div
                key={lead.id}
                className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 hover:bg-zinc-50/70 transition-colors"
              >
                {/* Top / Left Column: Number, Name, Read Status, Message */}
                <div className="flex items-start gap-3 max-w-xl min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-zinc-100 text-zinc-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <h4 className="font-bold text-sm text-zinc-900 truncate">{lead.name}</h4>
                      {lead.isRead ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Marked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF272A]/10 text-[#FF272A] border border-[#FF272A]/20 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF272A] animate-pulse" />
                          <span>New</span>
                        </span>
                      )}
                    </div>
                    {lead.message && (
                      <div>
                        <p className="text-xs text-zinc-500 italic mt-0.5 line-clamp-3 leading-relaxed">
                          &quot;{lead.message}&quot;
                        </p>
                        {lead.message.length > 140 && (
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="text-[11px] font-semibold text-[#FF272A] hover:underline cursor-pointer mt-1 inline-flex items-center gap-1"
                          >
                            <span>Read full message</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom / Right Column: Meta Info & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 shrink-0 pt-2.5 lg:pt-0 border-t border-zinc-100 lg:border-t-0 justify-between lg:justify-end">
                  {/* Meta: Phone & Date */}
                  <div className="flex items-center justify-between sm:justify-start gap-2.5 text-xs text-zinc-500">
                    <p className="font-medium text-zinc-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{lead.phone || "No Phone"}</span>
                    </p>

                    <div className="text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{lead.date}</span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Mark as Read Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleRead(lead)}
                      className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${lead.isRead
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-700 hover:bg-emerald-100/80"
                        : "bg-white border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 shadow-2xs"
                        }`}
                      title={lead.isRead ? "Mark as unread" : "Mark as read"}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${lead.isRead ? "text-emerald-600" : "text-zinc-400"}`} />
                      <span>{lead.isRead ? "Marked" : "Mark Read"}</span>
                    </button>

                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedLead(lead)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer active:scale-95"
                      title="View full inquiry"
                    >
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      <span>View</span>
                    </button>

                    {/* WhatsApp Chat Button */}
                    {lead.phone && (
                      <a
                        href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </a>
                    )}

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setLeadToDelete(lead)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF272A] hover:bg-[#FF272A]/10 transition-colors cursor-pointer shrink-0"
                      title="Delete Inquiry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="p-4 border-t border-zinc-100 flex items-center justify-center bg-zinc-50/40">
              <button
                type="button"
                onClick={() => {
                  setIsLoadingMore(true);
                  setDisplayLimit((prev) => prev + 10);
                }}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200/90 text-zinc-700 font-semibold text-xs transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF272A]" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{isLoadingMore ? "Loading more..." : "Load More Inquiries"}</span>
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Confirmation Dialog before deleting lead */}
      <ConfirmDeleteModal
        isOpen={leadToDelete !== null}
        title="Delete Client Inquiry?"
        message={`Are you sure you want to delete the inquiry from "${leadToDelete?.name || "this client"}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setLeadToDelete(null)}
      />

      {/* Full Inquiry Details Dialog */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl border border-zinc-200 animate-scaleUp flex flex-col gap-4">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
                  <span className="text-[10px] font-bold text-[#FF272A] uppercase tracking-wider">
                    Inbound Client Message
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-zinc-900">{selectedLead.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Meta Chips */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 font-medium">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span>{selectedLead.phone || "No Phone"}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 text-zinc-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{selectedLead.date}</span>
              </div>
              <div
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${selectedLead.isRead
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-[#FF272A]/10 border-[#FF272A]/20 text-[#FF272A]"
                  }`}
              >
                {selectedLead.isRead ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Marked Read</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF272A] animate-pulse" />
                    <span>Unread</span>
                  </>
                )}
              </div>
            </div>

            {/* Full Message Box */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Full Message
              </span>
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs sm:text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {selectedLead.message || "No message content provided."}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-zinc-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mt-1">
              <button
                type="button"
                onClick={async () => {
                  await handleToggleRead(selectedLead);
                  setSelectedLead((prev) => (prev ? { ...prev, isRead: !prev.isRead } : null));
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${selectedLead.isRead
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                  : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200"
                  }`}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${selectedLead.isRead ? "text-emerald-600" : "text-zinc-500"}`} />
                <span>{selectedLead.isRead ? "Marked as Read" : "Mark as Read"}</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedLead.phone && (
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-5 py-2 rounded-full bg-zinc-900 hover:bg-black text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
