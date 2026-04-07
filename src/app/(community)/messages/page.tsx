import { MessageSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDefaultGroup } from "@/lib/get-membership";
import { redirect } from "next/navigation";
import { ChatInterface } from "@/components/messages/chat-interface";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const group = await getDefaultGroup();
  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Messages
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
          <MessageSquare className="h-6 w-6" />
          Messages
        </h1>
      </div>
      <ChatInterface groupId={group.id} currentUserId={session.user.id} />
    </div>
  );
}
