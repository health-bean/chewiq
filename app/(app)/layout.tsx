import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OnboardingCheck } from "@/components/layout/OnboardingCheck";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingCheck>
      <div className="flex min-h-dvh flex-col">
        <Header />

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        <MobileNav />
      </div>
    </OnboardingCheck>
  );
}
