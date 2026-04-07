import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CourseDetail } from "@/components/classroom/course-detail";

export default async function CoursePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <CourseDetail />;
}
