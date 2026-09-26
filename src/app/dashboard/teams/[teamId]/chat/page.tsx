"use client";

import HubChat from "@/components/hub/HubChat";

export default function TeamChatPage({ params }: { params: { teamId: string } }) {
  return (
    <HubChat
      apiBase={`/api/teams/${params.teamId}`}
      emptyLabel="No messages yet. Start the conversation with your team."
    />
  );
}
