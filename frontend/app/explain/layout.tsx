"use client";

import AdminGuard from "@/components/auth/AdminGuard";

export default function ExplainLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
