import { BookOpen } from "lucide-react";

export default function ClassroomPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Classroom
        </h1>
      </div>
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <p>Courses and lessons will be implemented in Phase 4.</p>
        <p className="text-sm mt-2">Modules, video lessons, progress tracking, and access controls.</p>
      </div>
    </div>
  );
}
