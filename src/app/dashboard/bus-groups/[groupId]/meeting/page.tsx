"use client";

import { useEffect, useState } from "react";
import HubMeeting from "@/components/hub/HubMeeting";

export default function MeetingPage({ params }: { params: { groupId: string } }) {
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    fetch(`/api/bus-groups/${params.groupId}`)
      .then((r) => r.json())
      .then((g) => setGroupName(g.name ?? ""))
      .catch(() => {});
  }, [params.groupId]);

  return (
    <HubMeeting
      apiBase={`/api/bus-groups/${params.groupId}`}
      roomPrefix={`wecf-bus-${params.groupId.replace(/[^a-z0-9]/gi, "")}`}
      hubName={groupName}
    />
  );
}
