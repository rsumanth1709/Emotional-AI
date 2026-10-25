"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthShowcase from "@/components/auth/AuthShowcase";

export default function LoginPage() {
  const { login, user, isLoading, getDefaultDashboardRoute } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-redirect if already logged in based on verified role
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getDefaultDashboardRoute());
    }
  }, [user, isLoading, router, getDefaultDashboardRoute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await login(email, password);
      toast.success("Welcome back to MindCare AI!");
      const roles = loggedUser.roles || (loggedUser.is_admin ? ["admin", "user"] : ["user"]);
      if (roles.includes("owner")) {
        router.push("/owner/system-settings");
      } else if (roles.includes("admin") || loggedUser.is_admin) {
        router.push("/admin/dashboard");
      } else if (roles.includes("professional")) {
        router.push("/professional/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      let errorMessage = "Invalid email or password.";
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
      setError(errorMessage);
      toast.error("Login failed.");
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
        {/* Ambient lighting effects */}
        <div className="absolute top-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Navigation Row */}
        <div className="relative z-10 flex items-center justify-between pb-6">
          {/* Mobile Logo Only (Hidden on Desktop because it's in the showcase) */}
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
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Main Auth Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md mx-auto my-auto space-y-6"
        >
          {/* Card Header */}
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Confidential Access</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Sign in to continue your personalized mental wellness check-ins.
            </p>
          </div>

          {/* Primary Action: Official Google Sign-In Button */}
          <div className="space-y-3">
            <GoogleSignInButton label="Continue with Google" />

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

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                <span>Email Address</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
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

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer pt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Log In to MindCare AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer Security Badges */}
        <div className="relative z-10 pt-6 border-t border-slate-900 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            256-Bit SSL Protection
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Zero Data Selling
          </span>
        </div>
      </div>
    </div>
  );
}
