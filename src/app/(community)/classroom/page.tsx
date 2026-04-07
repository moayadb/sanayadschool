import { BookOpen } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDefaultGroup, isStaff } from "@/lib/get-membership";
import { db } from "@/lib/db";
import { CourseList } from "@/components/classroom/course-list";
import { redirect } from "next/navigation";

export default async function ClassroomPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const group = await getDefaultGroup();
  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Classroom
        </h1>
        <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
          <p>No community found.</p>
        </div>
      </div>
    );
  }

  // Check if user is instructor/admin
  const membership = await db.membership.findUnique({
    where: {
      userId_groupId: {
        userId: session.user.id,
        groupId: group.id,
      },
    },
  });
  const isInstructor = membership ? isStaff(membership.role) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Classroom
        </h1>
      </div>
      <CourseList groupId={group.id} isInstructor={isInstructor} />
    </div>
  );
}
