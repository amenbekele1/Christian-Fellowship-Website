"use client";

import HubFiles from "@/components/hub/HubFiles";

export default function FilesPage({ params }: { params: { groupId: string } }) {
  return <HubFiles apiBase={`/api/bus-groups/${params.groupId}`} />;
}
