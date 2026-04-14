import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HubTabBar from "./HubTabBar";

export default async function GroupHubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { groupId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const group = await prisma.bUSGroup.findUnique({
    where: { id: params.groupId },
    select: { id: true, name: true, description: true, leaderId: true },
  });

  if (!group) redirect("/dashboard/bus-groups");

  // Access check
  const userId = session.user.id;
  const isLeader = group.leaderId === userId || session.user.role === "GUARDIAN";

  if (!isLeader) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { busGroupId: true },
    });
    if (user?.busGroupId !== params.groupId) redirect("/dashboard/bus-groups");
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <Link
          href="/dashboard/bus-groups"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-500 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">{group.name}</h1>
            {group.description && (
              <p className="text-gray-500 text-sm mt-0.5">{group.description}</p>
            )}
          </div>
          {isLeader && (
            <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
              Leader
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <HubTabBar groupId={params.groupId} />

      {/* Page content */}
      <div className="mt-5">{children}</div>
    </div>
  );
}
