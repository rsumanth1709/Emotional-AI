"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Immediate check: If no token in storage, redirect straight to login
    const token = typeof window !== "undefined" ? localStorage.getItem("mindcare_token") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    // If token exists, wait for auth resolution
    if (!isLoading) {
      if (user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-medium">Entering MindCare AI...</p>
      </div>
    </div>
  );
}
