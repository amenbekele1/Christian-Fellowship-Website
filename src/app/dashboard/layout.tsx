import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardMobileNav } from "@/components/layout/DashboardMobileNav";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { PushPrompt } from "@/components/ui/PushPrompt";
import { BadgeClearer } from "@/components/ui/BadgeClearer";
import { RouterRefresher } from "@/components/ui/RouterRefresher";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <DashboardSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top nav */}
        <DashboardMobileNav />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* PWA install prompt — mobile only */}
      <InstallPrompt />

      {/* Push notification prompt */}
      <PushPrompt />

      {/* Clears the PWA icon badge when the dashboard is opened */}
      <BadgeClearer />

      {/* Auto-refresh server-rendered pages on focus / push */}
      <RouterRefresher />
    </div>
  );
}
