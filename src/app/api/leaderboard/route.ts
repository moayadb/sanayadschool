import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/leaderboard - Get top members by points
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Get leaderboard with user details
    const leaderboard = await db.membership.findMany({
      where: {
        groupId: membership.groupId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        points: "desc",
      },
      take: limit,
    });

    // Get level configs for display
    const levelConfigs = await db.levelConfig.findMany({
      where: {
        groupId: membership.groupId,
      },
      orderBy: {
        level: "asc",
      },
    });

    // Enrich with level names
    const enriched = leaderboard.map((member, index) => {
      const levelConfig = levelConfigs.find((l) => l.level === member.level);
      return {
        rank: index + 1,
        userId: member.user.id,
        name: member.user.name,
        image: member.user.image,
        points: member.points,
        level: member.level,
        levelName: levelConfig?.name || `Level ${member.level}`,
        isCurrentUser: member.user.id === session.user?.id,
      };
    });

    return NextResponse.json({
      leaderboard: enriched,
      currentUserRank: enriched.find((m) => m.isCurrentUser)?.rank || null,
      totalMembers: await db.membership.count({
        where: {
          groupId: membership.groupId,
          status: "ACTIVE",
        },
      }),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
