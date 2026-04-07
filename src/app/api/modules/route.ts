import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/modules - Create new module (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, title } = body;

    if (!courseId || !title) {
      return NextResponse.json({ error: "Course ID and title required" }, { status: 400 });
    }

    // Get course to check permissions
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { group: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check admin permissions
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: course.groupId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get current module count for ordering
    const moduleCount = await db.module.count({
      where: { courseId },
    });

    const module = await db.module.create({
      data: {
        title,
        courseId,
        order: moduleCount,
      },
    });

    return NextResponse.json({ module });
  } catch (error) {
    console.error("[MODULES_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
