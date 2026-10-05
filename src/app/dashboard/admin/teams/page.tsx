import TeamLeaders from "@/components/admin/TeamLeaders";

/** Admin → Serving Teams: create, rename and remove teams; choose team leaders. */
export default function AdminTeamsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <TeamLeaders />
    </div>
  );
}
