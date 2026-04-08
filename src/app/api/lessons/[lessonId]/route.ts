import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// PATCH /api/lessons/[lessonId] - Update lesson
export async function PATCH(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessonId = params.lessonId;
    const body = await req.json();
    const { title, videoUrl, content } = body;

    // Get lesson to check permissions
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check admin permissions
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: lesson.module.course.groupId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Update lesson
    const updatedLesson = await db.lesson.update({
      where: { id: lessonId },
      data: {
        ...(title && { title }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(content !== undefined && { content }),
      },
    });

    return NextResponse.json({ lesson: updatedLesson });
  } catch (error) {
    console.error("[LESSON_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/lessons/[lessonId] - Delete lesson
export async function DELETE(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lessonId = params.lessonId;

    // Get lesson to check permissions
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check admin permissions
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: lesson.module.course.groupId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Delete lesson
    await db.lesson.delete({
      where: { id: lessonId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LESSON_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
