import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CommunityFeed } from "@/components/community/community-feed";

export default async function CommunityPage() {
  const session = await auth();

  // Get the default (first) group
  const group = await db.group.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      categories: { orderBy: { order: "asc" } },
    },
  });

  if (!group) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>No community has been set up yet.</p>
      </div>
    );
  }

  // Check membership
  let memberRole = "";
  if (session?.user?.id) {
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: { userId: session.user.id, groupId: group.id },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      redirect("/community/join");
    }

    memberRole = membership.role;
  }

  return (
    <CommunityFeed
      groupId={group.id}
      groupName={group.name}
      requiresApproval={group.requirePostApproval}
      memberRole={memberRole}
      categories={group.categories}
    />
  );
}
