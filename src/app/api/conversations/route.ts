import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/conversations - List user's conversations
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

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

    // Find or create conversation with admin/instructor
    let conversation = await db.instructorConversation.findFirst({
      where: {
        groupId,
        memberId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // If no conversation exists, find an admin to chat with
    if (!conversation) {
      const adminMember = await db.membership.findFirst({
        where: {
          groupId,
          role: { in: ["OWNER", "ADMIN"] },
        },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      if (adminMember) {
        conversation = await db.instructorConversation.create({
          data: {
            groupId,
            memberId: session.user.id,
          },
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 20,
              include: {
                sender: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        });
      }
    }

    // Get all conversations for this user (including their name)
    const conversations = conversation ? [conversation] : [];

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("[CONVERSATIONS_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
