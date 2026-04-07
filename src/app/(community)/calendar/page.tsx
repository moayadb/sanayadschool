import { Calendar as CalendarIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDefaultGroup } from "@/lib/get-membership";
import { redirect } from "next/navigation";
import { Calendar } from "@/components/calendar/calendar";

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const group = await getDefaultGroup();
  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Calendar
        </h1>
        <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
          <p>No community found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Calendar
        </h1>
      </div>
      <Calendar groupId={group.id} />
    </div>
  );
}
