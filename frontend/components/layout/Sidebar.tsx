"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  Heart, LayoutDashboard, MessageSquare, BookOpen, 
  BarChart2, Shield, LogOut, Activity
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Support Chat", href: "/chat", icon: MessageSquare },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Analytics", href: "/analytics", icon: BarChart2 },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col justify-between p-6 h-screen sticky top-0">
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-violet-500 fill-violet-500/20 animate-pulse" />
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            MindCare AI
          </span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={active ? "nav-item-active" : "nav-item"}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {user?.is_admin && (
            <Link 
              href="/admin" 
              className={pathname === "/admin" ? "nav-item-active" : "nav-item text-rose-400/80 hover:text-rose-300"}
            >
              <Shield className="w-5 h-5" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>
      </div>

      <div className="pt-6 border-t border-white/5 space-y-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600/30 flex items-center justify-center border border-violet-500/20">
              <span className="font-semibold text-violet-300 uppercase">
                {user.username.slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user.full_name || user.username}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150 w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
