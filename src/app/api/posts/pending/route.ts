import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManagePosts } from "@/lib/get-membership";

// GET /api/posts/pending?groupId=xxx — fetch pending posts for admin review
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    // Check staff permission
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: { userId: session.user.id, groupId },
      },
    });

    if (!membership || !canManagePosts(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const posts = await db.post.findMany({
      where: { groupId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Fetch pending posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
