"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, X, Check, Upload, ImageIcon, Layers, Loader2, RefreshCw } from "lucide-react";
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
import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
} from "@/lib/imageUpload";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  image: string;
  cloudinaryPublicId?: string;
  description: string;
  createdAt?: number;
}

export function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<{
    name: string;
    price: string | number;
    duration: string;
    image: string;
    cloudinaryPublicId?: string;
    description: string;
  }>({
    name: "",
    price: "",
    duration: "60 min",
    image: "",
    cloudinaryPublicId: "",
    description: "",
  });

  // Real-time listener for "services" collection in Firestore
  useEffect(() => {
    setIsLoading(true);
    const servicesRef = collection(db, "services");

    const unsubscribe = onSnapshot(
      servicesRef,
      (snapshot) => {
        const items: Service[] = snapshot.docs.map((d) => {
          const data = d.data();
          const createdAt = data.createdAt?.toMillis
            ? data.createdAt.toMillis()
            : typeof data.createdAt === "number"
              ? data.createdAt
              : 0;

          return {
            id: d.id,
            name: data.name || "",
            price: Number(data.price) || 0,
            duration: data.duration || "60 min",
            image: data.image || "/salon-hero.jpg",
            cloudinaryPublicId: data.cloudinaryPublicId || "",
            description: data.description || "",
            createdAt,
          };
        });

        items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setServices(items);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore services fetch error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Manual re-sync from server to force refresh
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const snapshot = await getDocs(collection(db, "services"));
      const items: Service[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdAt = data.createdAt?.toMillis
          ? data.createdAt.toMillis()
          : typeof data.createdAt === "number"
            ? data.createdAt
            : 0;

        return {
          id: d.id,
          name: data.name || "",
          price: Number(data.price) || 0,
          duration: data.duration || "60 min",
          image: data.image || "/salon-hero.jpg",
          cloudinaryPublicId: data.cloudinaryPublicId || "",
          description: data.description || "",
          createdAt,
        };
      });

      items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setServices(items);
    } catch (err) {
      console.error("Failed to sync services:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      // Compresses to WebP <= 100 KB and uploads to Cloudinary
      const { url, publicId } = await uploadImageToCloudinary(file, "hs_services");
      setFormData((prev) => ({
        ...prev,
        image: url,
        cloudinaryPublicId: publicId,
      }));
    } catch (err: any) {
      console.error("Failed to upload service image:", err);
      alert(err?.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setFormData({
      name: "",
      price: "",
      duration: "60 min",
      image: "",
      cloudinaryPublicId: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      duration: service.duration,
      image: service.image,
      cloudinaryPublicId: service.cloudinaryPublicId || "",
      description: service.description,
    });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      // Delete document from Firestore
      await deleteDoc(doc(db, "services", serviceToDelete.id));

      // Delete Cloudinary asset if present
      if (serviceToDelete.cloudinaryPublicId) {
        await deleteImageFromCloudinary(serviceToDelete.cloudinaryPublicId);
      }
    } catch (err) {
      console.error("Failed to delete service:", err);
    } finally {
      setIsDeleting(false);
      setServiceToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      if (editingService) {
        const serviceRef = doc(db, "services", editingService.id);
        await updateDoc(serviceRef, {
          name: formData.name.trim(),
          price: Number(formData.price),
          duration: formData.duration.trim() || "60 min",
          image: formData.image || "/salon-hero.jpg",
          cloudinaryPublicId: formData.cloudinaryPublicId || "",
          description: formData.description.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "services"), {
          name: formData.name.trim(),
          price: Number(formData.price),
          duration: formData.duration.trim() || "60 min",
          image: formData.image || "/salon-hero.jpg",
          cloudinaryPublicId: formData.cloudinaryPublicId || "",
          description: formData.description.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save service:", err);
      alert(err?.message || "Failed to save service. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col gap-1.5">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Salon Catalog & Services
          </span>
        </div>
        {/* Main Title & Action Buttons Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            <span className="sm:hidden">Services</span>
            <span className="hidden sm:inline">Services & Treatments</span>
          </h1>

          {/* Action Buttons Aligned with Main Text */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync latest services from server"
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
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[#161719] text-white hover:bg-black transition-all shadow-md font-medium sm:font-semibold text-[11px] sm:text-xs cursor-pointer group hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FF272A] group-hover:rotate-90 transition-transform" />
              <span>
                <span className="sm:hidden">Add New</span>
                <span className="hidden sm:inline">Add New Service</span>
              </span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Manage studio and salon services, including service details, pricing, and appointment scheduling to ensure a smooth customer experience.
        </p>
      </div>

      {/* Services Grid or Loading Skeleton or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row gap-3.5 items-stretch animate-pulse"
            >
              <div className="w-full sm:w-24 h-28 sm:h-24 rounded-xl bg-zinc-200/70 shrink-0" />
              <div className="flex-1 flex flex-col justify-between py-1 gap-2">
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-zinc-200/80 rounded w-3/4" />
                  <div className="h-3 bg-zinc-100 rounded w-full" />
                </div>
                <div className="h-4 bg-zinc-200/60 rounded w-1/3 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Layers}
          badge="Catalog Empty"
          title="No Services Added Yet"
          description="Your studio service menu is currently empty. Add your first haircut, bespoke balayage, or aesthetic treatment."
          actionLabel="Add New Service"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white border border-zinc-200/90 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-3.5 items-stretch group hover:border-[#FF272A]/40"
            >
              {/* Left Side Image */}
              <div className="relative w-full sm:w-24 h-28 sm:h-auto rounded-xl overflow-hidden shrink-0 bg-zinc-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 96px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Right Side Content */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-base text-zinc-900 group-hover:text-[#FF272A] transition-colors leading-snug">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-zinc-900">Rs.{item.price}</span>
                    <span className="text-[11px] text-zinc-400 ml-1.5">/ {item.duration}</span>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit service"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceToDelete(item)}
                      title="Delete service"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF272A] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Update Service Modal Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-zinc-200 relative animate-scaleUp max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>

                <h2 className="text-xl font-extrabold text-zinc-900 mt-0.5">
                  {editingService ? "Update Service" : "Add New Service"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5">
              {/* Service Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800">
                  Service Name <span className="text-[#FF272A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signature Balayage & Gloss"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-800">
                    Price (Rs) <span className="text-[#FF272A]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 1500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-800">
                    Duration <span className="text-[#FF272A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 60 min"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                  />
                </div>
              </div>

              {/* Service Image (Upload from Laptop / Mobile Gallery) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800">
                  Service Image (Upload from Laptop or Mobile) <span className="text-[#FF272A]">*</span>
                </label>

                <div
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 flex items-center gap-3.5 transition-all cursor-pointer group ${formData.image
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-zinc-200 hover:border-[#FF272A] bg-zinc-50 hover:bg-red-50/20"
                    }`}
                >
                  {isUploadingImage ? (
                    <div className="w-14 h-14 rounded-xl bg-red-50 text-[#FF272A] flex items-center justify-center shrink-0">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : formData.image ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-white shadow-xs">
                      <Image
                        src={formData.image}
                        alt="Service preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-zinc-200/60 text-zinc-400 flex items-center justify-center shrink-0 group-hover:text-[#FF272A] transition-colors">
                      <Upload className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col text-left">
                    <span className="text-xs font-bold text-zinc-800 group-hover:text-[#FF272A] transition-colors flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-[#FF272A]" />
                      {isUploadingImage
                        ? "Compressing to WebP & Uploading..."
                        : formData.image
                          ? "Change Selected Image"
                          : "Browse Laptop / Mobile Gallery"}
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5">
                      Auto-compressed to WebP (≤100 KB) on Cloudinary
                    </span>
                    {formData.image && !isUploadingImage && (
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                        ✓ Cloudinary WebP ready
                      </span>
                    )}
                  </div>

                  {formData.image && !isUploadingImage && (
                    <button
                      type="button"
                      title="Remove image"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({ ...prev, image: "", cloudinaryPublicId: "" }));
                      }}
                      className="p-1.5 rounded-full hover:bg-zinc-200/80 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isUploadingImage}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail the treatment, techniques, and finish..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A] resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  disabled={isUploadingImage || isSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingImage || isSaving}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#FF272A] animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-[#FF272A]" />
                  )}
                  <span>
                    {isSaving
                      ? editingService
                        ? "Updating..."
                        : "Creating..."
                      : editingService
                        ? "Update Service"
                        : "Create Service"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before deleting service & Cloudinary asset */}
      <ConfirmDeleteModal
        isOpen={serviceToDelete !== null}
        title="Delete Service?"
        message={`Are you sure you want to delete "${serviceToDelete?.name || "this service"}"? Its image will also be removed from Cloudinary.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setServiceToDelete(null)}
      />
    </div>
  );
}
