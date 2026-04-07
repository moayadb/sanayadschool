import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/events - List all events with RSVP status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const view = searchParams.get("view") || "upcoming"; // 'upcoming' | 'past' | 'all'

    if (!groupId) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }

    // Check membership
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Build date filter
    const now = new Date();
    let dateFilter = {};
    
    if (view === "upcoming") {
      dateFilter = { startTime: { gte: now } };
    } else if (view === "past") {
      dateFilter = { startTime: { lt: now } };
    }

    // Fetch events with RSVP info
    const events = await db.event.findMany({
      where: {
        groupId,
        ...dateFilter,
      },
      orderBy: { startTime: view === "past" ? "desc" : "asc" },
      include: {
        _count: {
          select: { rsvps: true },
        },
        rsvps: {
          where: { userId: session.user.id },
          take: 1,
        },
      },
    });

    // Get going count for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const goingCount = await db.eventRsvp.count({
          where: {
            eventId: event.id,
            status: "GOING",
          },
        });

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          duration: event.duration,
          location: event.location,
          repeat: event.repeat,
          requiredLevel: event.requiredLevel,
          totalRsvps: event._count.rsvps,
          goingCount,
          myRsvp: event.rsvps[0]?.status || null,
          canAccess: !event.requiredLevel || membership.level >= event.requiredLevel,
        };
      })
    );

    return NextResponse.json({ events: eventsWithCounts });
  } catch (error) {
    console.error("[EVENTS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/events - Create new event (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, title, description, startTime, endTime, location, repeat } = body;

    // Check admin permissions
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const event = await db.event.create({
      data: {
        title,
        description,
        groupId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        location,
        repeat: repeat || "NONE",
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[EVENTS_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
