import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/courses/[courseId] - Get course details with modules and lessons
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courseId = params.courseId;

    // Fetch course with all details
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        group: true,
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check membership
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: course.groupId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Check enrollment
    const enrollment = await db.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    // Check if user can access (enrolled or meets level requirement)
    const canAccess =
      !!enrollment ||
      membership.level >= (course.unlockLevel || 1) ||
      course.accessType === "FREE";

    // Get lesson progress for enrolled users
    let lessonProgress: Record<string, boolean> = {};
    if (enrollment) {
      const progress = await db.lessonProgress.findMany({
        where: {
          userId: session.user.id,
          lesson: {
            module: { courseId: courseId },
          },
        },
      });
      lessonProgress = progress.reduce((acc, p) => {
        acc[p.lessonId] = p.completed;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Calculate progress
    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m.lessons.length,
      0
    );
    const completedLessons = Object.values(lessonProgress).filter(Boolean).length;
    const progressPercent =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        coverImage: course.coverImage,
        accessType: course.accessType,
        unlockLevel: course.unlockLevel,
        dripEnabled: course.dripEnabled,
        published: course.published,
        moduleCount: course.modules.length,
        totalLessons,
        completedLessons,
        progressPercent,
        enrolled: !!enrollment,
        enrolledAt: enrollment?.enrolledAt,
        canAccess,
        modules: course.modules.map((module) => ({
          id: module.id,
          title: module.title,
          order: module.order,
          dripDays: module.dripDays,
          lessonCount: module.lessons.length,
          lessons: module.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            videoUrl: lesson.videoUrl,
            videoType: lesson.videoType,
            content: lesson.content,
            transcript: lesson.transcript,
            completed: lessonProgress[lesson.id] || false,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("[COURSE_DETAIL_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
