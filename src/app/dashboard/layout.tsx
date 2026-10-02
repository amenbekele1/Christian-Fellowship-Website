import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardMobileNav } from "@/components/layout/DashboardMobileNav";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { PushPrompt } from "@/components/ui/PushPrompt";
import { BadgeClearer } from "@/components/ui/BadgeClearer";
import { RouterRefresher } from "@/components/ui/RouterRefresher";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/dashboard");

  // Teams the person belongs to or leads, for the menu's Serving section.
  // The layout persists across navigation, so this runs on load and on
  // refresh only — not on every page change.
  const userId = session.user.id;
  const isGuardian = session.user.role === "GUARDIAN";
  const teamRows = await prisma.serviceTeam.findMany({
    where: { OR: [{ leaderId: userId }, { members: { some: { userId } } }] },
    select: { id: true, name: true, label: true, leaderId: true },
    orderBy: { label: "asc" },
  });
  const teams = teamRows.map((t) => ({
    id: t.id,
    name: t.name,
    label: t.label,
    isLeader: t.leaderId === userId || isGuardian,
  }));
  const user = {
    name: session.user.name ?? "",
    role: session.user.role,
    serviceTeams: session.user.serviceTeams ?? [],
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <DashboardSidebar user={user} teams={teams} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top nav */}
        <DashboardMobileNav user={user} teams={teams} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
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
