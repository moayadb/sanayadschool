import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStaff } from "@/lib/get-membership";

// GET /api/posts — fetch approved posts for the feed
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    const categoryId = searchParams.get("categoryId");
    const sort = searchParams.get("sort") || "recent";
    const cursor = searchParams.get("cursor");
    const limit = 20;

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    const where: Record<string, unknown> = {
      groupId,
      status: "APPROVED",
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const orderBy =
      sort === "popular"
        ? [{ likes: { _count: "desc" as const } }, { createdAt: "desc" as const }]
        : [{ isPinned: "desc" as const }, { createdAt: "desc" as const }];

    const posts = await db.post.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem?.id;
    }

    return NextResponse.json({ posts, nextCursor });
  } catch (error) {
    console.error("Fetch posts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/posts — create a new post
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, groupId, categoryId, poll, attachments } = await req.json();

    if (!content || !groupId) {
      return NextResponse.json(
        { error: "Content and groupId are required" },
        { status: 400 }
      );
    }

    // Check membership
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: { userId: session.user.id, groupId },
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    // Check if category is read-only
    if (categoryId) {
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (category?.readOnly && !isStaff(membership.role)) {
        return NextResponse.json(
          { error: "This category is read-only" },
          { status: 403 }
        );
      }
    }

    // Check group settings for post approval
    const group = await db.group.findUnique({ where: { id: groupId } });

    // Staff posts are auto-approved; member posts go to pending
    const status =
      !group?.requirePostApproval || isStaff(membership.role)
        ? "APPROVED"
        : "PENDING";

    const post = await db.post.create({
      data: {
        content,
        authorId: session.user.id,
        groupId,
        categoryId: categoryId || null,
        status,
        poll: poll || null,
        attachments: attachments || null,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });

    // If pending, notify admins
    if (status === "PENDING") {
      const admins = await db.membership.findMany({
        where: {
          groupId,
          role: { in: ["OWNER", "ADMIN", "MODERATOR"] },
        },
        select: { userId: true },
      });

      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.userId,
          type: "NEW_POST" as const,
          title: "New post pending approval",
          body: `${session.user?.name || "A member"} submitted a new post for review.`,
          linkUrl: `/community/admin/pending`,
        })),
      });
    }

    return NextResponse.json({ post, status }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
