"use client";

import { useEffect, useState } from "react";
import HubMeeting from "@/components/hub/HubMeeting";

export default function TeamMeetingPage({ params }: { params: { teamId: string } }) {
  const [teamLabel, setTeamLabel] = useState("");

  useEffect(() => {
    fetch("/api/teams?mine=1")
      .then((r) => r.json())
      .then((teams) => {
        const t = Array.isArray(teams) ? teams.find((x: any) => x.id === params.teamId) : null;
        if (t) setTeamLabel(`${t.label} Team`);
      })
      .catch(() => {});
  }, [params.teamId]);

  return (
    <HubMeeting
      apiBase={`/api/teams/${params.teamId}`}
      roomPrefix={`wecf-team-${params.teamId.replace(/[^a-z0-9]/gi, "")}`}
      hubName={teamLabel}
    />
  );
}
