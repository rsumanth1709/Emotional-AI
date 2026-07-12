"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, User, AlertCircle, Shield } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("You must consent to proceed.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await signup({
        email,
        username,
        full_name: fullName || undefined,
        password,
        consent_given: consent,
      });
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
      toast.error("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg-hero flex items-center justify-center px-6 py-12">
      <motion.div 
        className="max-w-md w-full glass p-8 space-y-6 shadow-2xl relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center space-y-2">
          <Heart className="w-12 h-12 text-violet-500 fill-violet-500/10 mx-auto" />
          <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
          <p className="text-slate-400 text-sm">Start your confidential AI-guided mental health journey.</p>
        </div>

        {error && (
          <div className="bg-red-500/15 border border-red-500/30 p-4 rounded-xl flex items-start gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-field pl-12"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="input-field pl-12"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Full Name (Optional)</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Name"
                className="input-field pl-12"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="input-field pl-12"
              />
            </div>
          </div>

          {/* Privacy & Clinical Consent Box */}
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3">
            <div className="flex gap-2 items-start text-xs text-slate-400">
              <Shield className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p>Your chat logs and logs are encrypted. We comply with strict AI Ethics principles.</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs text-slate-300">
                I consent to MindCare AI securely storing my messages to run the emotion classifier. I understand this chatbot is NOT a replacement for medical therapy.
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
