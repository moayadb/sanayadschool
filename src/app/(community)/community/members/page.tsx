import { MembersDirectory } from "@/components/community/members-directory";

export default function MembersPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Members</h1>
      <MembersDirectory />
    </div>
  );
}
