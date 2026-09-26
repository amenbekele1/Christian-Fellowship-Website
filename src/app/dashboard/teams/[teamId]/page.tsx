import { redirect } from "next/navigation";

export default function TeamIndex({ params }: { params: { teamId: string } }) {
  redirect(`/dashboard/teams/${params.teamId}/chat`);
}
