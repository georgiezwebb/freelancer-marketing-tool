"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/**
 * After sign-in/sign-up (including modal), send signed-in users to the dashboard.
 */
export function SignedInDashboardRedirect() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    router.replace("/dashboard");
  }, [isLoaded, isSignedIn, router]);

  return null;
}
