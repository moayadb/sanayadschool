"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  CheckCircle,
  Circle,
  Lock,
  Clock,
  BookOpen,
  Award,
  ChevronDown,
  ChevronRight,
  FileText,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  order: number;
  videoUrl: string | null;
  videoType: string | null;
  content: string | null;
  transcript: string | null;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  order: number;
  dripDays: number | null;
  lessonCount: number;
  lessons: Lesson[];
}

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
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  enrolled: boolean;
  enrolledAt?: Date;
  canAccess: boolean;
  modules: Module[];
}

export function CourseDetail() {
  const params = useParams();
  const courseSlug = params.courseSlug as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [courseSlug]);

  const fetchCourse = async () => {
    try {
      // First fetch course list to get course ID from slug
      const listRes = await fetch(`/api/courses?groupId=placeholder`);
      if (!listRes.ok) throw new Error("Failed to fetch courses");
      const listData = await listRes.json();
      const courseInfo = listData.courses.find((c: any) => c.slug === courseSlug);
      
      if (!courseInfo) {
        toast.error("Course not found");
        return;
      }

      const res = await fetch(`/api/courses/${courseInfo.id}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      const data = await res.json();
      setCourse(data.course);
      
      // Expand first module by default
      if (data.course.modules.length > 0) {
        setExpandedModules(new Set([data.course.modules[0].id]));
        // Set first lesson as active
        if (data.course.modules[0].lessons.length > 0) {
          setActiveLesson(data.course.modules[0].lessons[0]);
        }
      }
    } catch (error) {
      toast.error("Failed to load course");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const handleMarkComplete = async () => {
    if (!activeLesson || !course) return;

    setMarkingComplete(true);
    try {
      const res = await fetch("/api/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          completed: !activeLesson.completed,
        }),
      });

      if (!res.ok) throw new Error("Failed to update progress");

      // Update local state
      setActiveLesson((prev) =>
        prev ? { ...prev, completed: !prev.completed } : null
      );

      // Refresh course data
      fetchCourse();

      toast.success(activeLesson.completed ? "Marked incomplete" : "Lesson completed!");
    } catch (error) {
      toast.error("Failed to update progress");
    } finally {
      setMarkingComplete(false);
    }
  };

  const getVideoEmbedUrl = (videoUrl: string, videoType: string | null) => {
    if (!videoType || videoType === "self-hosted") return videoUrl;

    // Extract video ID from various platforms
    if (videoType === "youtube") {
      const match = videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
      return match ? `https://www.youtube.com/embed/${match[1]}` : videoUrl;
    }
    if (videoType === "vimeo") {
      const match = videoUrl.match(/vimeo\.com\/(\d+)/);
      return match ? `https://player.vimeo.com/video/${match[1]}` : videoUrl;
    }
    return videoUrl;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
          </div>
          <Skeleton className="h-[500px] rounded-lg" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold">Course not found</h1>
        <Link href="/classroom">
          <Button variant="outline" className="mt-4">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Classroom
          </Button>
        </Link>
      </div>
    );
  }

  if (!course.enrolled && !course.canAccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Lock className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Course Locked</h1>
        <p className="text-muted-foreground mb-6">
          {course.unlockLevel
            ? `This course unlocks at level ${course.unlockLevel}`
            : "Premium access required"}
        </p>
        <Link href="/classroom">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Classroom
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/classroom">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Classroom
          </Button>
        </Link>
        {course.enrolled && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {course.completedLessons} / {course.totalLessons} lessons
            </span>
            <div className="w-32">
              <Progress value={course.progressPercent} className="h-2" />
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black relative">
              {activeLesson?.videoUrl ? (
                <iframe
                  src={getVideoEmbedUrl(
                    activeLesson.videoUrl,
                    activeLesson.videoType
                  )}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <Play className="h-16 w-16 text-gray-600" />
                </div>
              )}
            </div>
          </Card>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{course.title}</h1>
              {activeLesson && (
                <p className="text-lg text-muted-foreground mt-1">
                  {activeLesson.title}
                </p>
              )}
            </div>
            {course.enrolled && activeLesson && (
              <Button
                onClick={handleMarkComplete}
                disabled={markingComplete}
                variant={activeLesson.completed ? "outline" : "default"}
                className="gap-2"
              >
                <CheckCircle
                  className={cn(
                    "h-4 w-4",
                    activeLesson.completed && "fill-current"
                  )}
                />
                {activeLesson.completed ? "Completed" : "Mark Complete"}
              </Button>
            )}
          </div>

          {activeLesson?.content && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Lesson Notes
                </h3>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
              </CardContent>
            </Card>
          )}

          {activeLesson?.transcript && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3">Transcript</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {activeLesson.transcript}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Module Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Course Content
              </h2>

              <div className="space-y-2">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id}>
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {expandedModules.has(module.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-medium text-sm">
                          {moduleIndex + 1}. {module.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {module.lessons.length} lessons
                      </span>
                    </button>

                    <AnimatePresence>
                      {expandedModules.has(module.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="ml-6 space-y-1">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <button
                                key={lesson.id}
                                onClick={() => setActiveLesson(lesson)}
                                className={cn(
                                  "w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors",
                                  activeLesson?.id === lesson.id
                                    ? "bg-blue-50 text-blue-700"
                                    : "hover:bg-gray-50"
                                )}
                              >
                                {lesson.completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Circle className="h-4 w-4 text-gray-300" />
                                )}
                                <span className="flex-1 truncate">
                                  {lessonIndex + 1}. {lesson.title}
                                </span>
                                {lesson.videoUrl && (
                                  <Video className="h-3 w-3 text-gray-400" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Course Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Progress</span>
                <span className="font-semibold">{course.progressPercent}%</span>
              </div>
              <Progress value={course.progressPercent} className="h-2" />
              <div className="pt-2 border-t space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.moduleCount} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span>{course.totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span>
                    {course.completedLessons} of {course.totalLessons}{" "}
                    completed
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
