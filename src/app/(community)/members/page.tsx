import { Users } from "lucide-react";

export default function MembersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Members
        </h1>
      </div>
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <p>Member directory will be implemented in Phase 3.</p>
        <p className="text-sm mt-2">Profiles, search, roles, and follow system.</p>
      </div>
    </div>
  );
}
