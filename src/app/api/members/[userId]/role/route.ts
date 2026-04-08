import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/members/[userId]/role - Update member role
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();
    const targetUserId = params.userId;

    if (!role || !["OWNER", "ADMIN", "MODERATOR", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Get the default group
    const group = await db.group.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!group) {
      return NextResponse.json({ error: "No group found" }, { status: 404 });
    }

    // Check if current user is OWNER or ADMIN
    const currentUserMembership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: group.id,
        },
      },
    });

    if (!currentUserMembership || !["OWNER", "ADMIN"].includes(currentUserMembership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Cannot change OWNER's role unless you're the OWNER
    const targetMembership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId: group.id,
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMembership.role === "OWNER" && currentUserMembership.role !== "OWNER") {
      return NextResponse.json({ error: "Cannot change owner's role" }, { status: 403 });
    }

    // Update role
    await db.membership.update({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId: group.id,
        },
      },
      data: { role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MEMBER_ROLE_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
