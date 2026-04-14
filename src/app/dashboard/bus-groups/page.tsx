import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Mail, MessageSquare } from "lucide-react";
import { getRoleLabel, getRoleBadgeColor } from "@/lib/utils";

export default async function BusGroupsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  // Guardians see all groups, leaders see their group, members see their group
  let groups;
  if (session.user.role === "GUARDIAN") {
    groups = await prisma.bUSGroup.findMany({
      include: {
        leader: { select: { id: true, name: true, email: true, phone: true } },
        members: { select: { id: true, name: true, email: true, phone: true, role: true } },
        _count: { select: { members: true, attendances: true } },
      },
      orderBy: { name: "asc" },
    });
  } else if (session.user.role === "BUS_LEADER") {
    groups = await prisma.bUSGroup.findMany({
      where: { leaderId: session.user.id },
      include: {
        leader: { select: { id: true, name: true, email: true, phone: true } },
        members: { select: { id: true, name: true, email: true, phone: true, role: true } },
        _count: { select: { members: true, attendances: true } },
      },
    });
  } else {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { busGroupId: true },
    });
    groups = user?.busGroupId
      ? await prisma.bUSGroup.findMany({
          where: { id: user.busGroupId },
          include: {
            leader: { select: { id: true, name: true, email: true, phone: true } },
            members: { select: { id: true, name: true, email: true, phone: true, role: true } },
            _count: { select: { members: true, attendances: true } },
          },
        })
      : [];
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">BUS Groups</h1>
        <p className="text-gray-500 mt-1">
          {session.user.role === "GUARDIAN"
            ? "All fellowship BUS groups"
            : session.user.role === "BUS_LEADER"
            ? "Your group members"
            : "Your BUS group"}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="font-semibold text-gray-600 mb-1">Not assigned to a group yet</h3>
          <p className="text-sm text-gray-400">A guardian will assign you to a BUS group soon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
              {/* Group header */}
              <div className="bg-gradient-to-r from-green-800 to-green-900 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-white text-xl">{group.name}</h2>
                    {group.description && <p className="text-green-200 text-sm mt-1">{group.description}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-amber-300 text-2xl font-display font-bold">{group._count.members}</p>
                      <p className="text-green-300 text-xs">members</p>
                    </div>
                    <Link
                      href={`/dashboard/bus-groups/${group.id}/chat`}
                      className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-medium px-4 py-2 rounded-xl border border-white/20"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Open Hub
                    </Link>
                  </div>
                </div>
              </div>

              {/* Leader */}
              <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Group Leader</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-sm">
                    {group.leader.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{group.leader.name}</p>
                    <p className="text-xs text-gray-500">{group.leader.email}</p>
                  </div>
                </div>
              </div>

              {/* Members */}
              <div className="px-6 pt-4 pb-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Members</p>
                {group.members.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No members assigned yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3 pb-4">
                    {group.members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-300" />
                            <p className="text-xs text-gray-400 truncate">{member.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${getRoleBadgeColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
