"use client";

import HubChat from "@/components/hub/HubChat";

export default function ChatPage({ params }: { params: { groupId: string } }) {
  return (
    <HubChat
      apiBase={`/api/bus-groups/${params.groupId}`}
      emptyLabel="No messages yet. Say hello!"
    />
  );
}
