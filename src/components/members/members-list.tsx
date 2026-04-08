"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Search, Crown, Shield, User, MoreHorizontal, Mail, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  joinedAt: string;
  role: string;
  points: number;
  level: number;
  levelName: string;
  isCurrentUser: boolean;
}

interface MembersListProps {
  isAdmin?: boolean;
}

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MODERATOR: Shield,
  MEMBER: User,
};

const roleColors = {
  OWNER: "bg-yellow-100 text-yellow-700 border-yellow-200",
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  MODERATOR: "bg-blue-100 text-blue-700 border-blue-200",
  MEMBER: "bg-gray-100 text-gray-700 border-gray-200",
};

export function MembersList({ isAdmin }: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    let filtered = members;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(searchLower) ||
          m.email?.toLowerCase().includes(searchLower) ||
          m.bio?.toLowerCase().includes(searchLower)
      );
    }
    
    if (roleFilter !== "ALL") {
      filtered = filtered.filter((m) => m.role === roleFilter);
    }
    
    setFilteredMembers(filtered);
  }, [members, search, roleFilter]);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMembers(data.members);
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) throw new Error("Failed to update role");

      toast.success("Role updated");
      fetchMembers();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "OWNER", "ADMIN", "MODERATOR", "MEMBER"].map((role) => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(role)}
              className="capitalize"
            >
              {role === "ALL" ? "All" : role.toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{members.length}</div>
            <div className="text-sm text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {members.filter((m) => m.role === "OWNER" || m.role === "ADMIN").length}
            </div>
            <div className="text-sm text-muted-foreground">Admins</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {members.filter((m) => m.role === "MODERATOR").length}
            </div>
            <div className="text-sm text-muted-foreground">Moderators</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Math.round(members.reduce((sum, m) => sum + m.points, 0) / members.length || 0)}
            </div>
            <div className="text-sm text-muted-foreground">Avg Points</div>
          </CardContent>
        </Card>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member, index) => {
          const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || User;
          
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn("group hover:shadow-md transition-shadow", member.isCurrentUser && "border-blue-300")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.image || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {member.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{member.name || "Anonymous"}</h3>
                        {member.isCurrentUser && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={cn("text-xs capitalize", roleColors[member.role as keyof typeof roleColors])}
                        >
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {member.role.toLowerCase()}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          {member.levelName}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        {member.bio || "No bio yet"}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-xs text-muted-foreground">
                          {member.points} points
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {isAdmin && !member.isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, "ADMIN")}
                            disabled={member.role === "ADMIN"}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, "MODERATOR")}
                            disabled={member.role === "MODERATOR"}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make Moderator
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(member.id, "MEMBER")}
                            disabled={member.role === "MEMBER"}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Make Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No members found</h3>
          <p className="text-muted-foreground">
            {search ? "Try a different search term" : "This community has no members yet"}
          </p>
        </div>
      )}
    </div>
  );
}
