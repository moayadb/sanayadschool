import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CourseDetail } from "@/components/classroom/course-detail";
import { getDefaultGroup, isStaff } from "@/lib/get-membership";
import { db } from "@/lib/db";

export default async function CoursePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Check if user is instructor
  const group = await getDefaultGroup();
  let isInstructor = false;
  
  if (group) {
    const membership = await db.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: group.id,
        },
      },
    });
    isInstructor = membership ? isStaff(membership.role) : false;
  }

  return <CourseDetail isInstructor={isInstructor} />;
}
