import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/groups/join — request to join the default group
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answers } = await req.json();

    // Get the default group
    const group = await db.group.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!group) {
      return NextResponse.json({ error: "No community found" }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.membership.findUnique({
      where: {
        userId_groupId: { userId: session.user.id, groupId: group.id },
      },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json({ error: "Already a member", status: "ACTIVE" });
      }
      if (existing.status === "BANNED") {
        return NextResponse.json({ error: "You are banned from this community" }, { status: 403 });
      }
      return NextResponse.json({ message: "Request already pending", status: "PENDING" });
    }

    const status = group.autoAcceptMembers ? "ACTIVE" : "PENDING";

    const membership = await db.membership.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: "MEMBER",
        status,
        questionAnswers: answers ? answers : undefined,
      },
    });

    // Send welcome DM if auto-accepted and welcome message exists
    if (status === "ACTIVE" && group.welcomeMessage) {
      const owner = await db.membership.findFirst({
        where: { groupId: group.id, role: "OWNER" },
        select: { userId: true },
      });

      if (owner) {
        const welcomeText = group.welcomeMessage
          .replace(/#NAME#/g, session.user.name || "Member")
          .replace(/#GROUPNAME#/g, group.name);

        const conversation = await db.instructorConversation.create({
          data: {
            memberId: session.user.id,
            groupId: group.id,
          },
        });

        await db.instructorMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: owner.userId,
            receiverId: session.user.id,
            content: welcomeText,
          },
        });

        await db.notification.create({
          data: {
            userId: session.user.id,
            type: "WELCOME",
            title: `Welcome to ${group.name}!`,
            body: welcomeText,
            linkUrl: "/messages",
          },
        });
      }
    }

    return NextResponse.json({ status: membership.status }, { status: 201 });
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
