"use client";

import { useEffect, useState } from "react";
import { Search, Users, Crown, Shield, User, MoreHorizontal } from "lucide-react";
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
    const colors: Record<string, string> = {
      OWNER: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
      MODERATOR: "bg-green-100 text-green-800 border-green-200",
      BILLING_MANAGER: "bg-purple-100 text-purple-800 border-purple-200",
      MEMBER: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <Badge variant="outline" className={colors[role] || colors.MEMBER}>
        <span className="flex items-center gap-1">
          {roleIcons[role]}
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
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
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
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{members.length} members</span>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card key={member.id} className={member.isCurrentUser ? "border-primary/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={member.image || undefined} />
                  <AvatarFallback>
                    {member.name?.charAt(0) || member.email.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {member.name || "Anonymous"}
                    </p>
                    {member.isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {member.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {getRoleBadge(member.role)}
                    <Badge variant="outline" className="text-xs">
                      L{member.level} · {member.points} pts
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {member.bio}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No members found</p>
          <p className="text-sm">Try adjusting your search</p>
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <Button variant="outline" onClick={() => {}}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
