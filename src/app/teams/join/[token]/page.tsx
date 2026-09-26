import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, AlertCircle, LogIn } from "lucide-react";

/**
 * Team join link.
 *
 * Requires an existing fellowship account — a visitor who is not signed in
 * is sent to login with a callback back here, so after signing in (or
 * registering, then signing in) they land straight back on this page and
 * are added to the team.
 */
export default async function TeamJoinPage({
  params,
}: {
  params: { token: string };
}) {
  const invite = await prisma.teamInviteToken.findUnique({
    where: { token: params.token },
    select: {
      id: true,
      isActive: true,
      expiresAt: true,
      team: { select: { id: true, label: true, description: true } },
    },
  });

  const session = await getServerSession(authOptions);

  // Not signed in -> bounce to login, come back here afterwards
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/teams/join/${params.token}`)}`);
  }

  const invalid =
    !invite || !invite.isActive || invite.expiresAt < new Date();

  if (invalid) {
    return (
      <Shell>
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-2">
          This link is no longer valid
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          It may have expired or been withdrawn. Ask the team leader for a new one.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-brown-800 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brown-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </Shell>
    );
  }

  const userId = session.user.id;
  const team = invite.team;

  const already = await prisma.userServiceTeam.findUnique({
    where: { userId_teamId: { userId, teamId: team.id } },
    select: { userId: true },
  });

  if (!already) {
    await prisma.$transaction([
      prisma.userServiceTeam.create({ data: { userId, teamId: team.id } }),
      prisma.teamInviteToken.update({
        where: { id: invite.id },
        data: { useCount: { increment: 1 } },
      }),
    ]);
  }

  return (
    <Shell>
      <div className="w-12 h-12 rounded-full bg-brown-100 flex items-center justify-center mx-auto mb-4">
        <Users className="w-6 h-6 text-gold-500" />
      </div>
      <h1 className="font-display text-2xl font-bold text-gray-800 mb-2">
        {already ? `You're already in the ${team.label} team` : `Welcome to the ${team.label} team`}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {team.description ??
          "You can now join the team chat, share files and start meetings."}
      </p>
      <Link
        href={`/dashboard/teams/${team.id}/chat`}
        className="inline-flex items-center gap-2 bg-brown-800 text-white font-semibold px-6 py-3 rounded-xl hover:bg-brown-700 transition-colors"
      >
        <LogIn className="w-4 h-4" /> Open the team
      </Link>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brown-50 flex items-center justify-center px-6 py-20">
      <div className="bg-white border border-brown-200 rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
        {children}
      </div>
    </div>
  );
}
