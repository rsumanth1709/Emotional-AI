"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { professionalAPI } from "@/lib/axios";
import MindCareLoading from "@/components/ui/MindCareLoading";
import { toast } from "react-hot-toast";

interface ProfessionalGuardProps {
  children: React.ReactNode;
}

export default function ProfessionalGuard({ children }: ProfessionalGuardProps) {
  const { user, isProfessional, isLoading: authLoading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerifiedProf, setIsVerifiedProf] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkVerification() {
      if (!authLoading) {
        if (!user) {
          router.push("/login");
          return;
        }

        if (!isProfessional) {
          toast.error("Access Denied: Healthcare Professional credentials required.");
          router.push("/professional/apply");
          return;
        }

        try {
          const res = await professionalAPI.getProfile();
          if (res.data.verification_status === "VERIFIED") {
            setIsVerifiedProf(true);
          } else if (res.data.verification_status === "PENDING") {
            toast("Your clinical credentials are currently undergoing review by our clinical board.", {
              icon: "⏳",
            });
            setIsVerifiedProf(false);
            router.push("/professional/profile");
          } else {
            toast.error(`Professional access ${res.data.verification_status.toLowerCase()}.`);
            setIsVerifiedProf(false);
            router.push("/dashboard");
          }
        } catch {
          router.push("/professional/apply");
        } finally {
          setIsVerifying(false);
        }
      }
    }

    checkVerification();
  }, [user, isProfessional, authLoading, router]);

  if (authLoading || isVerifying || !isVerifiedProf) {
    return <MindCareLoading message="Verifying Healthcare Professional Credentials..." />;
  }

  return <>{children}</>;
}
