import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManagePosts } from "@/lib/get-membership";

// POST /api/posts/[postId]/approve — approve or reject a pending post
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

    const { action, rejectionNote } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.status !== "PENDING") {
      return NextResponse.json(
        { error: "Post is not pending" },
        { status: 400 }
      );
    }

    // Check staff permission
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: { userId: session.user.id, groupId: post.groupId },
      },
    });

    if (!membership || !canManagePosts(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedPost = await db.post.update({
      where: { id: postId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        rejectionNote: action === "reject" ? rejectionNote || null : null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    // Notify the post author
    await db.notification.create({
      data: {
        userId: post.authorId,
        type: action === "approve" ? "POST_APPROVED" : "POST_REJECTED",
        title:
          action === "approve"
            ? "Your post has been approved!"
            : "Your post was not approved",
        body:
          action === "reject" && rejectionNote
            ? `Reason: ${rejectionNote}`
            : undefined,
        linkUrl:
          action === "approve" ? `/community/post/${postId}` : undefined,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Post approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
