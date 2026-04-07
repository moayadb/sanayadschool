import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function getMembership(groupSlug: string) {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const group = await db.group.findUnique({
    where: { slug: groupSlug },
  });
  if (!group) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId: group.id,
      },
    },
  });

  return membership;
}

export async function getDefaultGroup() {
  const group = await db.group.findFirst({
    orderBy: { createdAt: "asc" },
  });
  return group;
}

export function isStaff(role: string) {
  return ["OWNER", "ADMIN", "MODERATOR"].includes(role);
}

export function canManagePosts(role: string) {
  return ["OWNER", "ADMIN", "MODERATOR"].includes(role);
}
