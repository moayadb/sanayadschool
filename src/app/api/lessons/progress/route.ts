import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/lessons/progress - Mark lesson as complete/incomplete
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lessonId, completed, checklistProgress } = body;

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID required" }, { status: 400 });
    }

    // Get lesson with course info to verify enrollment
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    // Check enrollment
    const enrollment = await db.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: lesson.module.courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Upsert progress
    const progress = await db.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId,
        },
      },
      update: {
        completed: completed ?? true,
        completedAt: completed ? new Date() : null,
        checklistProgress: checklistProgress || undefined,
      },
      create: {
        userId: session.user.id,
        lessonId: lessonId,
        completed: completed ?? true,
        completedAt: completed ? new Date() : null,
        checklistProgress: checklistProgress || undefined,
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("[LESSON_PROGRESS_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
