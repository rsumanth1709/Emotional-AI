"use client";

import { useState } from "react";
import { authAPI } from "@/lib/axios";
import { KeyRound, ArrowLeft, Mail, Lock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await authAPI.forgotPassword(email);
      toast.success("Reset instructions generated.");
      if (res.data.reset_token) {
        setToken(res.data.reset_token);
        toast("Development Token Auto-filled", { icon: "🔑" });
      }
      setStep("reset");
    } catch {
      toast.error("Error requesting password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await authAPI.resetPassword(token, newPassword);
      toast.success("Password successfully updated. All sessions revoked.");
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-slate-800 dark:text-slate-100">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-xl space-y-6">
        <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </a>

        <div className="text-center space-y-1">
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Account Security Recovery</h1>
          <p className="text-xs text-slate-400">
            {step === "request"
              ? "Enter your verified email to receive a single-use password reset token."
              : "Enter your secure reset token and set a strong new password."}
          </p>
        </div>

        {success ? (
          <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
              Password Reset Complete
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              All active sessions have been invalidated for security. Please sign in with your new credentials.
            </p>
            <a
              href="/login"
              className="inline-block mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Log In Now
            </a>
          </div>
        ) : step === "request" ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? "Generating Token..." : "Request Reset Token"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Reset Token
              </label>
              <input
                type="text"
                required
                placeholder="Paste token here"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                New Password (min 8 chars)
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
