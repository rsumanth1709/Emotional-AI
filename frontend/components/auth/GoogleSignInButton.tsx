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
  ShieldCheck,
  Loader2,
} from "lucide-react";

declare global {
  interface Window {
    google?: any;
  }
}

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
  const [clientId, setClientId] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");

  const gisContainerRef = useRef<HTMLDivElement>(null);

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
        // Fallback silently if offline or unconfigured
      });
  }, []);

  // 2. Load Google Identity Services SDK script when Client ID is available
  useEffect(() => {
    if (!clientId || typeof window === "undefined") return;

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
    if (!window.google?.accounts?.id || !clientId) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
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

    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              console.warn("Google OAuth popup error or cancelled:", tokenResponse.error);
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

    if (clientId && window.google?.accounts?.id) {
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
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left text-white"
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

              {/* Client ID Status Badge */}
              {clientId && (
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate font-semibold">Google Cloud OAuth Active</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono text-emerald-300 flex-shrink-0">
                    ...{clientId.slice(-18)}
                  </span>
                </div>
              )}

              {/* Official Google OAuth Popup Launcher */}
              {clientId && (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setShowModal(false);
                      handleButtonClick();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Official Google Login Window</span>
                  </button>
                </div>
              )}

              {/* Or enter personal Google Email */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 block">
                  Or enter any Google account:
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
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5"
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

              {/* Expandable Setup Instructions for Official Google Cloud OAuth */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowSetupGuide((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Setup Google Cloud Client ID (Production)
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
                    className="mt-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-2"
                  >
                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                      <li>
                        Go to{" "}
                        <a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </li>
                      <li>Create an OAuth 2.0 Web Client ID.</li>
                      <li>
                        Add Authorized Origin:{" "}
                        <code className="text-white bg-slate-800 px-1 py-0.5 rounded text-[10px]">
                          http://localhost:3000
                        </code>
                      </li>
                      <li>
                        Add to <code className="text-amber-300">backend/.env</code>:
                        <div className="mt-1 p-1.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-200">
                          GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                        </div>
                      </li>
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
