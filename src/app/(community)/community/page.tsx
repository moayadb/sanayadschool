import { MessageSquareText } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareText className="h-6 w-6" />
          Community
        </h1>
      </div>
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <p>Community feed will be implemented in Phase 2.</p>
        <p className="text-sm mt-2">Posts, categories, comments, likes, and approval queue.</p>
      </div>
    </div>
  );
}
