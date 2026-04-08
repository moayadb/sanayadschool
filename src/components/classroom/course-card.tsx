"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Lock, CheckCircle, BookOpen, Clock, Award, MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseCardProps {
  course: {
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
  };
  onEnroll: (courseId: string) => Promise<void>;
  isInstructor?: boolean;
  onEdit?: (course: CourseCardProps["course"]) => void;
}

export function CourseCard({ course, onEnroll, isInstructor, onEdit }: CourseCardProps) {
  const handleEnroll = async () => {
    try {
      await onEnroll(course.id);
    } catch (error) {
      toast.error("Failed to enroll");
    }
  };

  const getAccessBadge = () => {
    if (course.enrolled) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Enrolled
        </Badge>
      );
    }
    if (course.accessType === "FREE") {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Free
        </Badge>
      );
    }
    if (course.unlockLevel) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          <Award className="h-3 w-3 mr-1" />
          Level {course.unlockLevel}
        </Badge>
      );
    }
    if (course.accessType === "PAID") {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Premium
        </Badge>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="overflow-hidden group cursor-pointer border-gray-200/60 hover:shadow-lg transition-all duration-300">
        <Link href={`/classroom/${course.slug}`}>
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
            {course.coverImage ? (
              <Image
                src={course.coverImage}
                alt={course.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            
            {/* Play button overlay */}
            {course.enrolled && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Play className="h-6 w-6 text-gray-900 ml-1" fill="currentColor" />
                </div>
              </motion.div>
            )}

            {/* Access badge */}
            <div className="absolute top-3 right-3">
              {getAccessBadge()}
            </div>

            {/* Instructor Edit Menu */}
            {isInstructor && onEdit && (
              <div className="absolute top-3 left-3">
                <DropdownMenu>
                  <DropdownMenuTrigger onClick={(e) => e.preventDefault()}>
                    <Button variant="secondary" size="icon" className="h-8 w-8 bg-white/90 hover:bg-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(course); }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Course
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </Link>

        <CardContent className="p-5">
          <Link href={`/classroom/${course.slug}`}>
            <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h3>
          </Link>
          
          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {course.description}
            </p>
          )}

          {/* Course stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{course.moduleCount} modules</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{course.lessonCount} lessons</span>
            </div>
          </div>

          {/* Progress or Enroll button */}
          {course.enrolled ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {course.completedLessons} of {course.totalLessons} lessons completed
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              {course.canAccess ? (
                <Button 
                  onClick={handleEnroll} 
                  className="w-full"
                  variant="default"
                >
                  Start Learning
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>
                    {course.unlockLevel 
                      ? `Unlocks at level ${course.unlockLevel}` 
                      : "Premium access required"}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
