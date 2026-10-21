"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  User,
  CheckCircle2,
  Save,
  MessageCircle,
  AtSign,
  ExternalLink,
  Share2,
  MapPin,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  RefreshCw,
  Camera,
  ShieldCheck,
  Mail,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { uploadImageToCloudinary } from "@/lib/imageUpload";

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YoutubeIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export function ProfileScreen() {
  const { user } = useAuth();

  // Loading & Sync States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // 1. Personal Information State (Loaded from Firestore)
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [role, setRole] = useState<string>("Master Executive Administrator");
  const [bio, setBio] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileSaved, setProfileSaved] = useState<boolean>(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 2. Studio & Location Details State (Loaded from Firestore)
  const [studioAddress, setStudioAddress] = useState<string>("");
  const [studioEmail, setStudioEmail] = useState<string>("");
  const [studioPhone, setStudioPhone] = useState<string>("");
  const [studioWhatsapp, setStudioWhatsapp] = useState<string>("");
  const [openingHours, setOpeningHours] = useState<string>("");
  const [mapLink, setMapLink] = useState<string>("");
  const [isSavingStudio, setIsSavingStudio] = useState<boolean>(false);
  const [studioSaved, setStudioSaved] = useState<boolean>(false);

  // 3. Social Links State (Loaded from Firestore)
  const [instagram, setInstagram] = useState<string>("");
  const [facebook, setFacebook] = useState<string>("");
  const [youtube, setYoutube] = useState<string>("");
  const [threads, setThreads] = useState<string>("");
  const [linkedin, setLinkedin] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [isSavingSocials, setIsSavingSocials] = useState<boolean>(false);
  const [socialsSaved, setSocialsSaved] = useState<boolean>(false);

  // 4. Change Password State
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>("");
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // Real-time Firestore Listeners
  useEffect(() => {
    setIsLoading(true);

    const unsubProfile = onSnapshot(
      doc(db, "settings", "profile"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setRole(data.role || "Master Executive Administrator");
          setBio(data.bio || "");
          setAvatarUrl(data.avatarUrl || "");
        } else if (user) {
          if (user.displayName) setName(user.displayName);
          if (user.email) setEmail(user.email);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore profile listen error:", err);
        setIsLoading(false);
      }
    );

    const unsubStudio = onSnapshot(
      doc(db, "settings", "studio"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setStudioAddress(data.studioAddress || "");
          setStudioEmail(data.studioEmail || data.email || "");
          setStudioPhone(data.studioPhone || "");
          setStudioWhatsapp(data.studioWhatsapp || data.whatsapp || "");
          setOpeningHours(data.openingHours || "");
          setMapLink(data.mapLink || "");
        }
      },
      (err) => console.error("Firestore studio listen error:", err)
    );

    const unsubSocials = onSnapshot(
      doc(db, "settings", "socials"),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setInstagram(data.instagram || "");
          setFacebook(data.facebook || "");
          setYoutube(data.youtube || "");
          setThreads(data.threads || "");
          setLinkedin(data.linkedin || "");
          setWhatsapp(data.whatsapp || "");
        }
      },
      (err) => console.error("Firestore socials listen error:", err)
    );

    return () => {
      unsubProfile();
      unsubStudio();
      unsubSocials();
    };
  }, [user]);

  // Manual re-sync from server
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const [pSnap, stSnap, socSnap] = await Promise.all([
        getDoc(doc(db, "settings", "profile")),
        getDoc(doc(db, "settings", "studio")),
        getDoc(doc(db, "settings", "socials")),
      ]);

      if (pSnap.exists()) {
        const data = pSnap.data();
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setRole(data.role || "Master Executive Administrator");
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || "");
      }
      if (stSnap.exists()) {
        const data = stSnap.data();
        setStudioAddress(data.studioAddress || "");
        setStudioEmail(data.studioEmail || data.email || "");
        setStudioPhone(data.studioPhone || "");
        setStudioWhatsapp(data.studioWhatsapp || data.whatsapp || "");
        setOpeningHours(data.openingHours || "");
        setMapLink(data.mapLink || "");
      }
      if (socSnap.exists()) {
        const data = socSnap.data();
        setInstagram(data.instagram || "");
        setFacebook(data.facebook || "");
        setYoutube(data.youtube || "");
        setThreads(data.threads || "");
        setLinkedin(data.linkedin || "");
        setWhatsapp(data.whatsapp || "");
      }
    } catch (err) {
      console.error("Failed to sync settings from Firebase:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  // Avatar Image Upload
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const result = await uploadImageToCloudinary(file);
      setAvatarUrl(result.url);
      await setDoc(
        doc(db, "settings", "profile"),
        { avatarUrl: result.url, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      alert(err?.message || "Failed to upload avatar image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // 1. Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) return;

    setIsSavingProfile(true);
    try {
      await setDoc(
        doc(db, "settings", "profile"),
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role: role.trim(),
          bio: bio.trim(),
          avatarUrl,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      alert(err?.message || "Failed to save profile to Firebase");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Save Studio Details
  const handleSaveStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingStudio) return;

    setIsSavingStudio(true);
    try {
      await setDoc(
        doc(db, "settings", "studio"),
        {
          studioAddress: studioAddress.trim(),
          studioEmail: studioEmail.trim(),
          studioPhone: studioPhone.trim(),
          studioWhatsapp: studioWhatsapp.trim(),
          openingHours: openingHours.trim(),
          mapLink: mapLink.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setStudioSaved(true);
      setTimeout(() => setStudioSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to save studio details:", err);
      alert(err?.message || "Failed to save studio details to Firebase");
    } finally {
      setIsSavingStudio(false);
    }
  };

  // 3. Save Social Channels
  const handleSaveSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingSocials) return;

    setIsSavingSocials(true);
    try {
      await setDoc(
        doc(db, "settings", "socials"),
        {
          instagram: instagram.trim(),
          facebook: facebook.trim(),
          youtube: youtube.trim(),
          threads: threads.trim(),
          linkedin: linkedin.trim(),
          whatsapp: whatsapp.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSocialsSaved(true);
      setTimeout(() => setSocialsSaved(false), 3000);
    } catch (err: any) {
      console.error("Failed to save social channels:", err);
      alert(err?.message || "Failed to save social channels to Firebase");
    } finally {
      setIsSavingSocials(false);
    }
  };

  // 4. Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const currentUser = auth.currentUser || user;
      if (currentUser && currentUser.email) {
        if (currentPassword) {
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
        }
        await updatePassword(currentUser, newPassword);
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3500);
    } catch (err: any) {
      console.error("Change password error:", err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPasswordError("Incorrect current password. Please try again.");
      } else if (err.code === "auth/requires-recent-login") {
        setPasswordError("Please log in again before changing your password.");
      } else {
        setPasswordError(err.message || "Failed to update password. Try again.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn w-full pb-10">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex flex-col gap-1.5">
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF272A]" />
          <span className="text-xs font-bold text-[#FF272A] uppercase tracking-wider">
            Account Management & Credentials
          </span>
        </div>

        {/* Main Title & Action Buttons Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          <h1 className="text-2xl sm:text-3xl lg:text-[30px] font-semibold tracking-tight text-[#111215] leading-[1.15]">
            <span className="sm:hidden">Admin Profile</span>
            <span className="hidden sm:inline">Master Admin Profile</span>
          </h1>

          {/* Action Buttons Aligned with Main Text */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || isLoading}
              title="Sync latest profile and studio settings from Firebase"
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-full border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60 group"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-zinc-600 transition-transform ${isSyncing ? "animate-spin text-[#FF272A]" : "group-hover:rotate-45"
                  }`}
              />
              <span>{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Manage your executive administrator credentials, studio access permissions, and social channels.
        </p>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Admin Profile card + Personal Information + Studio Details */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Profile Summary Card */}
          <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative shrink-0">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-zinc-900/10 shadow-lg relative group cursor-pointer bg-zinc-100 flex items-center justify-center"
                title="Click to change profile avatar"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={name || "Admin"}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-black text-white font-black text-2xl uppercase">
                    {(name || user?.email || "HS").slice(0, 2)}
                  </div>
                )}

                {/* Hover Camera Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span>Change</span>
                    </>
                  )}
                </div>
              </div>

              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#FF272A] border-2 border-white rounded-full" />
            </div>

            <div className="flex flex-col text-center sm:text-left gap-1 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-zinc-900 truncate">
                    {name || user?.displayName || "Executive Administrator"}
                  </h2>
                  <span className="text-xs font-semibold text-[#FF272A] uppercase tracking-wider block truncate">
                    {role || "Founder & Master Administrator"}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 self-center sm:self-auto shrink-0 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> All Privileges Active
                </span>
              </div>

              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                {bio ||
                  "Direct access to salon analytics, employee payroll, service pricing tiers, client database, and brand marketing campaigns."}
              </p>
            </div>
          </div>

          {/* Form Settings: Personal Information */}
          <form
            onSubmit={handleSaveProfile}
            className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-5"
          >
            <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF272A]" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. RaNa ShOaiB"
                  required
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hsproductions.com"
                  required
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Direct Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Studio Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Master Executive Administrator"
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">Administrator Bio / Subtitle</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Direct access to salon analytics, employee payroll, service pricing tiers, client database..."
                className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A] resize-none"
              />
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              {profileSaved ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Profile updated in Firebase!
                </span>
              ) : (
                <span className="text-xs text-zinc-400">Synced in real-time</span>
              )}

              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#FF272A] animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-[#FF272A]" />
                )}
                <span>{isSavingProfile ? "Saving..." : "Save Profile"}</span>
              </button>
            </div>
          </form>

          {/* Form Settings: Studio Business Information */}
          <form
            onSubmit={handleSaveStudio}
            className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF272A]" />
                <span>Studio & Location Details</span>
              </h3>
              <span className="text-xs text-zinc-400 hidden sm:inline">Public Concierge & Location</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Studio Address */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">Studio Address</label>
                <input
                  type="text"
                  value={studioAddress}
                  onChange={(e) => setStudioAddress(e.target.value)}
                  placeholder="e.g. Bahawalpur, Punjab, Pakistan"
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              {/* 2. Studio Email Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Studio Email Address</span>
                  </span>
                  {studioEmail && (
                    <a
                      href={`mailto:${studioEmail}`}
                      className="text-[11px] text-[#FF272A] hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Mail</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </label>
                <input
                  type="email"
                  value={studioEmail}
                  onChange={(e) => setStudioEmail(e.target.value)}
                  placeholder="e.g. info@hsproductions.com"
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              {/* 3. Direct Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Direct Phone Number</label>
                <input
                  type="text"
                  value={studioPhone}
                  onChange={(e) => setStudioPhone(e.target.value)}
                  placeholder="e.g. 03041539548"
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              {/* 4. WhatsApp Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp Number</span>
                  </span>
                  {studioWhatsapp && (
                    <a
                      href={`https://wa.me/${studioWhatsapp.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 font-semibold hover:text-emerald-700 flex items-center gap-1"
                    >
                      <span>Chat</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  value={studioWhatsapp}
                  onChange={(e) => setStudioWhatsapp(e.target.value)}
                  placeholder="e.g. 03041539548"
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              {/* 5. Opening Hours */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-700">Opening Hours</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="e.g. Mon - Sun: 10:00 AM - 10:00 PM"
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>

              {/* 6. Google Maps Link */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                  <span>Google Map Pin Link</span>
                  {mapLink && (
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#FF272A] hover:underline flex items-center gap-1 font-bold"
                    >
                      <span>Visit</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  value={mapLink}
                  onChange={(e) => setMapLink(e.target.value)}
                  placeholder="https://maps.google.com/?q=Bahawalpur"
                  className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
              {studioSaved ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Studio details saved in Firebase!
                </span>
              ) : (
                <span className="text-xs text-zinc-400">Live on contact page & bookings</span>
              )}

              <button
                type="submit"
                disabled={isSavingStudio}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                {isSavingStudio ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#FF272A] animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-[#FF272A]" />
                )}
                <span>{isSavingStudio ? "Saving..." : "Save Studio Info"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Social Links + Change Password */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Social Links Form */}
          <form
            onSubmit={handleSaveSocials}
            className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-4"
          >
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#FF272A]" />
                <span>Social & Communication Channels</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Direct client links for social profiles.
              </p>
            </div>

            {/* Instagram */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                  <span>Instagram</span>
                </span>
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-zinc-400 hover:text-black flex items-center gap-1"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
              />
            </div>

            {/* Facebook */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FacebookIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Facebook</span>
                </span>
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-zinc-400 hover:text-black flex items-center gap-1"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
              />
            </div>

            {/* YouTube */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <YoutubeIcon className="w-3.5 h-3.5 text-red-600" />
                  <span>YouTube</span>
                </span>
                {youtube && (
                  <a
                    href={youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-zinc-400 hover:text-black flex items-center gap-1"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
              />
            </div>

            {/* Threads */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-zinc-800" />
                  <span>Threads</span>
                </span>
                {threads && (
                  <a
                    href={threads}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-zinc-400 hover:text-black flex items-center gap-1"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={threads}
                onChange={(e) => setThreads(e.target.value)}
                placeholder="https://threads.net/@yourhandle"
                className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
              />
            </div>

            {/* LinkedIn */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LinkedinIcon className="w-3.5 h-3.5 text-blue-700" />
                  <span>LinkedIn</span>
                </span>
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-zinc-400 hover:text-black flex items-center gap-1"
                  >
                    <span>Visit</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
                className="px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
              />
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              {socialsSaved ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Channels saved in Firebase!
                </span>
              ) : (
                <span className="text-xs text-zinc-400">All channels connected</span>
              )}

              <button
                type="submit"
                disabled={isSavingSocials}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                {isSavingSocials ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#FF272A] animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-[#FF272A]" />
                )}
                <span>{isSavingSocials ? "Saving..." : "Save Channels"}</span>
              </button>
            </div>
          </form>

          {/* Change Password Card */}
          <form
            onSubmit={handleChangePassword}
            className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-4"
          >
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="font-bold text-base text-zinc-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#FF272A]" />
                <span>Change Password</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Update your master administrator account password.
              </p>
            </div>

            {/* Error / Success Notifications */}
            {passwordError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>Password changed successfully!</span>
              </div>
            )}

            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-700">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF272A]/30 focus:border-[#FF272A]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                Min 6 characters
              </span>

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#161719] text-white hover:bg-black font-semibold text-xs transition-all shadow-md cursor-pointer hover:scale-[1.02] disabled:opacity-50"
              >
                {passwordLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#FF272A] animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5 text-[#FF272A]" />
                )}
                <span>{passwordLoading ? "Updating..." : "Update Password"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
