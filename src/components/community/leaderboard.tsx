"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Award, TrendingUp, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  image: string | null;
  points: number;
  level: number;
  levelName: string;
  isCurrentUser: boolean;
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard?limit=50");
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      setLeaderboard(data.leaderboard);
      setCurrentUserRank(data.currentUserRank);
      setTotalMembers(data.totalMembers);
    } catch (error) {
      toast.error("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm font-medium text-muted-foreground">{rank}</span>;
  };

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    let baseStyle = "flex items-center gap-4 p-4 rounded-lg border transition-colors ";
    if (isCurrentUser) {
      baseStyle += "bg-primary/5 border-primary/20 ";
    } else if (rank <= 3) {
      baseStyle += "bg-muted/50 border-muted/50 ";
    } else {
      baseStyle += "hover:bg-muted/30 border-transparent ";
    }
    return baseStyle;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Community Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Community Leaderboard
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Top {leaderboard.length} of {totalMembers} members ranked by contribution points
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {currentUserRank && currentUserRank > leaderboard.length && (
          <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Your rank: #{currentUserRank} of {totalMembers}</span>
            </div>
          </div>
        )}

        {leaderboard.map((entry) => (
          <div key={entry.userId} className={getRankStyle(entry.rank, entry.isCurrentUser)}>
            <div className="flex items-center justify-center w-8">
              {getRankIcon(entry.rank)}
            </div>

            <Avatar className="h-10 w-10">
              <AvatarImage src={entry.image || undefined} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">
                  {entry.name || "Anonymous"}
                </p>
                {entry.isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Level {entry.level}</span>
                <span>·</span>
                <span className="text-primary font-medium">{entry.points} pts</span>
              </div>
            </div>

            <Badge variant="outline" className="shrink-0">
              {entry.levelName}
            </Badge>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No members yet</p>
            <p className="text-sm">Be the first to join and earn points!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
