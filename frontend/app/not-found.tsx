"use client";

import Link from "next/link";
import { Heart, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
      <div className="p-4 rounded-3xl bg-violet-500/10 border border-violet-500/20 mb-4">
        <Heart className="w-12 h-12 text-violet-400 animate-pulse" />
      </div>
      <h1 className="text-4xl font-extrabold text-white mb-2">404 — Page Not Found</h1>
      <p className="text-slate-400 text-sm max-w-md mb-6">
        The requested wellness page or resource could not be found.
      </p>
      <Link
        href="/dashboard"
        className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
