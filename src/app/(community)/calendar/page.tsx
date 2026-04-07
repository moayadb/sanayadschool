import { Calendar } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Calendar
        </h1>
      </div>
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <p>Events and calendar will be implemented in Phase 5.</p>
        <p className="text-sm mt-2">Recurring events, timezone conversion, RSVP, and reminders.</p>
      </div>
    </div>
  );
}
