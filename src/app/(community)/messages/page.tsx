"use client";

import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        Messages
      </h1>
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <p>Instructor chat will be implemented in Phase 6.</p>
        <p className="text-sm mt-2">Real-time messaging with the community instructor only.</p>
      </div>
    </div>
  );
}
