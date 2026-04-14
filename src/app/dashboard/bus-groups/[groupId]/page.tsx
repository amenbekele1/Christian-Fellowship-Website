import { redirect } from "next/navigation";

export default function GroupHubRoot({ params }: { params: { groupId: string } }) {
  redirect(`/dashboard/bus-groups/${params.groupId}/chat`);
}
