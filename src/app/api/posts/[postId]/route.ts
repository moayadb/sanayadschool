import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManagePosts } from "@/lib/get-membership";

// GET /api/posts/[postId] — get a single post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await auth();

    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, image: true } },
            _count: { select: { likes: true } },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                author: { select: { id: true, name: true, image: true } },
                _count: { select: { likes: true } },
              },
            },
          },
        },
        _count: { select: { comments: true, likes: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only show pending/rejected posts to the author or staff
    if (post.status !== "APPROVED" && session?.user?.id !== post.authorId) {
      const membership = session?.user?.id
        ? await db.membership.findUnique({
            where: {
              userId_groupId: { userId: session.user.id, groupId: post.groupId },
            },
          })
        : null;

      if (!membership || !canManagePosts(membership.role)) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
    }

    // Check if current user liked this post
    let userLiked = false;
    if (session?.user?.id) {
      const like = await db.like.findUnique({
        where: { userId_postId: { userId: session.user.id, postId } },
      });
      userLiked = !!like;
    }

    return NextResponse.json({ post, userLiked });
  } catch (error) {
    console.error("Fetch post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/posts/[postId] — delete a post (author or staff)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user is author or staff
    if (post.authorId !== session.user.id) {
      const membership = await db.membership.findUnique({
        where: {
          userId_groupId: { userId: session.user.id, groupId: post.groupId },
        },
      });
      if (!membership || !canManagePosts(membership.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await db.post.delete({ where: { id: postId } });
    return NextResponse.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
