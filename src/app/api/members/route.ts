import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/members - Get all community members
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await db.group.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!group) {
      return NextResponse.json({ error: "No group found" }, { status: 404 });
    }

    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: group.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      groupId: group.id,
      status: "ACTIVE",
    };

    if (role && role !== "ALL") {
      where.role = role;
    }

    const members = await db.membership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            createdAt: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        { points: "desc" },
      ],
      take: limit,
      skip: offset,
    });

    // Filter by search term if provided
    let filteredMembers = members;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMembers = members.filter(
        (m) =>
          m.user.name?.toLowerCase().includes(searchLower) ||
          m.user.email?.toLowerCase().includes(searchLower) ||
          m.user.bio?.toLowerCase().includes(searchLower)
      );
    }

    // Get level configs
    const levelConfigs = await db.levelConfig.findMany({
      where: { groupId: group.id },
    });

    // Enrich with level names
    const enriched = filteredMembers.map((member) => {
      const levelConfig = levelConfigs.find((l) => l.level === member.level);
      return {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
        bio: member.user.bio,
        joinedAt: member.joinedAt,
        role: member.role,
        points: member.points,
        level: member.level,
        levelName: levelConfig?.name || `Level ${member.level}`,
        isCurrentUser: member.user.id === session.user?.id,
      };
    });

    const total = await db.membership.count({ where: { ...where } });

    return NextResponse.json({
      members: enriched,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
