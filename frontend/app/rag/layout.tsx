"use client";

import AdminGuard from "@/components/auth/AdminGuard";

export default function RAGLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
