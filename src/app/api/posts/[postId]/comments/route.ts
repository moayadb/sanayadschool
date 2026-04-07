import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/posts/[postId]/comments — create a comment or reply
export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, parentId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post || post.status !== "APPROVED") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check membership
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: { userId: session.user.id, groupId: post.groupId },
      },
    });
    if (!membership || membership.status !== "ACTIVE") {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parent = await db.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
        postId,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { likes: true } },
      },
    });

    // Notify post author (if not commenting on own post)
    if (post.authorId !== session.user.id) {
      await db.notification.create({
        data: {
          userId: post.authorId,
          type: parentId ? "NEW_REPLY" : "NEW_COMMENT",
          title: `${session.user?.name || "Someone"} ${parentId ? "replied to a comment on" : "commented on"} your post`,
          linkUrl: `/community/post/${postId}`,
        },
      });
    }

    // If replying, also notify the parent comment author
    if (parentId) {
      const parentComment = await db.comment.findUnique({ where: { id: parentId } });
      if (parentComment && parentComment.authorId !== session.user.id && parentComment.authorId !== post.authorId) {
        await db.notification.create({
          data: {
            userId: parentComment.authorId,
            type: "NEW_REPLY",
            title: `${session.user?.name || "Someone"} replied to your comment`,
            linkUrl: `/community/post/${postId}`,
          },
        });
      }
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
