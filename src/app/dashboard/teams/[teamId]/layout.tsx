import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TeamTabBar from "./TeamTabBar";

export default async function TeamHubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { teamId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const team = await prisma.serviceTeam.findUnique({
    where: { id: params.teamId },
    select: { id: true, label: true, description: true, leaderId: true },
  });

  if (!team) redirect("/dashboard");

  const userId = session.user.id;
  const isGuardian = session.user.role === "GUARDIAN";
  const isLeader = isGuardian || team.leaderId === userId;

  // Members may view; everyone else is bounced
  if (!isLeader) {
    const membership = await prisma.userServiceTeam.findUnique({
      where: { userId_teamId: { userId, teamId: params.teamId } },
      select: { userId: true },
    });
    if (!membership) redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-500 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">
              {team.label} Team
            </h1>
            {team.description && (
              <p className="text-gray-500 text-sm mt-0.5">{team.description}</p>
            )}
          </div>
          {isLeader && (
            <span className="shrink-0 text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
              {team.leaderId === userId ? "Team Leader" : "Guardian"}
            </span>
          )}
        </div>
      </div>

      <TeamTabBar teamId={params.teamId} />

      <div className="mt-5">{children}</div>
    </div>
  );
}
