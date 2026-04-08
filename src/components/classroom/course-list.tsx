"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Plus } from "lucide-react";
import { CourseCard } from "./course-card";
import { CreateCourseDialog } from "./create-course-dialog";
import { EditCourseDialog } from "./edit-course-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  accessType: string;
  unlockLevel: number | null;
  dripEnabled: boolean;
  moduleCount: number;
  lessonCount: number;
  enrolled: boolean;
  enrolledAt?: Date;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  canAccess: boolean;
  modules: Array<{
    id: string;
    title: string;
    lessonCount: number;
  }>;
}

interface CourseListProps {
  groupId: string;
  isInstructor?: boolean;
}

export function CourseList({ groupId, isInstructor }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [groupId]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`/api/courses?groupId=${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCourses(data.courses);
    } catch (error) {
      toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    const res = await fetch("/api/courses/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to enroll");
    }

    toast.success("Successfully enrolled!");
    fetchCourses(); // Refresh to show updated state
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-video rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const enrolledCourses = courses.filter((c) => c.enrolled);
  const availableCourses = courses.filter((c) => !c.enrolled);

  return (
    <div className="space-y-10">
      {/* Instructor: Create Course Button */}
      {isInstructor && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
      )}

      {/* Create Course Dialog */}
      <CreateCourseDialog
        groupId={groupId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCourseCreated={fetchCourses}
      />

      {/* Edit Course Dialog */}
      <EditCourseDialog
        course={selectedCourse}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onCourseUpdated={fetchCourses}
        onCourseDeleted={fetchCourses}
      />

      {/* Enrolled Courses */}
      {enrolledCourses.length > 0 && (
        <section>
          <motion.div 
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="p-2 bg-green-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Continue Learning</h2>
            <span className="text-sm text-muted-foreground ml-2">
              ({enrolledCourses.length} enrolled)
            </span>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard 
                  course={course} 
                  onEnroll={handleEnroll} 
                  isInstructor={isInstructor}
                  onEdit={(c) => { setSelectedCourse(c); setEditDialogOpen(true); }}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Available Courses */}
      {availableCourses.length > 0 && (
        <section>
          <motion.div 
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold">Available Courses</h2>
            <span className="text-sm text-muted-foreground ml-2">
              ({availableCourses.length})
            </span>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <CourseCard 
                  course={course} 
                  onEnroll={handleEnroll}
                  isInstructor={isInstructor}
                  onEdit={(c) => { setSelectedCourse(c); setEditDialogOpen(true); }}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {courses.length === 0 && !isInstructor && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Courses will appear here once your community admin publishes them.
          </p>
        </motion.div>
      )}
    </div>
  );
}
