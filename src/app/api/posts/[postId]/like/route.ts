import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/posts/[postId]/like — toggle like on a post
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

    const post = await db.post.findUnique({ where: { id: postId } });
    if (!post || post.status !== "APPROVED") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingLike = await db.like.findUnique({
      where: { userId_postId: { userId: session.user.id, postId } },
    });

    if (existingLike) {
      // Unlike
      await db.like.delete({ where: { id: existingLike.id } });

      // Decrement author's points
      if (post.authorId !== session.user.id) {
        await db.membership.updateMany({
          where: { userId: post.authorId, groupId: post.groupId },
          data: { points: { decrement: 1 } },
        });
      }

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.like.create({
        data: {
          userId: session.user.id,
          postId,
        },
      });

      // Increment author's points and check level up
      if (post.authorId !== session.user.id) {
        const membership = await db.membership.update({
          where: {
            userId_groupId: { userId: post.authorId, groupId: post.groupId },
          },
          data: { points: { increment: 1 } },
        });

        // Check for level up
        const nextLevel = await db.levelConfig.findFirst({
          where: {
            groupId: post.groupId,
            level: membership.level + 1,
            minPoints: { lte: membership.points },
          },
        });

        if (nextLevel) {
          await db.membership.update({
            where: { id: membership.id },
            data: { level: nextLevel.level },
          });

          await db.notification.create({
            data: {
              userId: post.authorId,
              type: "LEVEL_UP",
              title: `You've reached Level ${nextLevel.level}: ${nextLevel.name}!`,
              body: `Congratulations! You now have ${membership.points} points.`,
            },
          });
        }

        // Notify the post author about the like
        await db.notification.create({
          data: {
            userId: post.authorId,
            type: "NEW_LIKE",
            title: `${session.user?.name || "Someone"} liked your post`,
            linkUrl: `/community/post/${postId}`,
          },
        });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Like toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
