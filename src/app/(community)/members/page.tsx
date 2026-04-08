import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDefaultGroup, isStaff } from "@/lib/get-membership";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MembersList } from "@/components/members/members-list";

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const group = await getDefaultGroup();
  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Members
        </h1>
        <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
          <p>No community found.</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  const membership = await db.membership.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: group.id,
      },
    },
  });
  const isAdmin = membership ? isStaff(membership.role) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Members
        </h1>
      </div>
      <MembersList isAdmin={isAdmin} />
    </div>
  );
}
