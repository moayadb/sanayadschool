"use client";

import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bell className="h-6 w-6" />
        Notifications
      </h1>
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <p>Notifications will be implemented in Phase 6.</p>
        <p className="text-sm mt-2">In-app, push, and email notifications with preferences.</p>
      </div>
    </div>
  );
}
