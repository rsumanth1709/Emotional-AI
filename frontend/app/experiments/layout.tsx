"use client";

import AdminGuard from "@/components/auth/AdminGuard";

export default function ExperimentsLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
