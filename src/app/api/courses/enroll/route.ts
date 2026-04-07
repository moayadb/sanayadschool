import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/courses/enroll - Enroll in a course
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 });
    }

    // Check if course exists and user has access
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: { group: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check membership and level requirements
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

    // Check level lock
    if (course.unlockLevel && membership.level < course.unlockLevel) {
      return NextResponse.json(
        { error: `Requires level ${course.unlockLevel}` },
        { status: 403 }
      );
    }

    // Check if already enrolled
    const existing = await db.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
    }

    // Create enrollment
    const enrollment = await db.courseEnrollment.create({
      data: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("[COURSE_ENROLL]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
