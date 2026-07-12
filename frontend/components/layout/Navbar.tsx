"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Bell } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar({ title }: { title: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-slate-950/20 backdrop-blur-md sticky top-0 z-20">
      <h1 className="text-xl font-bold tracking-tight text-white">{title}</h1>
      
      <div className="flex items-center gap-4">
        {mounted && (
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        )}
        
        <button 
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-violet-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
