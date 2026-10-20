"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load remembered email on mount
  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem("hs_admin_remember_me") === "true";
      const savedEmail = localStorage.getItem("hs_admin_email");
      if (savedRemember && savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Redirect if user is already signed in
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(trimmedEmail, password, rememberMe);

      try {
        if (rememberMe) {
          localStorage.setItem("hs_admin_remember_me", "true");
          localStorage.setItem("hs_admin_email", trimmedEmail);
        } else {
          localStorage.removeItem("hs_admin_remember_me");
          localStorage.removeItem("hs_admin_email");
        }
      } catch {
        // Ignore localStorage write errors
      }

      setSuccessMessage("Authentication successful! Entering dashboard...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 600);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const code = firebaseError?.code || "";

      switch (code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setErrorMessage("Invalid email or password. Please verify your credentials.");
          break;
        case "auth/invalid-email":
          setErrorMessage("Please enter a valid email address.");
          break;
        case "auth/user-disabled":
          setErrorMessage("This administrator account has been disabled. Contact support.");
          break;
        case "auth/too-many-requests":
          setErrorMessage("Access temporarily blocked due to repeated failed attempts. Try again later.");
          break;
        case "auth/network-request-failed":
          setErrorMessage("Network error. Please check your internet connection.");
          break;
        default:
          setErrorMessage(firebaseError?.message || "Authentication failed. Please try again.");
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address in the field above, then click 'Forgot Password?'.");
      return;
    }

    setErrorMessage("");
    setIsResetting(true);
    try {
      await resetPassword(trimmedEmail);
      setSuccessMessage(`Password reset link sent to ${trimmedEmail}! Check your inbox or spam.`);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      const code = firebaseError?.code || "";

      if (code === "auth/user-not-found") {
        setErrorMessage("No administrator account found with this email address.");
      } else if (code === "auth/invalid-email") {
        setErrorMessage("Please enter a valid email address.");
      } else {
        setErrorMessage(firebaseError?.message || "Failed to send reset link. Please try again.");
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col justify-start lg:justify-center items-center pt-7 sm:pt-10 lg:pt-0 px-4 py-6 sm:p-6 lg:p-8">
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 my-0 lg:my-auto">
        {/* Left Column: Sign In Form */}
        <div className="w-full max-w-[400px] flex flex-col justify-center shrink-0">
          {/* Logo & Portal Header */}
          <div className="flex items-center gap-3.5 mb-10 sm:mb-11">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-xs relative border border-zinc-200 bg-black shrink-0">
              <Image
                src="/assets/icons/logo.png"
                alt="HS Productions"
                fill
                sizes="44px"
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight text-[#111215] leading-tight">
                HS Productions
              </h2>
              <span className="text-[11px] font-bold text-[#FF272A] tracking-wider uppercase block mt-0.5">
                ADMIN PORTAL
              </span>
            </div>
          </div>

          {/* Form Title & Subtitle */}
          <div className="mb-7">
            <h1 className="text-3xl sm:text-[34px] font-bold text-[#111215] tracking-tight leading-tight">
              Sign in
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              Welcome back. Enter your administrative credentials to continue.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email-address"
                className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2"
              >
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email-address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF272A]/20 focus:border-[#FF272A] transition shadow-2xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password-field"
                className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2"
              >
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-field"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3.5 rounded-2xl bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#FF272A]/20 focus:border-[#FF272A] transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-zinc-600 font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black accent-[#111215]"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResetting || isLoading}
                className="text-zinc-500 hover:text-black font-medium transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {isResetting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-zinc-400 border-t-zinc-800 rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>Forgot Password?</span>
                )}
              </button>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={isLoading || Boolean(successMessage)}
              className="w-full mt-1.5 py-3.5 px-6 rounded-2xl bg-[#0e1015] hover:bg-black active:scale-[0.99] text-white font-medium text-sm transition shadow-sm cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span>Sign in</span>
              )}
            </button>
          </form>

          {/* Mobile Bottom Security Card & Support Info */}
          <div className="lg:hidden mt-8 pt-6 border-t border-zinc-100 flex flex-col gap-4">
            <div className="bg-[#f8f9fa] border border-zinc-200/70 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white shadow-2xs flex items-center justify-center text-zinc-700">
                  <ShieldCheck className="w-4 h-4 text-[#FF272A]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-800 block">Enterprise Security</span>
                  <span className="text-[10px] text-zinc-500">Firebase SSL protected admin portal</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF272A]/10 text-[#FF272A] text-[10px] font-bold">
                Online
              </span>
            </div>

            <div className="text-center text-[11px] text-zinc-400 pt-2 pb-1">
              © 2026 HS Productions • Luxury Salon & Studio
            </div>
          </div>
        </div>

        {/* Right Column: Floating Dark Visual Card */}
        <div className="hidden lg:block w-full max-w-[480px] shrink-0">
          <div className="bg-[#0b0c0e] text-white rounded-[36px] sm:rounded-[40px] p-7 sm:p-9 relative overflow-hidden shadow-2xl flex flex-col justify-between border border-white/5">
            {/* Ambient Star / Glow Particles */}
            <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-white/40 rounded-full blur-[0.5px]" />
            <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-[#FF272A]/60 rounded-full blur-[1px]" />
            <div className="absolute top-10 right-14 w-1 h-1 bg-white/30 rounded-full" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF272A]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Center Floating Mascot / Logo Graphic */}
            <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-6">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 bg-radial from-[#FF272A]/25 via-transparent to-transparent rounded-full blur-2xl pointer-events-none" />

                <div className="relative w-28 h-28 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                  <Image
                    src="/assets/icons/logo.png"
                    alt="HS Productions Logo"
                    fill
                    sizes="112px"
                    className="object-contain p-2"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Middle Welcome & Intro Content */}
            <div className="relative z-10 flex flex-col gap-2.5 mt-2">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                HS Productions
              </span>
              <h2 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight leading-tight">
                Welcome to HS Productions
              </h2>
              <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed max-w-[380px]">
                Centralized management hub for monitoring operations, managing services, offers, portfolio gallery, and bookings with total security.
              </p>
            </div>

            {/* Bottom Dark Card Feature Box */}
            <div className="relative z-10 mt-8 pt-2">
              <div className="bg-[#14161b]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 backdrop-blur-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-white">
                      Enterprise Admin & Operations Control
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-normal">
                      Empowering salon administrators with full website visibility, services control, and seamless client management.
                    </p>
                  </div>
                </div>

                {/* Mini Avatars Indicator */}
                <div className="flex items-center justify-end pt-1">
                  <div className="flex items-center -space-x-1.5">
                    <div className="w-5 h-5 rounded-full border border-black bg-zinc-800 overflow-hidden relative">
                      <Image
                        src="/user-avatar.jpg"
                        alt="Admin Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="w-5 h-5 rounded-full border border-black bg-zinc-700 text-[8px] font-bold text-white flex items-center justify-center">
                      JD
                    </div>
                    <div className="w-5 h-5 rounded-full border border-black bg-[#FF272A] text-[8px] font-bold text-white flex items-center justify-center">
                      +2
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
