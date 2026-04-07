import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/group/[groupId] - Get group details
export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await db.group.findUnique({
      where: { id: params.groupId },
      include: {
        categories: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { memberships: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is a member
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: params.groupId,
        },
      },
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description,
        coverImage: group.coverImage,
        icon: group.icon,
        rules: group.rules,
        welcomeMessage: group.welcomeMessage,
        memberCount: group._count.memberships,
        isMember: !!membership,
        userRole: membership?.role || null,
        categories: group.categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        })),
      },
    });
  } catch (error) {
    console.error("[GROUP_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/group/[groupId] - Update group (admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin permissions
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: params.groupId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await req.json();
    const { description, coverImage, icon, rules, welcomeMessage } = body;

    const group = await db.group.update({
      where: { id: params.groupId },
      data: {
        ...(description && { description }),
        ...(coverImage !== undefined && { coverImage }),
        ...(icon !== undefined && { icon }),
        ...(rules !== undefined && { rules }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
      },
    });

    return NextResponse.json({ group });
  } catch (error) {
    console.error("[GROUP_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
