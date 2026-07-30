"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Mail, Lock, AlertCircle, Sparkles, KeyRound, ArrowRight, Lightbulb } from "lucide-react";
import { toast } from "react-hot-toast";
import ThreeLampCanvas from "@/components/auth/ThreeLampCanvas";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [lampOn, setLampOn] = useState(false); // Starts dark until cord is pulled

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      toast.success("Welcome back to MindCare AI!");
      router.push("/dashboard");
    } catch (err: any) {
      let errorMessage = "Invalid email or password.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message === "Network Error" || !err.response) {
        errorMessage = "Cannot connect to the server. Please ensure the backend is running.";
      }
      setError(errorMessage);
      toast.error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("rsumanth4377@gmail.com");
    setPassword("password123");
    toast.success("Demo credentials filled!");
  };

  return (
    <div className="min-h-screen bg-[#05060f] relative overflow-hidden flex flex-col items-center justify-center p-6">
      
      {/* ── AMBIENT BACKGROUND GLOW ────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full blur-[120px] transition-opacity duration-700 ${lampOn ? "bg-violet-900/20 opacity-100" : "opacity-0"}`} />
        <div className={`absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full blur-[120px] transition-opacity duration-700 ${lampOn ? "bg-amber-600/15 opacity-100" : "opacity-0"}`} />
      </div>

      {/* ── MAIN AUTH STAGE WITH THREE.JS 3D LAMP ───────────────────────── */}
      <div className="relative max-w-md w-full flex flex-col items-center z-10">

        {/* Three.js WebGL 3D Lamp Canvas Component */}
        <ThreeLampCanvas
          focusedField={focusedField}
          isPasswordFocused={focusedField === "password"}
          hasError={!!error}
          isOn={lampOn}
          onToggleLight={(state) => setLampOn(state)}
        />

        {/* Floating Instruction Banner when Lamp is OFF */}
        {!lampOn && (
          <motion.button
            onClick={() => setLampOn(true)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0.7, 1, 0.7], y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="my-4 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer hover:bg-amber-500/20 transition-all"
          >
            <Lightbulb className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Pull the lamp string above to reveal Login</span>
          </motion.button>
        )}

        {/* Glassmorphic Auth Form Card — Appears ONLY when Lamp is ON */}
        <AnimatePresence>
          {lampOn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full rounded-3xl p-8 backdrop-blur-xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-amber-500/10 transition-all duration-300"
            >
              {/* Header */}
              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-amber-500 p-0.5 shadow-lg shadow-violet-500/20 mx-auto">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Heart className="w-7 h-7 text-amber-400 fill-amber-400/20" />
                  </div>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">Welcome Back</h1>
                <p className="text-slate-400 text-xs">
                  Log in to check-in on your mental wellness.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 bg-red-500/15 border border-red-500/30 p-3.5 rounded-2xl flex items-center gap-3 text-red-300 text-xs font-medium"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Email Address</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Password</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Quick Demo Pill */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleDemoFill}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  >
                    <KeyRound className="w-3 h-3" /> Fill Demo Login
                  </button>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-violet-600 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 hover:shadow-amber-500/40 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Logging in...</span>
                  ) : (
                    <>
                      <span>Log In to MindCare AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer Link */}
              <div className="mt-6 pt-5 border-t border-white/5 text-center text-xs text-slate-400">
                Don't have an account yet?{" "}
                <Link href="/signup" className="text-amber-400 font-bold hover:underline">
                  Create an Account
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
