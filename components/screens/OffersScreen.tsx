"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  RefreshCw,
  Loader2,
  Search,
  ChevronRight,
  Layers,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

interface Offer {
  id: string;
  title: string;
  serviceId?: string;
  serviceIds?: string[];
  serviceName?: string;
  serviceNames?: string[];
  originalPrice: number;
  discountType: "percentage" | "fixed";
  discountValue: number;
  status: "Active" | "Inactive";
  description: string;
  createdAt?: number;
}

interface ServiceOption {
  id: string;
  name: string;
  price: number;
}

export function OffersScreen() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [description, setDescription] = useState<string>("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  // Secondary Service Picker Dialog State
  const [isServicePickerOpen, setIsServicePickerOpen] = useState<boolean>(false);
  const [tempSelectedServiceIds, setTempSelectedServiceIds] = useState<string[]>([]);
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>("");

  // Deletion State
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // 1. Fetch real services from Firebase Firestore
  useEffect(() => {
    const servicesRef = collection(db, "services");
    const unsubscribe = onSnapshot(
      servicesRef,
      (snapshot) => {
        const fetched: ServiceOption[] = snapshot.docs.map((d) => ({
          id: d.id,
          name: d.data().name || "Service",
          price: Number(d.data().price) || 0,
        }));
        setAvailableServices(fetched);
      },
      (err) => console.error("Error fetching services for offers:", err)
    );

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Listener for "offers"
  useEffect(() => {
    setIsLoading(true);
    const offersRef = collection(db, "offers");

    const unsubscribe = onSnapshot(
      offersRef,
      (snapshot) => {
        const items: Offer[] = snapshot.docs.map((d) => {
          const data = d.data();
          const serviceIds: string[] = Array.isArray(data.serviceIds)
            ? data.serviceIds
            : data.serviceId
              ? [data.serviceId]
              : ["all"];

          const serviceNames: string[] = Array.isArray(data.serviceNames)
            ? data.serviceNames
            : data.serviceName
              ? [data.serviceName]
              : ["All Services"];

          return {
            id: d.id,
            title: data.title || "",
            serviceId: data.serviceId || serviceIds[0] || "all",
            serviceIds,
            serviceName: data.serviceName || serviceNames[0] || "All Services",
            serviceNames,
            originalPrice: Number(data.originalPrice) || 0,
            discountType: data.discountType === "fixed" ? "fixed" : "percentage",
            discountValue: Number(data.discountValue) || 0,
            status: data.status === "Inactive" ? "Inactive" : "Active",
            description: data.description || "",
            createdAt: data.createdAt?.toMillis
              ? data.createdAt.toMillis()
              : typeof data.createdAt === "number"
                ? data.createdAt
                : 0,
          };
        });

        items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setOffers(items);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore offers fetch error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Manual re-sync from server
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const [offersSnap, servicesSnap] = await Promise.all([
        getDocs(collection(db, "offers")),
        getDocs(collection(db, "services")),
      ]);

      const fetchedServices: ServiceOption[] = servicesSnap.docs.map((d) => ({
        id: d.id,
        name: d.data().name || "Service",
        price: Number(d.data().price) || 0,
      }));
      setAvailableServices(fetchedServices);

      const items: Offer[] = offersSnap.docs.map((d) => {
        const data = d.data();
        const serviceIds: string[] = Array.isArray(data.serviceIds)
          ? data.serviceIds
          : data.serviceId
            ? [data.serviceId]
            : ["all"];

        const serviceNames: string[] = Array.isArray(data.serviceNames)
          ? data.serviceNames
          : data.serviceName
            ? [data.serviceName]
            : ["All Services"];

        return {
          id: d.id,
          title: data.title || "",
          serviceId: data.serviceId || serviceIds[0] || "all",
          serviceIds,
          serviceName: data.serviceName || serviceNames[0] || "All Services",
          serviceNames,
          originalPrice: Number(data.originalPrice) || 0,
          discountType: data.discountType === "fixed" ? "fixed" : "percentage",
          discountValue: Number(data.discountValue) || 0,
          status: data.status === "Inactive" ? "Inactive" : "Active",
          description: data.description || "",
          createdAt: data.createdAt?.toMillis
            ? data.createdAt.toMillis()
            : typeof data.createdAt === "number"
              ? data.createdAt
              : 0,
        };
      });

      items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setOffers(items);
    } catch (err) {
      console.error("Failed to sync offers:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleOpenAddModal = (targetServiceId?: string) => {
    setEditingOfferId(null);
    setTitle("");
    setSelectedServiceIds(
      targetServiceId
        ? [targetServiceId]
        : availableServices.map((s) => s.id)
    );
    setDiscountType("percentage");
    setDiscountValue(20);
    setDescription("");
    setStatus("Active");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer: Offer) => {
    setEditingOfferId(offer.id);
    setTitle(offer.title);
    setSelectedServiceIds(
      offer.serviceIds && offer.serviceIds.length > 0
        ? offer.serviceIds.filter((id) => id !== "all")
        : offer.serviceId && offer.serviceId !== "all"
          ? [offer.serviceId]
          : availableServices.map((s) => s.id)
    );
    setDiscountType(offer.discountType);
    setDiscountValue(offer.discountValue);
    setDescription(offer.description);
    setStatus(offer.status === "Active" ? "Active" : "Inactive");
    setIsModalOpen(true);
  };

  // Service Picker Dialog Handlers
  const handleOpenServicePicker = () => {
    setTempSelectedServiceIds([...selectedServiceIds]);
    setServiceSearchQuery("");
    setIsServicePickerOpen(true);
  };

  const handleToggleTempService = (id: string) => {
    if (tempSelectedServiceIds.includes(id)) {
      setTempSelectedServiceIds(tempSelectedServiceIds.filter((item) => item !== id));
    } else {
      setTempSelectedServiceIds([...tempSelectedServiceIds, id]);
    }
  };

  const handleToggleAllInPicker = () => {
    const allIds = availableServices.map((s) => s.id);
    if (tempSelectedServiceIds.length === allIds.length && allIds.length > 0) {
      setTempSelectedServiceIds([]);
    } else {
      setTempSelectedServiceIds(allIds);
    }
  };

  const handleConfirmServiceSelection = () => {
    setSelectedServiceIds([...tempSelectedServiceIds]);
    setIsServicePickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;
    if (selectedServiceIds.length === 0) {
      alert("Please select at least one service for this offer.");
      return;
    }

    setIsSaving(true);
    try {
      const matchedServices = availableServices.filter((s) =>
        selectedServiceIds.includes(s.id)
      );

      const combinedOriginalPrice = matchedServices.reduce((sum, s) => sum + s.price, 0);
      const serviceNames = matchedServices.map((s) => s.name);

      const offerData = {
        title: title.trim(),
        serviceId: selectedServiceIds[0] || "",
        serviceIds: selectedServiceIds,
        serviceName:
          serviceNames.length === availableServices.length && availableServices.length > 0
            ? "All Services"
            : serviceNames.join(" + "),
        serviceNames,
        originalPrice: combinedOriginalPrice,
        discountType,
        discountValue: Number(discountValue),
        status,
        description: description.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editingOfferId) {
        await updateDoc(doc(db, "offers", editingOfferId), offerData);
      } else {
        await addDoc(collection(db, "offers"), {
          ...offerData,
          createdAt: serverTimestamp(),
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save offer:", err);
      alert(err?.message || "Failed to save offer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (offer: Offer) => {
    try {
      const newStatus = offer.status === "Active" ? "Inactive" : "Active";
      await updateDoc(doc(db, "offers", offer.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to toggle offer status:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!offerToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "offers", offerToDelete.id));
    } catch (err) {
      console.error("Failed to delete offer:", err);
    } finally {
      setIsDeleting(false);
      setOfferToDelete(null);
    }
  };

  const filteredPickerServices = availableServices.filter((s) =>
    s.name.toLowerCase().includes(serviceSearchQuery.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-12">
      {/* Screen Header */}
      <div className="flex flex-col gap-1.5 pb-2">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Marketing & Promotions
          </span>
        </div>

        {/* Main Title & Action Buttons Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            <span className="sm:hidden">Offers</span>
            <span className="hidden sm:inline">Service Offers & Discounts</span>
          </h1>

          {/* Action Buttons Aligned with Main Text */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync latest offers from server"
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

            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#161719] text-white hover:bg-black transition-all shadow-md font-medium sm:font-semibold text-[11px] sm:text-xs cursor-pointer group hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF272A] group-hover:rotate-90 transition-transform" />
              <span>
                <span className="sm:hidden">New Offer</span>
                <span className="hidden sm:inline">Create New Offer</span>
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Create promotional offers and apply discounts directly to one or multiple salon services.
        </p>
      </div>

      {/* Offers Cards Grid or Skeletons or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-zinc-200/90 p-6 flex flex-col sm:flex-row gap-5 animate-pulse min-h-[180px]"
            >
              <div className="w-full sm:w-36 h-32 rounded-2xl bg-zinc-200/70 shrink-0" />
              <div className="flex-1 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-zinc-200 rounded w-1/3" />
                  <div className="h-5 bg-zinc-200/80 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-full" />
                </div>
                <div className="h-10 bg-zinc-100 rounded-xl w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={Tag}
          badge="No Offers Yet"
          title="No promotional offers yet"
          actionLabel="Create New Offer"
          description="You haven’t created any offers yet. Create your first offer to attract customers and promote your salon services."
          onAction={() => handleOpenAddModal()}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {offers.map((off, index) => {
            const isStorewide = off.serviceIds?.includes("all") || off.serviceId === "all";
            const servicesList = isStorewide
              ? ["All Services (Storewide)"]
              : off.serviceNames && off.serviceNames.length > 0
                ? off.serviceNames
                : [off.serviceName || "Selected Services"];

            const matchedServices = availableServices.filter((s) =>
              off.serviceIds ? off.serviceIds.includes(s.id) : off.serviceId === s.id
            );
            const calculatedOriginalPrice =
              matchedServices.length > 0
                ? matchedServices.reduce((sum, s) => sum + s.price, 0)
                : off.originalPrice;
            const effectiveOriginalPrice =
              calculatedOriginalPrice > 0 ? calculatedOriginalPrice : off.originalPrice;

            const hasServicePrice = effectiveOriginalPrice > 0;
            const discountedPrice =
              off.discountType === "percentage"
                ? Math.round(effectiveOriginalPrice * (1 - off.discountValue / 100))
                : Math.max(0, effectiveOriginalPrice - off.discountValue);
            const totalSaved = effectiveOriginalPrice - discountedPrice;

            const discountText =
              off.discountType === "percentage"
                ? `${off.discountValue}%`
                : `Rs.${off.discountValue.toLocaleString()}`;

            const discountFontSize =
              discountText.length <= 4
                ? "text-3xl sm:text-4xl"
                : discountText.length <= 6
                  ? "text-2xl sm:text-3xl"
                  : discountText.length <= 8
                    ? "text-xl sm:text-2xl"
                    : "text-lg sm:text-xl";

            return (
              <div
                key={off.id}
                className="relative bg-white rounded-3xl border border-zinc-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row overflow-hidden group hover:border-[#FF272A]/40"
              >
                {/* Semicircle Ticket Cutouts on divider */}
                <div className="hidden sm:block absolute top-0 left-40 md:left-44 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-zinc-200/90 z-20 pointer-events-none" />
                <div className="hidden sm:block absolute bottom-0 left-40 md:left-44 -translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-white border border-zinc-200/90 z-20 pointer-events-none" />

                {/* LEFT SIDE: Big OFF Tag Stub */}
                <div className="relative bg-[#161719] text-white p-4 sm:p-5 flex flex-col items-center justify-between text-center shrink-0 w-full sm:w-40 md:w-44 border-b sm:border-b-0 sm:border-r border-dashed border-zinc-700/80">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Label */}
                  <div className="w-full flex items-center justify-between sm:justify-center relative z-10">
                    <span className="text-[10px] font-extrabold tracking-widest uppercase text-zinc-400 bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10">
                      Offer #{String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`sm:hidden px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${off.status === "Active"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/10 text-zinc-400 border border-white/10"
                        }`}
                    >
                      {off.status}
                    </span>
                  </div>

                  {/* Big OFF Value */}
                  <div className="my-auto py-3 sm:py-4 flex flex-col items-center justify-center relative z-10 w-full px-1">
                    <div
                      className={`${discountFontSize} font-black text-white tracking-tight leading-tight drop-shadow-xs max-w-full text-center break-all`}
                    >
                      {discountText}
                    </div>
                    <div className="text-xs sm:text-sm font-black text-[#FF272A] tracking-[0.2em] uppercase mt-1">
                      OFF
                    </div>
                    {hasServicePrice && (
                      <span className="mt-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 max-w-full truncate">
                        Save Rs.{totalSaved.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Bottom Instant Deal Tag */}
                  <div className="w-full relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Instant Offer
                    </span>
                  </div>
                </div>

                {/* RIGHT SIDE: Offer Details */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between gap-4 bg-white">
                  {/* Row 1: Service Name Tag & Status Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap max-w-full">
                      {isStorewide ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF272A] bg-[#FF272A]/10 px-3 py-1 rounded-full border border-[#FF272A]/15">
                          <Tag className="w-3 h-3 text-[#FF272A]" />
                          All Services (Storewide)
                        </span>
                      ) : (
                        <>
                          {servicesList.slice(0, 2).map((srvName, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#FF272A] bg-[#FF272A]/10 px-2.5 py-0.5 rounded-full border border-[#FF272A]/15 truncate max-w-[170px]"
                            >
                              <Tag className="w-2.5 h-2.5 text-[#FF272A] shrink-0" />
                              <span className="truncate">{srvName}</span>
                            </span>
                          ))}
                          {servicesList.length > 2 && (
                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                              +{servicesList.length - 2} more
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <span
                      className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${off.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${off.status === "Active" ? "bg-emerald-500" : "bg-zinc-400"
                          }`}
                      />
                      {off.status}
                    </span>
                  </div>

                  {/* Row 2: Title & Description */}
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 leading-snug group-hover:text-black transition-colors">
                      {off.title}
                    </h3>
                    {off.description ? (
                      <p className="text-xs text-zinc-500 leading-relaxed font-normal line-clamp-3">
                        {off.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Row 3: Pricing Summary */}
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Offer Discount
                      </span>
                      <span className="text-xs font-semibold text-zinc-700">
                        {off.discountType === "percentage"
                          ? `${off.discountValue}% Off Standard Price`
                          : `Flat Rs.${off.discountValue} Discount`}
                      </span>
                    </div>

                    {hasServicePrice && !isStorewide ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-zinc-400 line-through font-medium">
                          Rs.{effectiveOriginalPrice.toLocaleString()}
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-zinc-900 leading-none">
                          Rs.{discountedPrice.toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-zinc-700 bg-white px-2.5 py-1 rounded-lg border border-zinc-200">
                        {isStorewide ? "Storewide Special" : `${servicesList.length} Services Covered`}
                      </span>
                    )}
                  </div>

                  {/* Row 4: Action Controls */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(off)}
                      className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-colors ${off.status === "Active"
                        ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        }`}
                    >
                      {off.status === "Active" ? "Pause" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(off)}
                      className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Edit offer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferToDelete(off)}
                      className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-[#FF272A]/10 hover:text-[#FF272A] text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete offer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Primary Create / Edit Offer Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => !isSaving && setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-zinc-100 flex flex-col gap-4 animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-zinc-900">
                  {editingOfferId ? "Edit Promotion Offer" : "Make an Offer on Service"}
                </h3>
                <p className="text-xs text-zinc-500">
                  Configure discount parameters and assign to any service
                </p>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Offer Title */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Offer Campaign Title <span className="text-[#FF272A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Bridal Season Special"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black"
                />
              </div>

              {/* Clickable Applicable Services Field (Opens Service Picker Dialog) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-800">
                    Applicable Services <span className="text-[#FF272A]">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-zinc-400">
                    {selectedServiceIds.includes("all")
                      ? "All Services Selected"
                      : `${selectedServiceIds.length} Service${selectedServiceIds.length > 1 ? "s" : ""} Selected`}
                  </span>
                </div>

                <div
                  onClick={handleOpenServicePicker}
                  className="p-3 rounded-2xl bg-zinc-50 hover:bg-zinc-100/70 border border-zinc-200 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {selectedServiceIds.length === 0 ? (
                      <span className="text-xs text-zinc-400 font-medium">Click to select services...</span>
                    ) : (
                      <>
                        {availableServices
                          .filter((s) => selectedServiceIds.includes(s.id))
                          .slice(0, 3)
                          .map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-800 bg-white px-2.5 py-0.5 rounded-full border border-zinc-200 shadow-2xs"
                            >
                              <Tag className="w-2.5 h-2.5 text-[#FF272A]" />
                              {s.name}
                            </span>
                          ))}
                        {selectedServiceIds.length > 3 && (
                          <span className="text-xs font-bold text-zinc-500 bg-zinc-200/60 px-2 py-0.5 rounded-full">
                            +{selectedServiceIds.length - 3} more
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-zinc-500 group-hover:text-black shrink-0">
                    <span>Select</span>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Discount Type
                  </label>
                  <div className="flex rounded-xl bg-zinc-100 p-1">
                    <button
                      type="button"
                      onClick={() => setDiscountType("percentage")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${discountType === "percentage"
                        ? "bg-black text-white shadow-xs"
                        : "text-zinc-600 hover:text-black"
                        }`}
                    >
                      % Percent
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType("fixed")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${discountType === "fixed"
                        ? "bg-black text-white shadow-xs"
                        : "text-zinc-600 hover:text-black"
                        }`}
                    >
                      Rs. Fixed Off
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-700 block mb-1">
                    Discount Value {discountType === "percentage" ? "(%)" : "(Rs.)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === "percentage" ? 95 : 100000}
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black"
                  />
                </div>
              </div>

              {/* Price Impact Preview (Combined Price & Discount) */}
              {selectedServiceIds.length > 0 && availableServices.length > 0 && (() => {
                const matched = availableServices.filter((s) => selectedServiceIds.includes(s.id));
                const totalOriginal = matched.reduce((sum, s) => sum + s.price, 0);
                const discountAmount =
                  discountType === "percentage"
                    ? Math.round(totalOriginal * (discountValue / 100))
                    : Math.min(totalOriginal, discountValue);
                const finalTotal = Math.max(0, totalOriginal - discountAmount);

                return (
                  <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/90 flex flex-col gap-2.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-zinc-700">
                      <span>Discount Breakdown:</span>
                      <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                        {discountType === "percentage" ? `${discountValue}% OFF` : `Rs.${discountValue} Flat Discount`}
                      </span>
                    </div>

                    {/* Individual Selected Services */}
                    <div className="flex flex-col gap-1.5 text-[11px] text-zinc-500 pt-1.5 border-t border-zinc-200/60 max-h-28 overflow-y-auto">
                      {matched.map((s) => {
                        const itemDiscount =
                          discountType === "percentage"
                            ? Math.round(s.price * (discountValue / 100))
                            : Math.round(discountValue / (matched.length || 1));
                        const itemFinal = Math.max(0, s.price - itemDiscount);

                        return (
                          <div key={s.id} className="flex items-center justify-between py-0.5">
                            <span className="truncate text-zinc-700 font-medium">{s.name}</span>
                            <span className="shrink-0 font-semibold text-zinc-800">
                              <span className="line-through text-zinc-400 font-normal mr-2">
                                Rs.{s.price.toLocaleString()}
                              </span>
                              Rs.{itemFinal.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Combined Package Total */}
                    <div className="pt-2.5 border-t border-zinc-200/80 flex items-center justify-between bg-white -mx-1 px-3 py-2.5 rounded-xl border border-zinc-200 shadow-2xs">
                      <div className="flex flex-col">
                        <span className="font-black text-xs text-zinc-900">
                          {matched.length > 1
                            ? `Combined Total (${matched.length} Services)`
                            : "Combined Package Total"}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          Save Rs.{discountAmount.toLocaleString()} with this bundle!
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 text-right">
                        <span className="text-xs text-zinc-400 line-through font-medium">
                          Rs.{totalOriginal.toLocaleString()}
                        </span>
                        <span className="text-base sm:text-lg font-black text-zinc-900 leading-none">
                          Rs.{finalTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Description / Terms */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Terms & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Offer conditions (e.g. Applicable on advance booking)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black resize-none"
                />
              </div>


              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-semibold text-xs cursor-pointer hover:bg-zinc-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#FF272A] animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-[#FF272A]" />
                  )}
                  <span>
                    {isSaving
                      ? editingOfferId
                        ? "Updating..."
                        : "Publishing..."
                      : editingOfferId
                        ? "Update Offer"
                        : "Publish Offer"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secondary Service Selection Dialog (Search, Select All, Confirm) */}
      {isServicePickerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setIsServicePickerOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-zinc-100 flex flex-col gap-4 animate-scaleUp max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-zinc-900">Select Applicable Services</h3>
                <p className="text-xs text-zinc-500">Choose one, multiple, or all services for this offer</p>
              </div>
              <button
                type="button"
                onClick={() => setIsServicePickerOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar + Select All Header */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black"
                />
              </div>
              <button
                type="button"
                onClick={handleToggleAllInPicker}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                {availableServices.length > 0 &&
                  tempSelectedServiceIds.length === availableServices.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {/* Services List (Scrollable) */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[46vh] pr-1">
              {/* Real Services from Firebase */}
              {filteredPickerServices.map((srv) => {
                const isSelected = tempSelectedServiceIds.includes(srv.id);
                return (
                  <div
                    key={srv.id}
                    onClick={() => handleToggleTempService(srv.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${isSelected
                      ? "bg-red-50/30 border-[#FF272A] shadow-xs"
                      : "bg-white border-zinc-200 hover:border-zinc-300"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 transition-colors ${isSelected
                          ? "bg-[#FF272A] border-[#FF272A] text-white"
                          : "border-zinc-300 bg-white"
                          }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 truncate">
                        {srv.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-zinc-900 shrink-0">
                      Rs.{srv.price}
                    </span>
                  </div>
                );
              })}

              {filteredPickerServices.length === 0 && (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No services matching &ldquo;{serviceSearchQuery}&rdquo;
                </div>
              )}
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <span className="text-xs text-zinc-500 font-semibold">
                {tempSelectedServiceIds.length === availableServices.length && availableServices.length > 0
                  ? "All Services Selected"
                  : `${tempSelectedServiceIds.length} Selected`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsServicePickerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 font-semibold text-xs cursor-pointer hover:bg-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmServiceSelection}
                  className="px-5 py-2 rounded-xl bg-black text-white font-semibold text-xs cursor-pointer hover:bg-zinc-800"
                >
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before deleting offer */}
      <ConfirmDeleteModal
        isOpen={offerToDelete !== null}
        title="Delete Promotion Offer?"
        message={`Are you sure you want to delete "${offerToDelete?.title || "this offer"}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setOfferToDelete(null)}
      />
    </div>
  );
}
