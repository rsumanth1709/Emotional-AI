"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  Check,
  Scale,
  X,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthShowcase from "@/components/auth/AuthShowcase";

export default function SignupPage() {
  const { signup, user, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  // Legal viewer modal: "terms" | "privacy" | null
  const [activeLegalModal, setActiveLegalModal] = useState<"terms" | "privacy" | null>(null);

  // Password strength computation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ["Weak", "Good", "Strong"];
  const strengthColors = ["bg-rose-500", "bg-amber-500", "bg-emerald-500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setError("You must read and agree to the Terms & Conditions and Privacy Policy to create an account.");
      toast.error("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    const cleanUsername = username.trim().replace(/\s+/g, "_");
    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters long.");
      toast.error("Username must be at least 3 characters long.");
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      setError("Username can only contain letters, numbers, underscores (_), hyphens (-), and dots (.).");
      toast.error("Invalid characters in username.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signup({
        email: email.trim(),
        username: cleanUsername,
        full_name: fullName.trim() || undefined,
        password,
        consent_given: acceptedTerms,
      });
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      let errorMessage = "Registration failed. Please try again.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail[0]?.msg || errorMessage;
        }
      } else if (err.response?.status === 405) {
        errorMessage = "Method Not Allowed — please ensure the FastAPI backend is running on http://localhost:8000.";
      } else if (err.message === "Network Error" || !err.response) {
        errorMessage = "Cannot connect to the server. Please ensure the backend server is running on port 8000.";
      }

      // Convert raw regex pattern messages into friendly instructions
      if (
        errorMessage.includes("String should match pattern") ||
        errorMessage.includes("pattern") ||
        errorMessage.includes("^[a-zA-Z0-9")
      ) {
        errorMessage = "Username can only contain letters, numbers, underscores (_), hyphens (-), and dots (.).";
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030712] text-white flex flex-col lg:grid lg:grid-cols-12 overflow-x-hidden">
      {/* ── LEFT SHOWCASE HERO (Desktop lg:col-span-7) ─────────────────────── */}
      <div className="hidden lg:flex lg:col-span-7 bg-slate-950/80 border-r border-slate-800/80 relative">
        <AuthShowcase />
      </div>

      {/* ── RIGHT AUTHENTICATION PORTAL (Mobile 100% / Desktop lg:col-span-5) ── */}
      <div className="flex-1 lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative min-h-screen">
        {/* Ambient background lighting */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navigation Row */}
        <div className="relative z-10 flex items-center justify-between pb-6">
          {/* Mobile Logo Only */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <img
              src="/logo.png"
              alt="MindCare AI"
              className="w-9 h-9 rounded-full object-cover shadow-md shadow-purple-500/20"
            />
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
              MindCare AI
            </span>
          </div>

          <div className="ml-auto text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>

        {/* Main Auth Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md mx-auto my-auto space-y-5"
        >
          {/* Card Header */}
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Private & Secure</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Create Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Start your confidential, emotion-aware mental wellness journey.
            </p>
          </div>

          {/* Primary Action: Official Google Sign-In Button */}
          <div className="space-y-3">
            <GoogleSignInButton
              label="Sign up with Google"
              onBeforeClick={() => {
                if (!acceptedTerms) {
                  setError("Please review and agree to the Terms & Conditions and Privacy Policy before continuing with Google.");
                  toast.error("Please agree to the Terms & Conditions and Privacy Policy first.", {
                    id: "terms-required-toast",
                  });
                  return false;
                }
                return true;
              }}
            />

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#030712] px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Or continue with email
                </span>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-500/15 border border-rose-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-rose-300 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            {/* Full Name & Username in 2 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>Full Name (Optional)</span>
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sumanth"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-purple-400" />
                    <span>Username</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-normal">letters, numbers, _, -, .</span>
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s+/g, "_"))}
                  placeholder="e.g. sumanth_01"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-cyan-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Password Field with Show/Hide & Strength Meter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-purple-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          strength >= step
                            ? strengthColors[strength - 1]
                            : "bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Password strength:</span>
                    <span
                      className={`font-bold ${
                        strength === 3
                          ? "text-emerald-400"
                          : strength === 2
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {strengthLabels[strength - 1] || "Weak"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Mandatory Terms & Conditions and Privacy Policy Acceptance Checkbox */}
            <div className="pt-1">
              <label
                htmlFor="terms-and-conditions-checkbox"
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  acceptedTerms
                    ? "bg-slate-900/90 border-cyan-500/50 shadow-sm shadow-cyan-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <input
                  id="terms-and-conditions-checkbox"
                  type="checkbox"
                  required
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (e.target.checked) setError(null);
                  }}
                  className="mt-0.5 accent-cyan-500 w-4 h-4 rounded cursor-pointer flex-shrink-0"
                />
                <div className="text-[11px] text-slate-300 leading-relaxed font-normal select-none">
                  <span>I have read and agree to the </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveLegalModal("terms");
                    }}
                    className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Terms & Conditions
                  </button>
                  <span> and </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveLegalModal("privacy");
                    }}
                    className="font-bold text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                  <span>. I acknowledge that MindCare AI is non-diagnostic.</span>
                </div>
              </label>
            </div>

            {/* Submit Button (Only enables when terms are accepted) */}
            <motion.button
              whileHover={acceptedTerms ? { scale: 1.01 } : {}}
              whileTap={acceptedTerms ? { scale: 0.99 } : {}}
              type="submit"
              disabled={loading || !acceptedTerms}
              className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all mt-2 ${
                acceptedTerms && !loading
                  ? "bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 shadow-cyan-500/25 cursor-pointer"
                  : "bg-slate-800 text-slate-400 border border-slate-700/60 cursor-not-allowed opacity-60"
              }`}
              title={
                !acceptedTerms
                  ? "Please accept the Terms & Conditions and Privacy Policy to create an account"
                  : "Create your confidential account"
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Confidential Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer Security Badges with Direct Policy Links */}
        <div className="relative z-10 pt-6 border-t border-slate-900 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
          <Link
            href="/terms"
            target="_blank"
            className="hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Terms & Conditions
          </Link>
          <span>•</span>
          <Link
            href="/privacy"
            target="_blank"
            className="hover:text-slate-300 transition-colors underline underline-offset-2"
          >
            Privacy Policy
          </Link>
          <span>•</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            HIPAA-Aligned
          </span>
        </div>
      </div>

      {/* ── IN-PAGE LEGAL VIEWER MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {activeLegalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col max-h-[85vh] text-left text-white"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      activeLegalModal === "terms"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {activeLegalModal === "terms" ? (
                      <Scale className="w-5 h-5" />
                    ) : (
                      <ShieldCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold">
                      {activeLegalModal === "terms"
                        ? "Terms & Conditions"
                        : "Privacy Policy"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      MindCare AI • Last Updated October 6, 2026
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={activeLegalModal === "terms" ? "/terms" : "/privacy"}
                    target="_blank"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs flex items-center gap-1 transition-colors"
                    title="Open full page in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open Full Page</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setActiveLegalModal(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Modal Content */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-xs sm:text-sm text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                {activeLegalModal === "terms" ? (
                  <>
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Non-Diagnostic Disclaimer:</strong> MindCare AI is an artificial intelligence wellness companion and is not a healthcare provider. If in crisis, call 988 or 911 immediately.
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-white text-sm">1. Acceptance of Terms</h4>
                      <p className="text-slate-400">
                        By creating an account or using MindCare AI, you agree to comply with and be bound by these Terms. If you do not agree, do not use the service.
                      </p>

                      <h4 className="font-bold text-white text-sm">2. Personal Wellness Purpose</h4>
                      <p className="text-slate-400">
                        The service provides emotional reflections, habit coaching, and stress tracking for non-clinical personal wellness. AI outputs must not be interpreted as psychiatric diagnoses or medical treatments.
                      </p>

                      <h4 className="font-bold text-white text-sm">3. Confidential Account Security</h4>
                      <p className="text-slate-400">
                        You are responsible for keeping your login credentials confidential. You agree not to attempt to reverse-engineer model weights, perform harmful prompt injections, or misuse the system.
                      </p>

                      <h4 className="font-bold text-white text-sm">4. Data Deletion & Termination</h4>
                      <p className="text-slate-400">
                        You may terminate your account and erase all associated emotional logs at any time in Profile Settings.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Zero Data Selling:</strong> We never sell your personal or emotional data to third parties, advertisers, or data brokers.
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-white text-sm">1. Information We Collect</h4>
                      <p className="text-slate-400">
                        We collect your account email, username, self-reported mood ratings, journal text, and optional vocal/facial emotion valence vectors processed transiently in memory.
                      </p>

                      <h4 className="font-bold text-white text-sm">2. 256-Bit AES Field Encryption</h4>
                      <p className="text-slate-400">
                        Personal reflections and journals are encrypted at the field level before database storage. Conversations are never used to train public third-party foundation models.
                      </p>

                      <h4 className="font-bold text-white text-sm">3. Your Privacy Rights</h4>
                      <p className="text-slate-400">
                        You have the right to inspect, export, or permanently delete your entire emotional history at any time without penalty.
                      </p>

                      <h4 className="font-bold text-white text-sm">4. Third-Party Authentication</h4>
                      <p className="text-slate-400">
                        When using Google Sign-In, we receive only your verified email, name, and profile picture avatar from Google Identity Services.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveLegalModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Close Reader
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAcceptedTerms(true);
                    setError(null);
                    setActiveLegalModal(null);
                    toast.success("Terms & Conditions and Privacy Policy accepted!");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>I Accept & Agree</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
