import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories?groupId=xxx — fetch categories for a group
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    const categories = await db.category.findMany({
      where: { groupId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
