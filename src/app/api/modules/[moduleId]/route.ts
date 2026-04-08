import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// PATCH /api/modules/[moduleId] - Update module
export async function PATCH(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const moduleId = params.moduleId;
    const body = await req.json();
    const { title } = body;

    // Get module to check permissions
    const module = await db.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
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

    // Update module
    const updatedModule = await db.module.update({
      where: { id: moduleId },
      data: {
        ...(title && { title }),
      },
    });

    return NextResponse.json({ module: updatedModule });
  } catch (error) {
    console.error("[MODULE_PATCH]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/modules/[moduleId] - Delete module
export async function DELETE(
  req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const moduleId = params.moduleId;

    // Get module to check permissions
    const module = await db.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
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

    // Delete module (cascade will handle lessons)
    await db.module.delete({
      where: { id: moduleId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MODULE_DELETE]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
