"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import MindCareLoading from "@/components/ui/MindCareLoading";
import { toast } from "react-hot-toast";

interface OwnerGuardProps {
  children: React.ReactNode;
}

export default function OwnerGuard({ children }: OwnerGuardProps) {
  const { user, isOwner, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isOwner) {
        toast.error("Access Denied: System Owner privileges required.", {
          id: "owner-access-denied",
        });
        router.push("/dashboard");
      }
    }
  }, [user, isOwner, authLoading, router]);

  if (authLoading || !user || !isOwner) {
    return <MindCareLoading message="Verifying System Owner Authority..." />;
  }

  return <>{children}</>;
}
