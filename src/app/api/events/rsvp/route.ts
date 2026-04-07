import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/events/rsvp - RSVP to an event
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, status } = body;

    if (!eventId || !status || !["GOING", "NOT_GOING", "MAYBE"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Get event details
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { group: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check membership and level requirements
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: event.groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    if (event.requiredLevel && membership.level < event.requiredLevel) {
      return NextResponse.json(
        { error: `Requires level ${event.requiredLevel}` },
        { status: 403 }
      );
    }

    // Upsert RSVP
    const rsvp = await db.eventRsvp.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
      update: {
        status,
      },
      create: {
        userId: session.user.id,
        eventId: eventId,
        status,
      },
    });

    return NextResponse.json({ rsvp });
  } catch (error) {
    console.error("[RSVP_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/events/rsvp - Remove RSVP
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    await db.eventRsvp.delete({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[RSVP_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
