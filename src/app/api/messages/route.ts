import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/messages - Send a message
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, content } = body;

    if (!conversationId || !content?.trim()) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Get conversation to check permissions
    const conversation = await db.instructorConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Check if user is member of the group
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: conversation.groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Determine receiver (the admin of the group)
    const adminMember = await db.membership.findFirst({
      where: {
        groupId: conversation.groupId,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    const receiverId = adminMember?.userId || conversation.memberId;

    // Create message
    const message = await db.instructorMessage.create({
      data: {
        conversationId,
        senderId: session.user.id,
        receiverId: receiverId === session.user.id ? conversation.memberId : receiverId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update conversation updatedAt
    await db.instructorConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("[MESSAGES_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
