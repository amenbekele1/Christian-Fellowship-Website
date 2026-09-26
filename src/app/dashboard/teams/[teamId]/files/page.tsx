"use client";

import HubFiles from "@/components/hub/HubFiles";

export default function TeamFilesPage({ params }: { params: { teamId: string } }) {
  return <HubFiles apiBase={`/api/teams/${params.teamId}`} />;
}
