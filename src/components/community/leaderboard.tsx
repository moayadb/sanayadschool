"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, TrendingUp, User, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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
    if (rank === 1) return (
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        <Trophy className="h-5 w-5 text-yellow-500" />
      </motion.div>
    );
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm font-medium text-muted-foreground">{rank}</span>;
  };

  const getRankStyle = (rank: number, isCurrentUser: boolean) => {
    let baseStyle = "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ";
    if (isCurrentUser) {
      baseStyle += "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm ";
    } else if (rank === 1) {
      baseStyle += "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-sm hover:shadow-md ";
    } else if (rank === 2) {
      baseStyle += "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-sm hover:shadow-md ";
    } else if (rank === 3) {
      baseStyle += "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-sm hover:shadow-md ";
    } else {
      baseStyle += "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm ";
    }
    return baseStyle;
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
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

  const maxPoints = leaderboard[0]?.points || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-gray-200/60 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-xl">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
            >
              <Trophy className="h-6 w-6 text-yellow-500" />
            </motion.div>
            Community Leaderboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Top {leaderboard.length} of {totalMembers} members ranked by contribution points
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <AnimatePresence>
            {currentUserRank && currentUserRank > leaderboard.length && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Your Rank: #{currentUserRank}</p>
                    <p className="text-xs text-muted-foreground">Keep contributing to climb the leaderboard!</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className={getRankStyle(entry.rank, entry.isCurrentUser)}
                >
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(entry.rank)}
                  </div>

                  <Avatar className="h-10 w-10 ring-2 ring-offset-1 ring-transparent hover:ring-gray-200 transition-all">
                    <AvatarImage src={entry.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">
                        {entry.name || "Anonymous"}
                      </p>
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs font-normal">
                        {entry.levelName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Level {entry.level}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <motion.div 
                      className="flex items-center gap-1 text-sm font-bold text-gray-900"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Sparkles className="h-3 w-3 text-yellow-500" />
                      {entry.points.toLocaleString()}
                    </motion.div>
                    <div className="w-24 mt-1">
                      <Progress 
                        value={(entry.points / maxPoints) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {leaderboard.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground"
            >
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No members yet</p>
              <p className="text-sm mt-1">Be the first to join and earn points!</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
