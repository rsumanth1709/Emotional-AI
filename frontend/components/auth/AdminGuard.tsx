"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MindCareLoading from "@/components/ui/MindCareLoading";
import { toast } from "react-hot-toast";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin) {
        toast.error("Access Denied: Administrator privileges required.", {
          id: "admin-access-denied",
        });
        router.push("/dashboard");
      }
    }
  }, [user, isAdmin, authLoading, router]);

  if (authLoading || !user || !isAdmin) {
    return <MindCareLoading message="Verifying Administrator Credentials..." />;
  }

  return <>{children}</>;
}
