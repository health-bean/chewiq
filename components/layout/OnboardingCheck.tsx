"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    // Skip check for onboarding page itself
    if (pathname === "/onboarding") {
      setIsChecking(false);
      setIsOnboarded(true);
      return;
    }

    // Check onboarding status
    fetch("/api/onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (!data.completed) {
          router.push("/onboarding");
        } else {
          setIsOnboarded(true);
        }
      })
      .catch(() => {
        // On error, allow access (fail open)
        setIsOnboarded(true);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isOnboarded) {
    return null;
  }

  return <>{children}</>;
}
