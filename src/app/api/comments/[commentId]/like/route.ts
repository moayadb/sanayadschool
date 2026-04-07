import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/comments/[commentId]/like — toggle like on a comment
export async function POST(
  req: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const existingLike = await db.like.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId } },
    });

    if (existingLike) {
      await db.like.delete({ where: { id: existingLike.id } });

      // Decrement author's points
      if (comment.authorId !== session.user.id) {
        await db.membership.updateMany({
          where: { userId: comment.authorId, groupId: comment.post.groupId },
          data: { points: { decrement: 1 } },
        });
      }

      return NextResponse.json({ liked: false });
    } else {
      await db.like.create({
        data: { userId: session.user.id, commentId },
      });

      // Increment author's points
      if (comment.authorId !== session.user.id) {
        const membership = await db.membership.update({
          where: {
            userId_groupId: {
              userId: comment.authorId,
              groupId: comment.post.groupId,
            },
          },
          data: { points: { increment: 1 } },
        });

        // Check level up
        const nextLevel = await db.levelConfig.findFirst({
          where: {
            groupId: comment.post.groupId,
            level: membership.level + 1,
            minPoints: { lte: membership.points },
          },
        });

        if (nextLevel) {
          await db.membership.update({
            where: { id: membership.id },
            data: { level: nextLevel.level },
          });
        }
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Comment like error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
