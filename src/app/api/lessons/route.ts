import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/lessons - Create new lesson (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { moduleId, title, videoUrl, content } = body;

    if (!moduleId || !title) {
      return NextResponse.json({ error: "Module ID and title required" }, { status: 400 });
    }

    // Get module with course info to check permissions
    const module = await db.module.findUnique({
      where: { id: moduleId },
      include: { course: { include: { group: true } } },
    });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Check admin permissions
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: module.course.groupId,
        },
      },
    });

    if (!membership || !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get current lesson count for ordering
    const lessonCount = await db.lesson.count({
      where: { moduleId },
    });

    // Determine video type from URL
    let videoType = null;
    if (videoUrl) {
      if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
        videoType = "youtube";
      } else if (videoUrl.includes("vimeo.com")) {
        videoType = "vimeo";
      } else {
        videoType = "self-hosted";
      }
    }

    const lesson = await db.lesson.create({
      data: {
        title,
        moduleId,
        order: lessonCount,
        videoUrl,
        videoType,
        content,
      },
    });

    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("[LESSONS_POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
