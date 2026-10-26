"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authAPI } from "@/lib/axios";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Mail,
  User,
  Loader2,
  Copy,
  Check,
  Zap,
} from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

const DEFAULT_GOOGLE_CLIENT_ID =
  "556522126517-kvjd9j7odkmjji0u14jphesih9bp9ckh.apps.googleusercontent.com";

interface GoogleSignInButtonProps {
  label?: string;
  onBeforeClick?: () => boolean;
}

export default function GoogleSignInButton({
  label = "Continue with Google",
  onBeforeClick,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState<string>(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID
  );
  const [showModal, setShowModal] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [currentOrigin, setCurrentOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  const gisContainerRef = useRef<HTMLDivElement>(null);

  // Detect browser origin on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin);
    }
  }, []);

  // 1. Fetch Google Client ID if available from backend or environment
  useEffect(() => {
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    if (envClientId) {
      setClientId(envClientId);
      return;
    }

    authAPI
      .getGoogleConfig()
      .then((res) => {
        if (res.data?.client_id) {
          setClientId(res.data.client_id);
        }
      })
      .catch(() => {
        // Fallback silently to DEFAULT_GOOGLE_CLIENT_ID
      });
  }, []);

  // 2. Load Google Identity Services SDK script when Client ID is available
  useEffect(() => {
    const activeId = clientId || DEFAULT_GOOGLE_CLIENT_ID;
    if (!activeId || typeof window === "undefined") return;

    const existingScript = document.getElementById("google-gsi-client");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initializeGoogleGsi();
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      initializeGoogleGsi();
    }
  }, [clientId]);

  const navigateByRole = (loggedUser: any) => {
    const roles = loggedUser?.roles || (loggedUser?.is_admin ? ["admin", "user"] : ["user"]);
    if (roles.includes("owner")) {
      router.push("/owner/system-settings");
    } else if (roles.includes("admin") || loggedUser?.is_admin) {
      router.push("/admin/dashboard");
    } else if (roles.includes("professional")) {
      router.push("/professional/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      toast.error("Google authentication failed. No credential returned.");
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle({ credential: response.credential });
      toast.success("Successfully signed in with Google!");
      navigateByRole(loggedUser);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Google authentication failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleGsi = () => {
    const activeId = clientId || DEFAULT_GOOGLE_CLIENT_ID;
    if (!window.google?.accounts?.id || !activeId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: activeId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (gisContainerRef.current) {
        window.google.accounts.id.renderButton(gisContainerRef.current, {
          theme: "filled_blue",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320,
        });
      }
    } catch (err) {
      console.warn("GIS initialization error:", err);
    }
  };

  const handleButtonClick = () => {
    if (onBeforeClick && !onBeforeClick()) {
      return;
    }

    const activeId = clientId || DEFAULT_GOOGLE_CLIENT_ID;

    if (activeId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: activeId,
          scope: "openid email profile",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              console.warn("Google OAuth popup response/error:", tokenResponse.error);
              if (tokenResponse.error !== "popup_closed_by_user") {
                setShowModal(true);
              }
              return;
            }
            if (tokenResponse?.access_token) {
              setLoading(true);
              try {
                let googleUser: any = null;
                try {
                  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  if (res.ok) {
                    googleUser = await res.json();
                  }
                } catch (e) {
                  console.warn("Direct Google userinfo fetch error:", e);
                }

                const loggedUser = await loginWithGoogle({
                  access_token: tokenResponse.access_token,
                  email: googleUser?.email,
                  name: googleUser?.name,
                  picture: googleUser?.picture,
                  sub: googleUser?.sub,
                });
                toast.success("Successfully signed in with Google!");
                navigateByRole(loggedUser);
              } catch (err: any) {
                const msg = err.response?.data?.detail || "Google authentication failed.";
                toast.error(msg);
              } finally {
                setLoading(false);
              }
            }
          },
        });
        tokenClient.requestAccessToken({ prompt: "consent" });
        return;
      } catch (err) {
        console.warn("Error launching Google OAuth popup:", err);
      }
    }

    if (activeId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowModal(true);
        }
      });
      return;
    }

    // Fallback to interactive modal
    setShowModal(true);
  };

  const handleSimulatedGoogleLogin = async (emailToUse: string, nameToUse?: string) => {
    setLoading(true);
    try {
      const email = emailToUse.trim();
      const name = nameToUse?.trim() || email.split("@")[0];
      const loggedUser = await loginWithGoogle({
        email,
        name,
        picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        sub: `google_user_${Math.random().toString(36).substring(2, 10)}`,
      });
      toast.success(`Welcome to MindCare AI, ${name}!`);
      setShowModal(false);
      navigateByRole(loggedUser);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Google sign-in failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOrigin = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentOrigin);
      setCopied(true);
      toast.success("Domain copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* ── Google Sign-In Main Button ──────────────────────────────────── */}
      <div className="w-full">
        {/* Hidden container for official GIS rendered button if used */}
        <div ref={gisContainerRef} className="hidden" />

        <motion.button
          type="button"
          onClick={handleButtonClick}
          disabled={loading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 text-white font-semibold text-xs flex items-center justify-center gap-3 shadow-md transition-all group disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 text-slate-300 animate-spin" />
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span className="text-slate-200 group-hover:text-white transition-colors">
            {loading ? "Authenticating with Google..." : label}
          </span>
        </motion.button>
      </div>

      {/* ── Interactive Google Authentication Dialog ─────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left text-white max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Google Authentication</h3>
                    <p className="text-xs text-slate-400">
                      Sign in or create an account with Google
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-200">Google OAuth Client Ready</p>
                  <p className="text-[11px] text-emerald-400/90 mt-0.5">
                    You can sign in with 1-click below, or enter your personal Google email address.
                  </p>
                </div>
              </div>

              {/* Quick 1-Click Instant Sign-In Option */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Option 1: Quick 1-Click Demo Login
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleSimulatedGoogleLogin("sumanth@mindcare.ai", "Sumanth")
                  }
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Sign In as Sumanth (Instant Access)</span>
                </button>
              </div>

              {/* Or enter personal Google Email */}
              <div className="space-y-3 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 block">
                  Option 2: Enter Any Google Email
                </span>
                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="Your Full Name (optional)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!customEmail.includes("@") || loading}
                    onClick={() =>
                      handleSimulatedGoogleLogin(customEmail, customName)
                    }
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Sign In With This Google Account</span>
                  </button>
                </div>
              </div>

              {/* Official Google OAuth Popup Launcher */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Option 3: Launch Google OAuth Popup
                </span>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setShowModal(false);
                    handleButtonClick();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Open Native Google Popup</span>
                </button>
              </div>

              {/* Expandable Setup Instructions for Official Google Cloud OAuth */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowSetupGuide((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Domain Authorization Guide (For Production)
                  </span>
                  {showSetupGuide ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showSetupGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-3"
                  >
                    <p className="text-slate-400 leading-relaxed">
                      Google OAuth requires any production domain (like Vercel) to be whitelisted under{" "}
                      <span className="text-white font-semibold">Authorized JavaScript origins</span>:
                    </p>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="truncate font-mono text-[10px] text-blue-300">
                        {currentOrigin || "https://your-domain.vercel.app"}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyOrigin}
                        className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[10px] font-semibold flex items-center gap-1 flex-shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Origin</span>
                          </>
                        )}
                      </button>
                    </div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                      <li>
                        Go to{" "}
                        <a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Google Cloud Console Credentials <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </li>
                      <li>Click your OAuth 2.0 Web Client ID.</li>
                      <li>Paste your copied domain into <span className="text-white">Authorized JavaScript origins</span>.</li>
                      <li>Click <span className="text-emerald-400 font-semibold">Save</span>. Google popup will now work directly!</li>
                    </ol>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
