import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/courses - List all courses with enrollment status
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "Group ID required" }, { status: 400 });
    }

    // Get membership to check access
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });
    
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Fetch courses with modules and enrollment info
    const courses = await db.course.findMany({
      where: { groupId, published: true },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { modules: true },
        },
        modules: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { lessons: true },
            },
          },
        },
        enrollments: {
          where: { userId: session.user.id },
          take: 1,
        },
      },
    });

    // Calculate progress for each course
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        const enrollment = course.enrollments[0];
        let progress = 0;
        let totalLessons = 0;
        let completedLessons = 0;

        if (enrollment && session.user?.id) {
          // Count total and completed lessons
          const lessons = await db.lesson.findMany({
            where: {
              module: { courseId: course.id },
            },
            include: {
              progress: {
                where: { userId: session.user.id },
              },
            },
          });

          totalLessons = lessons.length;
          completedLessons = lessons.filter((l) => l.progress[0]?.completed).length;
          progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        }

        // Calculate total lesson count
        const lessonCount = course.modules.reduce((sum, m) => sum + m._count.lessons, 0);

        return {
          id: course.id,
          title: course.title,
          slug: course.slug,
          description: course.description,
          coverImage: course.coverImage,
          accessType: course.accessType,
          unlockLevel: course.unlockLevel,
          dripEnabled: course.dripEnabled,
          order: course.order,
          moduleCount: course._count.modules,
          lessonCount,
          enrolled: !!enrollment,
          enrolledAt: enrollment?.enrolledAt,
          progress,
          totalLessons,
          completedLessons,
          canAccess: membership.level >= (course.unlockLevel || 1) || course.accessType === "FREE",
          modules: course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            lessonCount: m._count.lessons,
            dripDays: m.dripDays,
          })),
        };
      })
    );

    return NextResponse.json({ courses: coursesWithProgress });
  } catch (error) {
    console.error("[COURSES_GET]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/courses - Create new course (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { groupId, title, description, accessType, unlockLevel } = body;

    if (!groupId || !title) {
      return NextResponse.json({ error: "Group ID and title required" }, { status: 400 });
    }

    // Check admin permissions
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const course = await db.course.create({
      data: {
        title,
        slug,
        description,
        groupId,
        accessType: accessType || "FREE",
        unlockLevel: unlockLevel ? parseInt(unlockLevel) : null,
        published: true,
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[COURSES_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
