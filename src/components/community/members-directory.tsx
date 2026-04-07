"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Crown, Shield, User, MoreHorizontal, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Member {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  joinedAt: string;
  role: string;
  points: number;
  level: number;
  levelName: string;
  isCurrentUser: boolean;
}

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Crown className="h-4 w-4 text-yellow-500" />,
  ADMIN: <Shield className="h-4 w-4 text-blue-500" />,
  MODERATOR: <Shield className="h-4 w-4 text-green-500" />,
  BILLING_MANAGER: <User className="h-4 w-4 text-purple-500" />,
  MEMBER: null,
};

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  BILLING_MANAGER: "Billing",
  MEMBER: "Member",
};

export function MembersDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "50");

      const res = await fetch(`/api/members?${params}`);
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data.members);
      setHasMore(data.hasMore);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode }> = {
      OWNER: { color: "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200", icon: <Crown className="h-3 w-3" /> },
      ADMIN: { color: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200", icon: <Shield className="h-3 w-3" /> },
      MODERATOR: { color: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200", icon: <Shield className="h-3 w-3" /> },
      BILLING_MANAGER: { color: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-200", icon: <User className="h-3 w-3" /> },
      MEMBER: { color: "bg-gray-100 text-gray-800 border-gray-200", icon: null },
    };
    const config = configs[role] || configs.MEMBER;

    return (
      <Badge variant="outline" className={`text-xs ${config.color}`}>
        <span className="flex items-center gap-1">
          {config.icon}
          {roleLabels[role]}
        </span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Search */}
      <motion.div 
        className="relative max-w-md"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-blue-100"
        />
      </motion.div>

      {/* Stats */}
      <motion.div 
        className="flex items-center gap-2 text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-1.5 bg-gray-100 rounded-md">
          <Users className="h-4 w-4" />
        </div>
        <span className="font-medium">{members.length} members</span>
      </motion.div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {members.map((member, index) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
            >
              <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${member.isCurrentUser ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }}>
                      <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-transparent hover:ring-blue-200 transition-all">
                        <AvatarImage src={member.image || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-medium">
                          {member.name?.charAt(0) || member.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">
                          {member.name || "Anonymous"}
                        </p>
                        {member.isCurrentUser && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">You</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {getRoleBadge(member.role)}
                        <Badge variant="outline" className="text-xs font-normal flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-yellow-500" />
                          {member.points} pts
                        </Badge>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        {member.role !== "OWNER" && (
                          <>
                            <DropdownMenuItem>Change Role</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Remove Member
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 border-t pt-2 border-gray-100">
                      {member.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {members.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 text-muted-foreground"
        >
          <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-3">
            <Users className="h-8 w-8 opacity-50" />
          </div>
          <p className="font-medium">No members found</p>
          <p className="text-sm mt-1">Try adjusting your search</p>
        </motion.div>
      )}

      {hasMore && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button variant="outline" onClick={() => {}} className="min-w-[120px]">
            Load More
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
