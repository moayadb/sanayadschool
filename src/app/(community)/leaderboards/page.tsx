import { Trophy } from "lucide-react";

export default function LeaderboardsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Leaderboards
        </h1>
      </div>
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <p>Gamification and leaderboards will be implemented in Phase 3.</p>
        <p className="text-sm mt-2">Points, levels, custom level names, and rankings.</p>
      </div>
    </div>
  );
}
