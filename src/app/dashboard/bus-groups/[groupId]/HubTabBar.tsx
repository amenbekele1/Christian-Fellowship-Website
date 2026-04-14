"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, CheckSquare, Paperclip, Video } from "lucide-react";

const tabs = [
  { label: "Chat", icon: MessageSquare, path: "chat" },
  { label: "Tasks", icon: CheckSquare, path: "tasks" },
  { label: "Files", icon: Paperclip, path: "files" },
  { label: "Meeting", icon: Video, path: "meeting" },
];

export default function HubTabBar({ groupId }: { groupId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
      {tabs.map(({ label, icon: Icon, path }) => {
        const href = `/dashboard/bus-groups/${groupId}/${path}`;
        const active = pathname.endsWith(`/${path}`);
        return (
          <Link
            key={path}
            href={href}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              active
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}
